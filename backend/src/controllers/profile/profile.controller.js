const { asyncHandler } = require('../../utils/asyncHandler');
const profileService = require('../../services/modules/profile.service');

const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const result = await profileService.uploadProfilePhoto(req.user._id, req.file);
  res.json(result);
});

module.exports = { uploadProfilePhoto };
