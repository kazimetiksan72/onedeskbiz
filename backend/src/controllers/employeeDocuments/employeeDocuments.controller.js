const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/employeeDocuments.service');

const listMine = asyncHandler(async (req, res) => {
  res.json(await service.listForUser(req.user._id));
});

const uploadMine = asyncHandler(async (req, res) => {
  const item = await service.uploadForUser(req.user, req.user._id, req.body, req.file);
  res.status(201).json(item);
});

const listForEmployee = asyncHandler(async (req, res) => {
  res.json(await service.listForUser(req.params.userId));
});

module.exports = { listMine, uploadMine, listForEmployee };
