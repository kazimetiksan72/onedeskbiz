const { app } = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const { logger } = require('./utils/logger');

let dbConnectTimer = null;

function scheduleDbReconnect() {
  if (dbConnectTimer) return;

  dbConnectTimer = setTimeout(() => {
    dbConnectTimer = null;
    connectDbWithRetry();
  }, 30000);
}

async function connectDbWithRetry() {
  try {
    await connectDb();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection failed', {
      error: logger.serializeError(error)
    });
    scheduleDbReconnect();
  }
}

async function bootstrap() {
  app.listen(env.port, () => {
    logger.info('Server listening', {
      port: env.port,
      nodeEnv: env.nodeEnv
    });
  });

  connectDbWithRetry();
}

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection', {
    error: logger.serializeError(error)
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: logger.serializeError(error)
  });
  process.exit(1);
});

bootstrap().catch((error) => {
  logger.error('Failed to bootstrap app', {
    error: logger.serializeError(error)
  });
  process.exit(1);
});
