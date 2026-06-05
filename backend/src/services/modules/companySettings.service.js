const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const { CompanySettings } = require('../../models/CompanySettings');
const env = require('../../config/env');
const { ApiError } = require('../../utils/apiError');
const { logger } = require('../../utils/logger');

const COMPANY_CONTAINER_NAME = 'company';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, patch) {
  if (!isPlainObject(base)) {
    return patch;
  }

  const output = { ...base };

  for (const key of Object.keys(patch || {})) {
    const patchValue = patch[key];
    if (patchValue === undefined) continue;

    if (Array.isArray(patchValue)) {
      output[key] = patchValue;
      continue;
    }

    if (isPlainObject(patchValue)) {
      output[key] = deepMerge(isPlainObject(base[key]) ? base[key] : {}, patchValue);
      continue;
    }

    output[key] = patchValue;
  }

  return output;
}

function normalizeDepartments(departments = []) {
  const unique = new Set();

  for (const item of departments) {
    if (typeof item !== 'string') continue;
    const value = item.trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (!unique.has(key)) {
      unique.add(key);
    }
  }

  return Array.from(unique).map((key) => {
    const source = departments.find((item) => typeof item === 'string' && item.trim().toLowerCase() === key);
    return source ? source.trim() : key;
  });
}

function normalizeBankAccounts(bankAccounts = []) {
  return bankAccounts
    .map((item) => ({
      bankName: (item.bankName || '').trim(),
      branchName: (item.branchName || '').trim(),
      iban: (item.iban || '').trim(),
      swiftCode: (item.swiftCode || '').trim()
    }))
    .filter((item) => item.bankName || item.branchName || item.iban || item.swiftCode);
}

async function getCompanySettings() {
  return CompanySettings.findOne().lean();
}

async function getPublicBillingInfo() {
  const settings = await CompanySettings.findOne().lean();
  if (!settings) {
    return null;
  }

  return {
    companyName: settings.companyName || '',
    website: settings.website || '',
    billingInfo: settings.billingInfo || {}
  };
}

async function upsertCompanySettings(payload) {
  const existing = (await CompanySettings.findOne().lean()) || {};

  const normalizedPayload = { ...payload };

  if (Object.prototype.hasOwnProperty.call(payload, 'departments')) {
    normalizedPayload.departments = normalizeDepartments(payload.departments || []);
  }

  if (payload.billingInfo && Object.prototype.hasOwnProperty.call(payload.billingInfo, 'bankAccounts')) {
    normalizedPayload.billingInfo = {
      ...payload.billingInfo,
      bankAccounts: normalizeBankAccounts(payload.billingInfo.bankAccounts || [])
    };
  }

  const mergedPayload = deepMerge(existing, normalizedPayload);

  return CompanySettings.findOneAndUpdate({}, mergedPayload, {
    upsert: true,
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true
  }).lean();
}

function getLogoExtension(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext) return ext;
  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  return '.jpg';
}

function getReferenceName(file) {
  const parsed = path.parse(file.originalname || '');
  return (parsed.name || 'Referans').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getCompanyContainerClient() {
  if (!env.azureStorage.connectionString) {
    throw new ApiError(500, 'Azure Storage is not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(env.azureStorage.connectionString);
  const containerClient = blobServiceClient.getContainerClient(COMPANY_CONTAINER_NAME);
  await containerClient.createIfNotExists({ access: 'blob' });
  return containerClient;
}

async function uploadCompanyImage(file, folder, filePrefix) {
  const containerClient = await getCompanyContainerClient();
  const extension = getLogoExtension(file);
  const blobName = `${folder}/${filePrefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  logger.info('Uploading company image to Azure Blob Storage', {
    containerName: COMPANY_CONTAINER_NAME,
    blobName,
    mimeType: file.mimetype,
    size: file.size
  });

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
      blobCacheControl: 'public, max-age=31536000'
    }
  });

  return { url: blockBlobClient.url, blobName };
}

async function uploadCompanyLogo(file) {
  if (!file) throw new ApiError(400, 'Logo dosyası zorunludur.');

  const uploadedLogo = await uploadCompanyImage(file, 'logos', 'company-logo');

  return CompanySettings.findOneAndUpdate(
    {},
    { $set: { logoUrl: uploadedLogo.url } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
}

async function uploadCompanyReferences(files = []) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(400, 'En az bir referans logosu seçilmelidir.');
  }

  const uploadedReferences = await Promise.all(
    files.map(async (file) => {
      const uploadedLogo = await uploadCompanyImage(file, 'references', 'reference-logo');
      return {
        name: getReferenceName(file),
        logoUrl: uploadedLogo.url,
        blobName: uploadedLogo.blobName
      };
    })
  );

  return CompanySettings.findOneAndUpdate(
    {},
    { $push: { companyReferences: { $each: uploadedReferences } } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
}

async function deleteCompanyReference(referenceId) {
  const settings = await CompanySettings.findOne();
  if (!settings) throw new ApiError(404, 'Şirket ayarları bulunamadı.');

  const reference = settings.companyReferences.id(referenceId);
  if (!reference) throw new ApiError(404, 'Referans bulunamadı.');

  if (reference.blobName) {
    const containerClient = await getCompanyContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(reference.blobName);
    await blockBlobClient.deleteIfExists();
  }

  reference.deleteOne();
  await settings.save();
  return settings.toObject();
}

module.exports = {
  getCompanySettings,
  getPublicBillingInfo,
  upsertCompanySettings,
  uploadCompanyLogo,
  uploadCompanyReferences,
  deleteCompanyReference
};
