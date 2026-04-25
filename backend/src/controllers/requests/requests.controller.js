const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/requests.service');

const createRequest = asyncHandler(async (req, res) => {
  const item = await service.createRequest(req.user, req.body);
  res.status(201).json(item);
});

const listMyRequests = asyncHandler(async (req, res) => {
  res.json(
    await service.listMyRequests(req.user, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50)
    })
  );
});

const listApprovals = asyncHandler(async (req, res) => {
  res.json(
    await service.listApprovals(req.user, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50)
    })
  );
});

const approveRequest = asyncHandler(async (req, res) => {
  res.json(await service.approveRequest(req.user, req.params.id, req.body.note));
});

const rejectRequest = asyncHandler(async (req, res) => {
  res.json(await service.rejectRequest(req.user, req.params.id, req.body.note));
});

module.exports = {
  createRequest,
  listMyRequests,
  listApprovals,
  approveRequest,
  rejectRequest
};
