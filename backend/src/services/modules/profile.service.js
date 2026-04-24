const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const env = require('../../config/env');
const { User } = require('../../models/User');
const { ApiError } = require('../../utils/apiError');

function getBlobExtension(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext) return ext;

  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  return '.jpg';
}

async function uploadProfilePhoto(userId, file) {
  if (!file) {
    throw new ApiError(400, 'Photo file is required');
  }

  if (!env.azureStorage.connectionString) {
    throw new ApiError(500, 'Azure Storage is not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(env.azureStorage.connectionString);
  const containerClient = blobServiceClient.getContainerClient(env.azureStorage.containerName);
  await containerClient.createIfNotExists({ access: 'blob' });

  const extension = getBlobExtension(file);
  const blobName = `users/${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
      blobCacheControl: 'public, max-age=31536000'
    }
  });

  const avatarUrl = blockBlobClient.url;
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'businessCard.avatarUrl': avatarUrl,
        'businessCard.isPublic': true
      }
    },
    { new: true, runValidators: true }
  )
    .select('-passwordHash')
    .lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return { avatarUrl, user };
}

module.exports = { uploadProfilePhoto };
