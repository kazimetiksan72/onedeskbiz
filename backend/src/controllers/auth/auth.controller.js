const { asyncHandler } = require('../../utils/asyncHandler');
const authService = require('../../services/modules/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body.newPassword);
  res.json(result);
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.json(result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, changePassword, refresh, logout, me };
