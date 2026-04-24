const { app } = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');
const { logger } = require('./utils/logger');

async function bootstrap() {
  await connectDb();

  app.listen(env.port, () => {
    logger.info('Server listening', {
      port: env.port,
      nodeEnv: env.nodeEnv
    });
  });
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
