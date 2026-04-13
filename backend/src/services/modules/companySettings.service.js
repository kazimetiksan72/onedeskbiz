const { CompanySettings } = require('../../models/CompanySettings');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, patch) {
  if (!isPlainObject(base)) {
    return patch;
  }

  const output = { ...base };

  for (const key of Object.keys(patch || {})) {
    const patchValue = patch[key];
    if (patchValue === undefined) continue;

    if (Array.isArray(patchValue)) {
      output[key] = patchValue;
      continue;
    }

    if (isPlainObject(patchValue)) {
      output[key] = deepMerge(isPlainObject(base[key]) ? base[key] : {}, patchValue);
      continue;
    }

    output[key] = patchValue;
  }

  return output;
}

function normalizeDepartments(departments = []) {
  const unique = new Set();

  for (const item of departments) {
    if (typeof item !== 'string') continue;
    const value = item.trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (!unique.has(key)) {
      unique.add(key);
    }
  }

  return Array.from(unique).map((key) => {
    const source = departments.find((item) => typeof item === 'string' && item.trim().toLowerCase() === key);
    return source ? source.trim() : key;
  });
}

function normalizeBankAccounts(bankAccounts = []) {
  return bankAccounts
    .map((item) => ({
      bankName: (item.bankName || '').trim(),
      branchName: (item.branchName || '').trim(),
      iban: (item.iban || '').trim(),
      swiftCode: (item.swiftCode || '').trim()
    }))
    .filter((item) => item.bankName || item.branchName || item.iban || item.swiftCode);
}

async function getCompanySettings() {
  return CompanySettings.findOne().lean();
}

async function getPublicBillingInfo() {
  const settings = await CompanySettings.findOne().lean();
  if (!settings) {
    return null;
  }

  return {
    companyName: settings.companyName || '',
    website: settings.website || '',
    billingInfo: settings.billingInfo || {}
  };
}

async function upsertCompanySettings(payload) {
  const existing = (await CompanySettings.findOne().lean()) || {};

  const normalizedPayload = { ...payload };

  if (Object.prototype.hasOwnProperty.call(payload, 'departments')) {
    normalizedPayload.departments = normalizeDepartments(payload.departments || []);
  }

  if (payload.billingInfo && Object.prototype.hasOwnProperty.call(payload.billingInfo, 'bankAccounts')) {
    normalizedPayload.billingInfo = {
      ...payload.billingInfo,
      bankAccounts: normalizeBankAccounts(payload.billingInfo.bankAccounts || [])
    };
  }

  const mergedPayload = deepMerge(existing, normalizedPayload);

  return CompanySettings.findOneAndUpdate({}, mergedPayload, {
    upsert: true,
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true
  }).lean();
}

module.exports = { getCompanySettings, getPublicBillingInfo, upsertCompanySettings };
