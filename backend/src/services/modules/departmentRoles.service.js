const { DepartmentRole } = require('../../models/DepartmentRole');
const { DepartmentRoleAssignment } = require('../../models/DepartmentRoleAssignment');
const { User } = require('../../models/User');
const { ApiError } = require('../../utils/apiError');
const { attachDepartmentRole } = require('./departmentRoleAssignments.service');

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
  const item = await DepartmentRole.findByIdAndDelete(id).lean();
  if (!item) throw new ApiError(404, 'Rol bulunamadı.');

  await DepartmentRoleAssignment.deleteMany({ departmentRoleId: id });
  await User.collection.updateMany({ departmentRoleId: item._id }, { $unset: { departmentRoleId: '' } });
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
        ...(role ? { department: role.department } : {})
      }
    },
    { new: true, runValidators: true }
  )
    .select('-passwordHash')
    .lean();

  if (!user) throw new ApiError(404, 'Kullanıcı bulunamadı.');

  if (role) {
    await DepartmentRoleAssignment.findOneAndUpdate(
      { userId },
      { $set: { userId, departmentRoleId } },
      { upsert: true, new: true, runValidators: true }
    );
    await User.collection.updateOne({ _id: user._id }, { $unset: { departmentRoleId: '' } });
  } else {
    await DepartmentRoleAssignment.deleteOne({ userId });
    await User.collection.updateOne({ _id: user._id }, { $unset: { departmentRoleId: '' } });
  }

  return attachDepartmentRole(user);
}

module.exports = {
  listDepartmentRoles,
  createDepartmentRole,
  updateDepartmentRole,
  deleteDepartmentRole,
  assignRoleToUser
};
