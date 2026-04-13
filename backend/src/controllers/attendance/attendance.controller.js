const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/attendance.service');
const { ROLES } = require('../../constants/roles');

const createAttendance = asyncHandler(async (req, res) => {
  const item = await service.createAttendanceLog(req.body, req.user);
  res.status(201).json(item);
});

const listAttendance = asyncHandler(async (req, res) => {
  const employeeId =
    req.user.role === ROLES.ADMIN ? req.query.employeeId : req.user.employeeId?.toString();

  const result = await service.listAttendanceLogs({
    employeeId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20)
  });
  res.json(result);
});

module.exports = { createAttendance, listAttendance };
