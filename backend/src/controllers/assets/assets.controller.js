const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/assets.service');

const createAsset = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createAsset(req.user, req.body));
});

const listAssets = asyncHandler(async (req, res) => {
  res.json(await service.listAssets(req.user, {
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 50),
    search: req.query.search,
    status: req.query.status
  }));
});

const updateAsset = asyncHandler(async (req, res) => {
  res.json(await service.updateAsset(req.user, req.params.id, req.body));
});

const deleteAsset = asyncHandler(async (req, res) => {
  await service.deleteAsset(req.user, req.params.id);
  res.status(204).send();
});

const listAssignments = asyncHandler(async (req, res) => {
  res.json(await service.listAssignments(req.user, {
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 100),
    mine: req.query.mine === 'true'
  }));
});

const assignAsset = asyncHandler(async (req, res) => {
  res.status(201).json(await service.assignAsset(req.user, req.body));
});

const returnAssignment = asyncHandler(async (req, res) => {
  res.json(await service.returnAssignment(req.user, req.params.id));
});

module.exports = {
  assignAsset,
  createAsset,
  deleteAsset,
  listAssets,
  listAssignments,
  returnAssignment,
  updateAsset
};
