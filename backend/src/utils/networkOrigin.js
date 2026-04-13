const os = require('os');
const env = require('../config/env');

let cachedLocalIp = null;

function getLocalIPv4() {
  if (cachedLocalIp) return cachedLocalIp;

  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const network = interfaces[name] || [];

    for (const item of network) {
      if (item.family === 'IPv4' && !item.internal) {
        cachedLocalIp = item.address;
        return cachedLocalIp;
      }
    }
  }

  return null;
}

function trimTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function getPreferredPublicOrigin(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return trimTrailingSlash(process.env.PUBLIC_BASE_URL);
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || `localhost:${env.port}`;

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    const localIp = getLocalIPv4();

    if (localIp) {
      const hostPort = host.split(':')[1] || String(env.port);
      return `${protocol}://${localIp}:${hostPort}`;
    }
  }

  return `${protocol}://${host}`;
}

module.exports = { getPreferredPublicOrigin, getLocalIPv4 };
