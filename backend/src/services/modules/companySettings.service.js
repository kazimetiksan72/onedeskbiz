const { CompanySettings } = require('../../models/CompanySettings');

async function getCompanySettings() {
  return CompanySettings.findOne().lean();
}

async function upsertCompanySettings(payload) {
  return CompanySettings.findOneAndUpdate({}, payload, {
    upsert: true,
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true
  }).lean();
}

module.exports = { getCompanySettings, upsertCompanySettings };
