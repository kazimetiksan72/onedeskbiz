const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== 'production',
    serverSelectionTimeoutMS: 10000
  });
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDb, isDbConnected };
