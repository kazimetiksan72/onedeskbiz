const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/leaveRequests.service');
const { ROLES } = require('../../constants/roles');

const createLeaveRequest = asyncHandler(async (req, res) => {
  const item = await service.createLeaveRequest(req.body, req.user);
  res.status(201).json(item);
});

const listLeaveRequests = asyncHandler(async (req, res) => {
  const employeeId =
    req.user.role === ROLES.ADMIN ? req.query.employeeId : req.user.employeeId?.toString();

  const result = await service.listLeaveRequests({
    status: req.query.status,
    employeeId,
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20)
  });
  res.json(result);
});

const reviewLeaveRequest = asyncHandler(async (req, res) => {
  const item = await service.reviewLeaveRequest(req.params.id, req.body, req.user);
  res.json(item);
});

module.exports = { createLeaveRequest, listLeaveRequests, reviewLeaveRequest };
