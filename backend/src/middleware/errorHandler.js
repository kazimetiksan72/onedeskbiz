const { ZodError } = require('zod');
const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;

  logger.error('Request failed', {
    statusCode,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?._id?.toString(),
    ip: req.ip,
    error: logger.serializeError(err)
  });

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((item) => ({
        path: item.path,
        message: item.message
      }))
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier' });
  }

  const payload = {
    message: statusCode >= 500 ? 'Internal server error' : err.message
  };

  if (err.details && statusCode < 500) {
    payload.details = err.details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = { errorHandler };
