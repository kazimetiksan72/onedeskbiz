const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const sharp = require('sharp');
const env = require('../../config/env');
const { CompanySettings } = require('../../models/CompanySettings');
const { User } = require('../../models/User');
const { ApiError } = require('../../utils/apiError');
const { logger } = require('../../utils/logger');

const OPENAI_IMAGE_EDIT_URL = 'https://api.openai.com/v1/images/edits';

function getLogoMimeType(url = '') {
  const extension = path.extname(new URL(url).pathname).toLowerCase();

  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function downloadCompanyLogo(logoUrl) {
  if (!logoUrl || !logoUrl.startsWith('http')) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(logoUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Logo download failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || getLogoMimeType(logoUrl);
    if (!contentType.startsWith('image/')) {
      throw new Error(`Logo content type is not an image: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: contentType.split(';')[0] || getLogoMimeType(logoUrl)
    };
  } catch (error) {
    logger.warn('Company logo could not be used for profile photo transformation', {
      logoUrl,
      error: logger.serializeError(error)
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function createProfileSourceImage(file) {
  try {
    return await sharp(file.buffer)
      .rotate()
      .resize(1024, 1024, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 92 })
      .toBuffer();
  } catch (error) {
    logger.warn('Profile photo normalization failed', {
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      error: logger.serializeError(error)
    });
    throw new ApiError(400, 'Profil fotoğrafı işlenemedi. Lütfen geçerli bir JPG, PNG veya WEBP görsel yükleyin.');
  }
}

function buildCorporatePortraitPrompt(settings, hasLogoReference) {
  const companyName = settings?.companyName || 'OneDesk';
  const logoInstruction = hasLogoReference
    ? 'Use the provided company logo reference subtly as a small lapel pin or clean background brand mark.'
    : `Add a subtle, generic corporate brand mark that reads "${companyName}" without inventing extra slogans.`;

  return [
    'Transform the provided employee photo into a polished corporate headshot.',
    'Preserve the person’s facial identity, age, expression, skin tone, hair, and natural facial features.',
    'Dress the person in a modern dark business suit with a white shirt, suitable for a professional SaaS company profile.',
    logoInstruction,
    'Use a clean studio background, balanced lighting, realistic photo quality, square composition, head-and-shoulders crop.',
    'Do not change the person into a different individual. Do not add extra people, watermarks, badges with unreadable text, or exaggerated retouching.'
  ].join(' ');
}

async function transformProfilePhotoWithOpenAI(file) {
  if (!env.openai.apiKey) {
    throw new ApiError(500, 'OPENAI_API_KEY yapılandırılmadı. Profil fotoğrafı kurumsal portreye dönüştürülemedi.');
  }

  const [settings, sourceBuffer] = await Promise.all([
    CompanySettings.findOne().lean(),
    createProfileSourceImage(file)
  ]);
  const logo = await downloadCompanyLogo(settings?.logoUrl);
  const formData = new FormData();

  formData.append('model', env.openai.imageModel);
  formData.append('prompt', buildCorporatePortraitPrompt(settings, Boolean(logo)));
  formData.append('size', '1024x1024');
  formData.append('quality', env.openai.imageQuality);
  formData.append('output_format', 'jpeg');
  formData.append('image', new Blob([sourceBuffer], { type: 'image/jpeg' }), 'profile-source.jpg');

  if (logo) {
    formData.append('image', new Blob([logo.buffer], { type: logo.mimeType }), `company-logo${path.extname(settings.logoUrl || '') || '.jpg'}`);
  }

  const response = await fetch(OPENAI_IMAGE_EDIT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openai.apiKey}`
    },
    body: formData
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    logger.warn('OpenAI profile photo transformation failed', {
      status: response.status,
      error: data?.error
    });
    throw new ApiError(502, data?.error?.message || 'Profil fotoğrafı OpenAI ile dönüştürülemedi.');
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    logger.warn('OpenAI profile photo transformation returned no image', { data });
    throw new ApiError(502, 'OpenAI profil fotoğrafı dönüşümünden görsel dönmedi.');
  }

  return Buffer.from(b64, 'base64');
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

  const transformedBuffer = await transformProfilePhotoWithOpenAI(file);
  const blobName = `users/${userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  logger.info('Uploading profile photo to Azure Blob Storage', {
    userId: userId.toString(),
    containerName: env.azureStorage.containerName,
    blobName,
    mimeType: 'image/jpeg',
    size: transformedBuffer.length,
    transformedWithOpenAI: true
  });

  await blockBlobClient.uploadData(transformedBuffer, {
    blobHTTPHeaders: {
      blobContentType: 'image/jpeg',
      blobCacheControl: 'public, max-age=31536000'
    }
  });

  const avatarUrl = blockBlobClient.url;
  logger.info('Profile photo uploaded', {
    userId: userId.toString(),
    blobName,
    avatarUrl
  });

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
