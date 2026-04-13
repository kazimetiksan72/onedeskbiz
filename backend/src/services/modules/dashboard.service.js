const { User } = require('../../models/User');
const { Customer } = require('../../models/Customer');
const { LeaveRequest } = require('../../models/LeaveRequest');
const { ROLES } = require('../../constants/roles');

async function getDashboardSummary() {
  const [employeeCount, activeCustomerCount, pendingLeaveCount] = await Promise.all([
    User.countDocuments({ role: ROLES.EMPLOYEE, status: 'ACTIVE', isActive: true }),
    Customer.countDocuments({ status: 'ACTIVE' }),
    LeaveRequest.countDocuments({ status: 'PENDING' })
  ]);

  const recentLeaveRequests = await LeaveRequest.find()
    .populate('userId', 'firstName lastName department')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    metrics: {
      employeeCount,
      activeCustomerCount,
      pendingLeaveCount
    },
    recentLeaveRequests
  };
}

module.exports = { getDashboardSummary };
