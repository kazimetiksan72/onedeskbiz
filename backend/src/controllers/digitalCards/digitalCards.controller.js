const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/digitalCards.service');
const { getPreferredPublicOrigin } = require('../../utils/networkOrigin');

const getPublicCard = asyncHandler(async (req, res) => {
  const card = await service.getPublicCard(req.params.userId);

  if (card?.businessCard?.avatarUrl?.startsWith('http')) {
    card.businessCard.avatarPublicUrl = card.businessCard.avatarUrl;
  } else if (card?.businessCard?.avatarUrl) {
    const origin = getPreferredPublicOrigin(req);
    card.businessCard.avatarPublicUrl = `${origin}${card.businessCard.avatarUrl}`;
  }

  res.json(card);
});

module.exports = { getPublicCard };
