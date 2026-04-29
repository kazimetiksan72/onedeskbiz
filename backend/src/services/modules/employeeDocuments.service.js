const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const PDFDocument = require('pdfkit');
const env = require('../../config/env');
const { EmployeeDocument, EMPLOYEE_DOCUMENT_TYPES } = require('../../models/EmployeeDocument');
const { User } = require('../../models/User');
const { ApiError } = require('../../utils/apiError');
const { logger } = require('../../utils/logger');

const documentLabels = {
  [EMPLOYEE_DOCUMENT_TYPES.POPULATION_REGISTRY]: 'nufus-kayit-ornegi',
  [EMPLOYEE_DOCUMENT_TYPES.RESIDENCE_CERTIFICATE]: 'ikametgah-belgesi',
  [EMPLOYEE_DOCUMENT_TYPES.GRADUATION_CERTIFICATE]: 'mezuniyet-belgesi',
  [EMPLOYEE_DOCUMENT_TYPES.HEALTH_REPORT]: 'saglik-raporu',
  [EMPLOYEE_DOCUMENT_TYPES.ID_CARD_FRONT]: 'tc-kimlik-on',
  [EMPLOYEE_DOCUMENT_TYPES.ID_CARD_BACK]: 'tc-kimlik-arka'
};

function getBlobExtension(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext) return ext;
  if (file.mimetype === 'application/pdf') return '.pdf';
  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  return '.jpg';
}

function createPdfFromImage(file) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const document = new PDFDocument({ size: 'A4', margin: 32, autoFirstPage: true });

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.image(file.buffer, 32, 32, {
      fit: [531, 778],
      align: 'center',
      valign: 'center'
    });
    document.end();
  });
}

function assertFileMatchesType(type, file) {
  const pdfTypes = [
    EMPLOYEE_DOCUMENT_TYPES.POPULATION_REGISTRY,
    EMPLOYEE_DOCUMENT_TYPES.RESIDENCE_CERTIFICATE,
    EMPLOYEE_DOCUMENT_TYPES.GRADUATION_CERTIFICATE,
    EMPLOYEE_DOCUMENT_TYPES.HEALTH_REPORT
  ];
  const imageTypes = [EMPLOYEE_DOCUMENT_TYPES.ID_CARD_FRONT, EMPLOYEE_DOCUMENT_TYPES.ID_CARD_BACK];

  if (!Object.values(EMPLOYEE_DOCUMENT_TYPES).includes(type)) {
    throw new ApiError(400, 'Geçersiz özlük belge tipi.');
  }

  if (pdfTypes.includes(type) && file.mimetype !== 'application/pdf' && !file.mimetype.startsWith('image/')) {
    throw new ApiError(400, 'Bu belge için PDF veya taranmış görsel yüklenmelidir.');
  }

  if (imageTypes.includes(type) && !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    throw new ApiError(400, 'Kimlik kartı için JPG veya PNG yüklenmelidir.');
  }
}

async function ensureUserExists(userId) {
  const user = await User.findById(userId).select('_id').lean();
  if (!user) throw new ApiError(404, 'Personel bulunamadı.');
}

async function listForUser(userId) {
  await ensureUserExists(userId);
  return EmployeeDocument.find({ userId })
    .sort({ type: 1, createdAt: -1 })
    .lean();
}

async function uploadForUser(actorUser, userId, payload, file) {
  if (!file) throw new ApiError(400, 'Belge dosyası zorunludur.');
  const type = payload.type;
  assertFileMatchesType(type, file);
  await ensureUserExists(userId);

  if (!env.azureStorage.connectionString) {
    throw new ApiError(500, 'Azure Storage is not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(env.azureStorage.connectionString);
  const containerClient = blobServiceClient.getContainerClient(env.azureStorage.containerName);
  await containerClient.createIfNotExists({ access: 'blob' });

  const shouldStoreScannedDocumentAsPdf =
    payload.source === 'MOBILE_SCAN' &&
    [
      EMPLOYEE_DOCUMENT_TYPES.POPULATION_REGISTRY,
      EMPLOYEE_DOCUMENT_TYPES.RESIDENCE_CERTIFICATE,
      EMPLOYEE_DOCUMENT_TYPES.GRADUATION_CERTIFICATE,
      EMPLOYEE_DOCUMENT_TYPES.HEALTH_REPORT
    ].includes(type) &&
    file.mimetype.startsWith('image/');
  const uploadBuffer = shouldStoreScannedDocumentAsPdf ? await createPdfFromImage(file) : file.buffer;
  const uploadMimeType = shouldStoreScannedDocumentAsPdf ? 'application/pdf' : file.mimetype;
  const extension = shouldStoreScannedDocumentAsPdf ? '.pdf' : getBlobExtension(file);
  const safeType = documentLabels[type] || type.toLowerCase();
  const fileName = `${safeType}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const blobName = `employee-documents/${userId}/${safeType}/${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  logger.info('Uploading employee document to Azure Blob Storage', {
    actorUserId: actorUser._id.toString(),
    userId: userId.toString(),
    type,
    blobName,
    mimeType: uploadMimeType,
    size: uploadBuffer.length
  });

  await blockBlobClient.uploadData(uploadBuffer, {
    blobHTTPHeaders: {
      blobContentType: uploadMimeType,
      blobCacheControl: 'private, max-age=86400'
    }
  });

  return EmployeeDocument.create({
    userId,
    type,
    url: blockBlobClient.url,
    fileName,
    originalName: file.originalname,
    mimeType: uploadMimeType,
    size: uploadBuffer.length,
    uploadedByUserId: actorUser._id,
    source: payload.source || 'WEB_UPLOAD'
  });
}

module.exports = { listForUser, uploadForUser };
