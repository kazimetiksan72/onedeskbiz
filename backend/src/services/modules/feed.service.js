const path = require('path');
const sharp = require('sharp');
const { BlobServiceClient } = require('@azure/storage-blob');
const env = require('../../config/env');
const { FeedPost, FEED_STATUS } = require('../../models/FeedPost');
const { ApiError } = require('../../utils/apiError');
const { logger } = require('../../utils/logger');

async function uploadBuffer(containerClient, blobName, buffer, contentType) {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'public, max-age=31536000'
    }
  });
  return blockBlobClient.url;
}

async function createImageVariants(file) {
  if (!file) throw new ApiError(400, 'Feed görseli zorunludur.');
  if (!env.azureStorage.connectionString) throw new ApiError(500, 'Azure Storage is not configured');

  const blobServiceClient = BlobServiceClient.fromConnectionString(env.azureStorage.connectionString);
  const containerClient = blobServiceClient.getContainerClient(env.azureStorage.containerName);
  await containerClient.createIfNotExists({ access: 'blob' });

  const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const originalExtension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
  const originalBlobName = `feed/original/${baseName}${originalExtension}`;
  const mobileBlobName = `feed/mobile/${baseName}.jpg`;
  const webBlobName = `feed/web/${baseName}.jpg`;

  let mobileBuffer;
  let webBuffer;

  try {
    [mobileBuffer, webBuffer] = await Promise.all([
      sharp(file.buffer).rotate().resize(900, 620, { fit: 'cover', position: 'centre' }).jpeg({ quality: 84 }).toBuffer(),
      sharp(file.buffer).rotate().resize(1600, 720, { fit: 'cover', position: 'centre' }).jpeg({ quality: 86 }).toBuffer()
    ]);
  } catch (error) {
    logger.warn('Feed image processing failed', {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      error: logger.serializeError(error)
    });
    throw new ApiError(400, 'Feed görseli işlenemedi. Lütfen JPG, PNG veya WEBP formatında geçerli bir görsel yükleyin.');
  }

  logger.info('Uploading feed image variants to Azure Blob Storage', {
    originalBlobName,
    mobileBlobName,
    webBlobName,
    sourceMimeType: file.mimetype,
    sourceSize: file.size
  });

  const [originalUrl, mobileUrl, webUrl] = await Promise.all([
    uploadBuffer(containerClient, originalBlobName, file.buffer, file.mimetype),
    uploadBuffer(containerClient, mobileBlobName, mobileBuffer, 'image/jpeg'),
    uploadBuffer(containerClient, webBlobName, webBuffer, 'image/jpeg')
  ]);

  return { originalUrl, mobileUrl, webUrl };
}

async function listPublished({ limit }) {
  const safeLimit = Math.min(Math.max(limit || 20, 1), 50);
  return FeedPost.find({ status: FEED_STATUS.PUBLISHED })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(safeLimit)
    .lean();
}

async function listAdmin() {
  return FeedPost.find().sort({ createdAt: -1 }).lean();
}

async function createPost(actorUser, payload, file) {
  const title = String(payload.title || '').trim();
  const content = String(payload.content || '').trim();
  if (!title || !content) throw new ApiError(400, 'Başlık ve içerik zorunludur.');

  const image = await createImageVariants(file);

  return FeedPost.create({
    title,
    content,
    image,
    status: payload.status === FEED_STATUS.DRAFT ? FEED_STATUS.DRAFT : FEED_STATUS.PUBLISHED,
    publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : new Date(),
    createdByUserId: actorUser._id
  });
}

async function deletePost(id) {
  const deleted = await FeedPost.findByIdAndDelete(id).lean();
  if (!deleted) throw new ApiError(404, 'Feed içeriği bulunamadı.');
}

module.exports = { listPublished, listAdmin, createPost, deletePost };
