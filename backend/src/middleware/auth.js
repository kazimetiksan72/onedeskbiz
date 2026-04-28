const { ApiError } = require('../utils/apiError');
const { verifyAccessToken } = require('../utils/tokens');
const { User } = require('../models/User');
const { attachDepartmentRole } = require('../services/modules/departmentRoleAssignments.service');

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select('-passwordHash').lean();

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    req.user = await attachDepartmentRole(user);
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { auth };
