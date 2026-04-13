const { differenceInCalendarDays } = require('date-fns');
const { LeaveRequest } = require('../../models/LeaveRequest');
const { User } = require('../../models/User');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

async function createLeaveRequest(payload, actorUser) {
  const userId = actorUser._id;

  const user = await User.findById(userId).lean();
  if (!user || !user.isActive || user.status === 'INACTIVE') {
    throw new ApiError(404, 'User not found');
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (endDate < startDate) {
    throw new ApiError(400, 'endDate cannot be before startDate');
  }

  const days = differenceInCalendarDays(endDate, startDate) + 1;

  return LeaveRequest.create({
    userId,
    leaveType: payload.leaveType,
    startDate,
    endDate,
    days,
    reason: payload.reason
  });
}

async function listLeaveRequests({ status, userId, page, limit }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (status) query.status = status;
  if (userId) query.userId = userId;

  const [items, total] = await Promise.all([
    LeaveRequest.find(query)
      .populate('userId', 'firstName lastName workEmail department')
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
    .populate('userId', 'firstName lastName workEmail department')
    .populate('reviewerId', 'email role')
    .lean();
}

module.exports = { createLeaveRequest, listLeaveRequests, reviewLeaveRequest };
