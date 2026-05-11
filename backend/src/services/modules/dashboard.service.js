const { User } = require('../../models/User');
const { Customer } = require('../../models/Customer');
const { LeaveRequest } = require('../../models/LeaveRequest');
const { Request, REQUEST_STATUS } = require('../../models/Request');
const { Task, TASK_STATUS } = require('../../models/Task');
const { Vehicle } = require('../../models/Vehicle');
const { ROLES } = require('../../constants/roles');

const VEHICLE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

function getDepartmentMatch(department) {
  return department ? { department } : {};
}

function getRequesterDepartmentMatch(department) {
  return department ? { requesterDepartment: department } : {};
}

function getTaskDepartmentPipeline(department, stages = []) {
  const pipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'assignedUserId',
        foreignField: '_id',
        as: 'assignedUser'
      }
    },
    { $unwind: '$assignedUser' }
  ];

  if (department) {
    pipeline.push({ $match: { 'assignedUser.department': department } });
  }

  return [...pipeline, ...stages];
}

async function getDashboardSummary({ department } = {}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const userDepartmentMatch = getDepartmentMatch(department);
  const requestDepartmentMatch = getRequesterDepartmentMatch(department);
  const pendingLeaveCountPromise = department
    ? LeaveRequest.aggregate([
      { $match: { status: 'PENDING' } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.department': department } },
      { $count: 'count' }
    ]).then((items) => items[0]?.count || 0)
    : LeaveRequest.countDocuments({ status: 'PENDING' });
  const [
    employeeCount,
    activeCustomerCount,
    pendingLeaveCount,
    taskStatusCounts,
    requestStatusCounts,
    vehicleStatusCounts,
    departments,
    tasksByDepartment,
    pendingRequestsByDepartment,
    overdueTaskCount,
    pendingRequestCount,
    openedRequestsThisMonthCount,
    closedRequestsThisMonthCount,
    openedTasksThisMonthCount,
    closedTasksThisMonthCount,
    vehicleRequestDensity
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.EMPLOYEE, status: 'ACTIVE', isActive: true, ...userDepartmentMatch }),
    Customer.countDocuments({ status: 'ACTIVE' }),
    pendingLeaveCountPromise,
    Task.aggregate(getTaskDepartmentPipeline(department, [
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])),
    Request.aggregate([
      ...(department ? [{ $match: requestDepartmentMatch }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Vehicle.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    User.distinct('department', { role: ROLES.EMPLOYEE, isActive: true, department: { $nin: [null, ''] } }),
    Task.aggregate(getTaskDepartmentPipeline(null, [
      { $group: { _id: '$assignedUser.department', count: { $sum: 1 } } },
      { $match: { _id: { $nin: [null, ''] } } },
      { $sort: { count: -1, _id: 1 } }
    ])),
    Request.aggregate([
      { $match: { status: REQUEST_STATUS.PENDING } },
      { $group: { _id: '$requesterDepartment', count: { $sum: 1 } } },
      { $match: { _id: { $nin: [null, ''] } } },
      { $sort: { count: -1, _id: 1 } }
    ]),
    Task.aggregate(getTaskDepartmentPipeline(department, [
      {
        $match: {
          dueDate: { $lt: now },
          status: { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] }
        }
      },
      { $count: 'count' }
    ])),
    Request.countDocuments({ status: REQUEST_STATUS.PENDING, ...requestDepartmentMatch }),
    Request.countDocuments({ createdAt: { $gte: monthStart }, ...requestDepartmentMatch }),
    Request.countDocuments({
      status: { $in: [REQUEST_STATUS.APPROVED, REQUEST_STATUS.REJECTED] },
      updatedAt: { $gte: monthStart },
      ...requestDepartmentMatch
    }),
    Task.aggregate(getTaskDepartmentPipeline(department, [
      { $match: { createdAt: { $gte: monthStart } } },
      { $count: 'count' }
    ])).then((items) => items[0]?.count || 0),
    Task.aggregate(getTaskDepartmentPipeline(department, [
      {
        $match: {
          status: { $in: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] },
          updatedAt: { $gte: monthStart }
        }
      },
      { $count: 'count' }
    ])).then((items) => items[0]?.count || 0),
    Request.aggregate([
      { $match: { type: 'VEHICLE', ...requestDepartmentMatch } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
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
      pendingLeaveCount,
      overdueTaskCount: overdueTaskCount[0]?.count || 0,
      pendingRequestCount,
      openedThisMonthCount: openedRequestsThisMonthCount + openedTasksThisMonthCount,
      closedThisMonthCount: closedRequestsThisMonthCount + closedTasksThisMonthCount
    },
    filters: {
      department: department || '',
      departments: departments.sort()
    },
    charts: {
      tasksByStatus: Object.values(TASK_STATUS).map((status) => ({
        status,
        count: taskStatusCounts.find((item) => item._id === status)?.count || 0
      })),
      requestsByStatus: Object.values(REQUEST_STATUS).map((status) => ({
        status,
        count: requestStatusCounts.find((item) => item._id === status)?.count || 0
      })),
      vehiclesByStatus: Object.values(VEHICLE_STATUS).map((status) => ({
        status,
        count: vehicleStatusCounts.find((item) => item._id === status)?.count || 0
      })),
      tasksByDepartment: tasksByDepartment.map((item) => ({
        department: item._id,
        count: item.count
      })),
      pendingRequestsByDepartment: pendingRequestsByDepartment.map((item) => ({
        department: item._id,
        count: item.count
      })),
      vehicleRequestDensity: Object.values(REQUEST_STATUS).map((status) => ({
        status,
        count: vehicleRequestDensity.find((item) => item._id === status)?.count || 0
      }))
    },
    recentLeaveRequests
  };
}

module.exports = { getDashboardSummary };
