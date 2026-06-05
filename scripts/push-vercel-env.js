const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const targets = process.argv.slice(2);
const environments = targets.length > 0 ? targets : ['production', 'preview', 'development'];

const envFiles = [
  path.join(rootDir, 'backend/.env'),
  path.join(rootDir, 'frontend/.env')
];

const allowedKeys = new Set([
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
  'DEFAULT_EMPLOYEE_PASSWORD',
  'UPLOAD_DIR',
  'MAX_FILE_SIZE_MB',
  'AZURE_STORAGE_CONNECTION_STRING',
  'AZURE_STORAGE_CONTAINER_NAME',
  'ONESIGNAL_APP_ID',
  'ONESIGNAL_REST_API_KEY',
  'ONESIGNAL_API_URL',
  'PUBLIC_BASE_URL',
  'VITE_API_BASE_URL'
]);

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return acc;

      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) return acc;

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (allowedKeys.has(key)) {
        acc[key] = value;
      }

      return acc;
    }, {});
}

function runVercel(args, input) {
  return spawnSync('npx', ['vercel', ...args], {
    cwd: rootDir,
    input,
    stdio: ['pipe', 'inherit', 'pipe'],
    encoding: 'utf8'
  });
}

const values = envFiles.reduce((acc, filePath) => ({ ...acc, ...parseEnvFile(filePath) }), {
  VITE_API_BASE_URL: '/api'
});

if (!values.MONGODB_URI) {
  console.error('Missing MONGODB_URI in backend/.env');
  process.exit(1);
}

for (const [key, value] of Object.entries(values)) {
  for (const environment of environments) {
    runVercel(['env', 'rm', key, environment, '--yes'], '');

    const result = runVercel(['env', 'add', key, environment], `${value}\n`);
    if (result.status !== 0) {
      console.error(result.stderr || `Failed to add ${key} for ${environment}`);
      process.exit(result.status || 1);
    }
  }
}

console.log(`Pushed ${Object.keys(values).length} environment variables to: ${environments.join(', ')}`);
