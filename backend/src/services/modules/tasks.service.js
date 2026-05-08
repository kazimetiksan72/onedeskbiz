const { Task } = require('../../models/Task');
const { User } = require('../../models/User');
const { DepartmentRole, PERMISSIONS } = require('../../models/DepartmentRole');
const { ROLES } = require('../../constants/roles');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');
const { sendTaskAssignedNotification } = require('../notifications/oneSignal.service');

const populateFields = [
  { path: 'assignedUserId', select: 'firstName lastName workEmail department title' },
  { path: 'createdByUserId', select: 'firstName lastName workEmail' }
];

function normalizeDate(value) {
  if (value === null) return null;
  if (!value) return undefined;
  return new Date(value);
}

async function ensureEmployeeExists(userId) {
  const user = await User.findOne({ _id: userId, role: ROLES.EMPLOYEE, isActive: true }).select('_id department').lean();
  if (!user) throw new ApiError(404, 'Personel bulunamadı.');
  return user;
}

async function getUserPermissions(user) {
  if (user.role === ROLES.ADMIN) return [PERMISSIONS.TASK_ASSIGNMENT];

  const roleId = user.departmentRoleId?._id || user.departmentRoleId;
  if (!roleId) return [];

  const role = typeof user.departmentRoleId === 'object' && Array.isArray(user.departmentRoleId.permissions)
    ? user.departmentRoleId
    : await DepartmentRole.findById(roleId).select('permissions').lean();

  return role?.permissions || [];
}

async function canAssignTasks(user) {
  const permissions = await getUserPermissions(user);
  return user.role === ROLES.ADMIN || permissions.includes(PERMISSIONS.TASK_ASSIGNMENT);
}

async function listTasks(user, { page, limit, status, assignedUserId }) {
  const { skip } = getPagination({ page, limit });
  const query = {};
  const hasAssignmentPermission = await canAssignTasks(user);

  if (user.role === ROLES.ADMIN) {
    if (assignedUserId) query.assignedUserId = assignedUserId;
  } else if (hasAssignmentPermission) {
    if (assignedUserId) {
      query.assignedUserId = assignedUserId;
      query.createdByUserId = user._id;
    } else {
      query.$or = [
        { assignedUserId: user._id },
        { createdByUserId: user._id }
      ];
    }
  } else {
    query.assignedUserId = user._id;
  }

  if (status) query.status = status;

  const [items, total] = await Promise.all([
    Task.find(query)
      .populate(populateFields)
      .sort({ status: 1, dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Task.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function createTask(user, payload) {
  if (!(await canAssignTasks(user))) throw new ApiError(403, 'Bu işlem için görev atama yetkiniz yok.');
  const assignedUser = await ensureEmployeeExists(payload.assignedUserId);
  if (user.role !== ROLES.ADMIN && assignedUser.department !== user.department) {
    throw new ApiError(403, 'Yalnızca kendi departmanınızdaki personele görev atayabilirsiniz.');
  }

  const createdTask = await Task.create({
    title: payload.title,
    description: payload.description || '',
    assignedUserId: payload.assignedUserId,
    createdByUserId: user._id,
    dueDate: normalizeDate(payload.dueDate) ?? null,
    status: payload.status,
    notes: payload.notes || ''
  });

  const populatedTask = await Task.findById(createdTask._id).populate(populateFields).lean();
  await sendTaskAssignedNotification({
    taskId: populatedTask._id,
    assignedUserId: populatedTask.assignedUserId?._id || payload.assignedUserId,
    title: populatedTask.title,
    assignedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
  });

  return populatedTask;
}

async function getTask(user, id) {
  const query = { _id: id };
  if (user.role !== ROLES.ADMIN) {
    query.$or = [{ assignedUserId: user._id }, { createdByUserId: user._id }];
  }

  const task = await Task.findOne(query).populate(populateFields).lean();
  if (!task) throw new ApiError(404, 'Görev bulunamadı.');
  return task;
}

async function updateTask(user, id, payload) {
  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, 'Görev bulunamadı.');
  const previousAssignedUserId = String(task.assignedUserId);

  const isAssignedEmployee = String(task.assignedUserId) === String(user._id);
  const isCreator = String(task.createdByUserId) === String(user._id);
  const hasAssignmentPermission = await canAssignTasks(user);
  if (user.role !== ROLES.ADMIN && !isAssignedEmployee && !(hasAssignmentPermission && isCreator)) {
    throw new ApiError(403, 'Forbidden');
  }

  if (user.role === ROLES.ADMIN || (hasAssignmentPermission && isCreator)) {
    if (payload.assignedUserId) {
      const assignedUser = await ensureEmployeeExists(payload.assignedUserId);
      if (user.role !== ROLES.ADMIN && assignedUser.department !== user.department) {
        throw new ApiError(403, 'Yalnızca kendi departmanınızdaki personele görev atayabilirsiniz.');
      }
      task.assignedUserId = payload.assignedUserId;
    }
    if (payload.title !== undefined) task.title = payload.title;
    if (payload.description !== undefined) task.description = payload.description;
    if (payload.dueDate !== undefined) task.dueDate = normalizeDate(payload.dueDate);
  }

  if (payload.status !== undefined) task.status = payload.status;
  if (payload.notes !== undefined) task.notes = payload.notes;

  await task.save();
  const populatedTask = await Task.findById(task._id).populate(populateFields).lean();
  const currentAssignedUserId = String(populatedTask.assignedUserId?._id || task.assignedUserId);

  if (payload.assignedUserId && currentAssignedUserId !== previousAssignedUserId) {
    await sendTaskAssignedNotification({
      taskId: populatedTask._id,
      assignedUserId: currentAssignedUserId,
      title: populatedTask.title,
      assignedByName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
    });
  }

  return populatedTask;
}

async function deleteTask(user, id) {
  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, 'Görev bulunamadı.');

  const isCreator = String(task.createdByUserId) === String(user._id);
  if (user.role !== ROLES.ADMIN && (!(await canAssignTasks(user)) || !isCreator)) {
    throw new ApiError(403, 'Forbidden');
  }

  await Task.findByIdAndDelete(id);
}

module.exports = { listTasks, createTask, getTask, updateTask, deleteTask };
