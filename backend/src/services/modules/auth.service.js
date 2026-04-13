const bcrypt = require('bcryptjs');
const ms = require('ms');
const env = require('../../config/env');
const { User } = require('../../models/User');
const { RefreshToken } = require('../../models/RefreshToken');
const { ApiError } = require('../../utils/apiError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
} = require('../../utils/tokens');

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

async function register({ email, password, role, employeeId }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const user = await User.create({
    email,
    passwordHash,
    role,
    employeeId: employeeId || null
  });

  const tokens = await issueTokenPair(user);
  const safeUser = await User.findById(user._id).select('-passwordHash').lean();

  return { user: safeUser, ...tokens };
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  const tokens = await issueTokenPair(user);
  const safeUser = await User.findById(user._id).select('-passwordHash').lean();

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

module.exports = { register, login, refresh, logout };
