const { AttendanceLog } = require('../../models/AttendanceLog');
const { Employee } = require('../../models/Employee');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

async function createAttendanceLog(payload, actorUser) {
  const employeeId = payload.employeeId || actorUser.employeeId;

  if (!employeeId) {
    throw new ApiError(400, 'employeeId is required for this account');
  }

  const employee = await Employee.findById(employeeId).lean();
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

  return AttendanceLog.create({
    employeeId,
    type: payload.type,
    timestamp,
    source: payload.source || 'WEB',
    note: payload.note
  });
}

async function listAttendanceLogs({ employeeId, startDate, endDate, page, limit }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (employeeId) {
    query.employeeId = employeeId;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const [items, total] = await Promise.all([
    AttendanceLog.find(query)
      .populate('employeeId', 'firstName lastName workEmail department')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AttendanceLog.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

module.exports = { createAttendanceLog, listAttendanceLogs };
