function serializeError(error) {
  if (!error) return undefined;

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack
  };
}

function write(level, message, meta = {}) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  const output = JSON.stringify(payload);

  if (level === 'error') {
    // Hosting providers capture stderr for error-level logs.
    console.error(output);
    return;
  }

  console.log(output);
}

const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
  serializeError
};

module.exports = { logger };
