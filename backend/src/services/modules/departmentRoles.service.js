const { DepartmentRole } = require('../../models/DepartmentRole');
const { User } = require('../../models/User');
const { ApiError } = require('../../utils/apiError');

async function listDepartmentRoles() {
  return DepartmentRole.find({}).sort({ department: 1, name: 1 }).lean();
}

async function createDepartmentRole(payload) {
  return DepartmentRole.create(payload);
}

async function updateDepartmentRole(id, payload) {
  const item = await DepartmentRole.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
  if (!item) throw new ApiError(404, 'Rol bulunamadı.');
  return item;
}

async function deleteDepartmentRole(id) {
  const assignedCount = await User.countDocuments({ departmentRoleId: id });
  if (assignedCount > 0) {
    throw new ApiError(409, 'Bu rol personele atanmış olduğu için silinemez.');
  }

  const item = await DepartmentRole.findByIdAndDelete(id).lean();
  if (!item) throw new ApiError(404, 'Rol bulunamadı.');
}

async function assignRoleToUser(userId, departmentRoleId) {
  let role = null;
  if (departmentRoleId) {
    role = await DepartmentRole.findById(departmentRoleId).lean();
    if (!role) throw new ApiError(404, 'Rol bulunamadı.');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        departmentRoleId: departmentRoleId || null,
        ...(role ? { department: role.department } : {})
      }
    },
    { new: true, runValidators: true }
  )
    .select('-passwordHash')
    .populate('departmentRoleId')
    .lean();

  if (!user) throw new ApiError(404, 'Kullanıcı bulunamadı.');
  return user;
}

module.exports = {
  listDepartmentRoles,
  createDepartmentRole,
  updateDepartmentRole,
  deleteDepartmentRole,
  assignRoleToUser
};
