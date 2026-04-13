const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/leaveRequests.service');

const createLeaveRequest = asyncHandler(async (req, res) => {
  const item = await service.createLeaveRequest(req.body, req.user);
  res.status(201).json(item);
});

const listLeaveRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id?.toString();

  const result = await service.listLeaveRequests({
    status: req.query.status,
    userId,
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20)
  });
  res.json(result);
});

module.exports = { createLeaveRequest, listLeaveRequests };
