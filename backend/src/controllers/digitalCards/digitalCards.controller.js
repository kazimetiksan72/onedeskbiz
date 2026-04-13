const path = require('path');
const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/digitalCards.service');
const { ROLES } = require('../../constants/roles');
const { ApiError } = require('../../utils/apiError');
const { getPreferredPublicOrigin } = require('../../utils/networkOrigin');

const updateBusinessCard = asyncHandler(async (req, res) => {
  if (
    req.user.role !== ROLES.ADMIN &&
    (!req.user.employeeId || String(req.user.employeeId) !== req.params.employeeId)
  ) {
    throw new ApiError(403, 'Forbidden');
  }

  const payload = { ...req.body };

  if (req.file) {
    payload.avatarUrl = `/uploads/${path.basename(req.file.path)}`;
  }

  const employee = await service.updateBusinessCard(req.params.employeeId, payload);
  res.json(employee);
});

const getPublicCard = asyncHandler(async (req, res) => {
  const card = await service.getPublicCard(req.params.slug);

  if (card?.businessCard?.avatarUrl) {
    const origin = getPreferredPublicOrigin(req);
    card.businessCard.avatarPublicUrl = `${origin}${card.businessCard.avatarUrl}`;
  }

  res.json(card);
});

module.exports = { updateBusinessCard, getPublicCard };
