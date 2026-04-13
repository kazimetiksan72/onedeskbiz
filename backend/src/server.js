const { app } = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');

async function bootstrap() {
  await connectDb();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap app', error);
  process.exit(1);
});
