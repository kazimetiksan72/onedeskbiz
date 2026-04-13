const { Employee } = require('../../models/Employee');
const { Customer } = require('../../models/Customer');
const { AttendanceLog } = require('../../models/AttendanceLog');
const { LeaveRequest } = require('../../models/LeaveRequest');

async function getDashboardSummary() {
  const [employeeCount, activeCustomerCount, pendingLeaveCount, todayAttendanceCount] =
    await Promise.all([
      Employee.countDocuments({ status: 'ACTIVE' }),
      Customer.countDocuments({ status: 'ACTIVE' }),
      LeaveRequest.countDocuments({ status: 'PENDING' }),
      AttendanceLog.countDocuments({
        timestamp: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

  const recentLeaveRequests = await LeaveRequest.find()
    .populate('employeeId', 'firstName lastName department')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    metrics: {
      employeeCount,
      activeCustomerCount,
      pendingLeaveCount,
      todayAttendanceCount
    },
    recentLeaveRequests
  };
}

module.exports = { getDashboardSummary };
