const bcrypt = require('bcryptjs');
const ms = require('ms');
const env = require('../../config/env');
const { User } = require('../../models/User');
const { RefreshToken } = require('../../models/RefreshToken');
const { ROLES } = require('../../constants/roles');
const { ApiError } = require('../../utils/apiError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
} = require('../../utils/tokens');

function safeUserQuery(id) {
  return User.findById(id).select('-passwordHash').populate('departmentRoleId').lean();
}

async function issueTokenPair(user) {
  const payload = { sub: String(user._id), role: user.role };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn))
  });

  return { accessToken, refreshToken };
}

async function register({ email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }

  const normalizedEmail = email.toLowerCase();
  const localPart = normalizedEmail.split('@')[0] || 'user';

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await User.create({
    email: normalizedEmail,
    workEmail: normalizedEmail,
    passwordHash,
    role,
    firstName: localPart,
    lastName: 'User',
    startDate: new Date(),
    status: 'ACTIVE',
    isActive: true,
    mustChangePassword: false,
    passwordUpdatedAt: new Date()
  });

  const tokens = await issueTokenPair(user);
  const safeUser = await safeUserQuery(user._id);

  return { user: safeUser, ...tokens };
}

async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.isActive || user.status === 'INACTIVE') {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  const tokens = await issueTokenPair(user);
  const safeUser = await safeUserQuery(user._id);

  return { user: safeUser, ...tokens };
}

async function changePassword(userId, newPassword) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Unauthorized');
  }

  const passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);

  user.passwordHash = passwordHash;
  user.mustChangePassword = false;
  user.passwordUpdatedAt = new Date();
  await user.save();

  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  const tokens = await issueTokenPair(user);
  const safeUser = await safeUserQuery(user._id);

  return { user: safeUser, ...tokens };
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const tokenDoc = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenDoc) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Unauthorized');
  }

  tokenDoc.revokedAt = new Date();
  await tokenDoc.save();

  const tokens = await issueTokenPair(user);
  return tokens;
}

async function logout(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

module.exports = { register, login, changePassword, refresh, logout };
