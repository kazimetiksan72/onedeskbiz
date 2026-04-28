const { DepartmentRoleAssignment } = require('../../models/DepartmentRoleAssignment');
const { DepartmentRole } = require('../../models/DepartmentRole');
const { User } = require('../../models/User');

async function getAssignmentMap(userIds) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map((id) => String(id)))];
  if (uniqueIds.length === 0) return new Map();

  const assignments = await DepartmentRoleAssignment.find({ userId: { $in: uniqueIds } })
    .populate('departmentRoleId')
    .lean();

  const assignmentMap = new Map(assignments.map((assignment) => [String(assignment.userId), assignment.departmentRoleId || null]));
  const missingIds = uniqueIds.filter((id) => !assignmentMap.has(id));

  if (missingIds.length === 0) return assignmentMap;

  const legacyUsers = await User.collection
    .find(
      { _id: { $in: missingIds.map((id) => DepartmentRoleAssignment.db.base.Types.ObjectId.createFromHexString(id)) } },
      { projection: { departmentRoleId: 1 } }
    )
    .toArray();

  const legacyRoleIds = legacyUsers
    .map((user) => user.departmentRoleId)
    .filter(Boolean)
    .map((id) => String(id));

  if (legacyRoleIds.length === 0) return assignmentMap;

  const legacyRoles = await DepartmentRole.find({ _id: { $in: legacyRoleIds } }).lean();
  const legacyRoleMap = new Map(legacyRoles.map((role) => [String(role._id), role]));

  await Promise.all(
    legacyUsers.map(async (user) => {
      const role = legacyRoleMap.get(String(user.departmentRoleId));
      if (!role) return;

      assignmentMap.set(String(user._id), role);
      await DepartmentRoleAssignment.updateOne(
        { userId: user._id },
        { $set: { userId: user._id, departmentRoleId: role._id } },
        { upsert: true }
      );
      await User.collection.updateOne({ _id: user._id }, { $unset: { departmentRoleId: '' } });
    })
  );

  return assignmentMap;
}

async function attachDepartmentRole(user) {
  if (!user) return user;
  const assignmentMap = await getAssignmentMap([user._id]);
  return {
    ...user,
    departmentRoleId: assignmentMap.get(String(user._id)) || null
  };
}

async function attachDepartmentRoles(users) {
  const assignmentMap = await getAssignmentMap(users.map((user) => user._id));
  return users.map((user) => ({
    ...user,
    departmentRoleId: assignmentMap.get(String(user._id)) || null
  }));
}

module.exports = {
  attachDepartmentRole,
  attachDepartmentRoles
};
