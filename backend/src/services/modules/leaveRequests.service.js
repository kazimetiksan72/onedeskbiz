const { differenceInCalendarDays } = require('date-fns');
const { LeaveRequest } = require('../../models/LeaveRequest');
const { Employee } = require('../../models/Employee');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

async function createLeaveRequest(payload, actorUser) {
  const employeeId = payload.employeeId || actorUser.employeeId;

  if (!employeeId) {
    throw new ApiError(400, 'employeeId is required for this account');
  }

  const employee = await Employee.findById(employeeId).lean();
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (endDate < startDate) {
    throw new ApiError(400, 'endDate cannot be before startDate');
  }

  const days = differenceInCalendarDays(endDate, startDate) + 1;

  return LeaveRequest.create({
    employeeId,
    leaveType: payload.leaveType,
    startDate,
    endDate,
    days,
    reason: payload.reason
  });
}

async function listLeaveRequests({ status, employeeId, page, limit }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (status) query.status = status;
  if (employeeId) query.employeeId = employeeId;

  const [items, total] = await Promise.all([
    LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName workEmail department')
      .populate('reviewerId', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LeaveRequest.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function reviewLeaveRequest(id, payload, reviewerUser) {
  const leaveRequest = await LeaveRequest.findById(id);

  if (!leaveRequest) {
    throw new ApiError(404, 'Leave request not found');
  }

  if (leaveRequest.status !== 'PENDING') {
    throw new ApiError(400, 'Only pending requests can be reviewed');
  }

  leaveRequest.status = payload.status;
  leaveRequest.reviewNote = payload.reviewNote;
  leaveRequest.reviewerId = reviewerUser._id;
  leaveRequest.reviewedAt = new Date();

  await leaveRequest.save();

  return LeaveRequest.findById(id)
    .populate('employeeId', 'firstName lastName workEmail department')
    .populate('reviewerId', 'email role')
    .lean();
}

module.exports = { createLeaveRequest, listLeaveRequests, reviewLeaveRequest };
