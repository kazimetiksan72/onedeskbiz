const { ApiError } = require('../utils/apiError');

function enforcePasswordChange(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  if (req.user.mustChangePassword) {
    return next(new ApiError(403, 'Password change required'));
  }

  return next();
}

module.exports = { enforcePasswordChange };
