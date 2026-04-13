const { User } = require('../../models/User');
const { ROLES } = require('../../constants/roles');
const { ApiError } = require('../../utils/apiError');

async function getPublicCard(userId) {
  const user = await User.findOne({
    _id: userId,
    role: ROLES.EMPLOYEE
  }).lean();

  if (!user || user.status === 'INACTIVE' || user.isActive === false) {
    throw new ApiError(404, 'Business card not found');
  }

  const cardFromUser = {
    displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    title: user.title || '',
    phone: user.phone || '',
    email: user.workEmail || '',
    website: user.businessCard?.website || '',
    address: user.businessCard?.address || '',
    bio: user.businessCard?.bio || '',
    avatarUrl: user.businessCard?.avatarUrl || '',
    isPublic: true
  };

  return {
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    businessCard: cardFromUser
  };
}

module.exports = { getPublicCard };
