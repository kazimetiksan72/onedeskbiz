const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/companySettings.service');

const getCompanySettings = asyncHandler(async (req, res) => {
  const settings = await service.getCompanySettings();
  res.json(settings);
});

const getPublicBillingInfo = asyncHandler(async (req, res) => {
  const settings = await service.getPublicBillingInfo();
  res.json(settings);
});

const upsertCompanySettings = asyncHandler(async (req, res) => {
  const settings = await service.upsertCompanySettings(req.body);
  res.json(settings);
});

module.exports = { getCompanySettings, getPublicBillingInfo, upsertCompanySettings };
