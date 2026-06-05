const { app } = require('../backend/src/app');
const { connectDb, isDbConnected } = require('../backend/src/config/db');
const { logger } = require('../backend/src/utils/logger');

let connectPromise = null;

async function ensureDatabaseConnection() {
  if (isDbConnected()) {
    return;
  }

  if (!connectPromise) {
    connectPromise = connectDb()
      .then(() => {
        logger.info('Database connected for Vercel function');
      })
      .catch((error) => {
        connectPromise = null;
        throw error;
      });
  }

  await connectPromise;
}

module.exports = async function handler(req, res) {
  try {
    await ensureDatabaseConnection();
    return app(req, res);
  } catch (error) {
    logger.error('Vercel function failed before request handling', {
      error: logger.serializeError(error)
    });

    return res.status(503).json({
      message: 'Database connection is not ready. Please try again shortly.'
    });
  }
};
