const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');
const { ApiError } = require('../utils/apiError');

const uploadPath = path.resolve(process.cwd(), env.uploadDir);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const allowedDocumentMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPG, PNG, and WEBP files are allowed'));
    }

    return cb(null, true);
  }
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPG, PNG, and WEBP files are allowed'));
    }

    return cb(null, true);
  }
});

const documentMemoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!allowedDocumentMimeTypes.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only PDF, JPG, PNG, and WEBP files are allowed'));
    }

    return cb(null, true);
  }
});

module.exports = { upload, memoryUpload, documentMemoryUpload, uploadPath };
