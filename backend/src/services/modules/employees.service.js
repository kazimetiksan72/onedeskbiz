const bcrypt = require('bcryptjs');
const { User } = require('../../models/User');
const { ROLES } = require('../../constants/roles');
const env = require('../../config/env');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');
const { DepartmentRoleAssignment } = require('../../models/DepartmentRoleAssignment');
const { attachDepartmentRole, attachDepartmentRoles } = require('./departmentRoleAssignments.service');

function syncBusinessCard(userPayload) {
  const existingCard = userPayload.businessCard || {};
  const displayName = `${userPayload.firstName || ''} ${userPayload.lastName || ''}`.trim();

  return {
    ...userPayload,
    businessCard: {
      ...existingCard,
      displayName,
      title: userPayload.title || '',
      phone: userPayload.phone || '',
      email: userPayload.workEmail?.toLowerCase() || '',
      isPublic: true
    }
  };
}

function pickUserProfileFields(payload) {
  return {
    firstName: payload.firstName,
    lastName: payload.lastName,
    workEmail: payload.workEmail,
    email: payload.workEmail,
    personalEmail: payload.personalEmail,
    phone: payload.phone,
    department: payload.department,
    title: payload.title,
    employmentType: payload.employmentType,
    startDate: payload.startDate,
    status: payload.status,
    emergencyContact: payload.emergencyContact,
    businessCard: payload.businessCard,
    isActive: payload.status !== 'INACTIVE'
  };
}

function normalizeWorkEmail(workEmail) {
  return (workEmail || '').toLowerCase().trim();
}

async function ensureUniqueEmail(workEmail, excludeUserId) {
  const query = {
    $or: [{ email: workEmail }, { workEmail }]
  };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const existing = await User.findOne(query).select('_id').lean();
  if (existing) {
    throw new ApiError(409, 'Email already in use');
  }
}

async function createEmployee(payload) {
  const { temporaryPassword, ...rawProfile } = payload;
  const normalizedWorkEmail = normalizeWorkEmail(rawProfile.workEmail);

  await ensureUniqueEmail(normalizedWorkEmail);

  const passwordHash = await bcrypt.hash(temporaryPassword, env.bcryptSaltRounds);
  const profile = syncBusinessCard({
    ...rawProfile,
    workEmail: normalizedWorkEmail
  });

  const created = await User.create({
    ...pickUserProfileFields(profile),
    passwordHash,
    role: ROLES.EMPLOYEE,
    mustChangePassword: false,
    passwordUpdatedAt: new Date()
  });

  const employee = await User.findById(created._id).select('-passwordHash').lean();
  return attachDepartmentRole(employee);
}

async function listEmployees({ page, limit, search }) {
  const { skip } = getPagination({ page, limit });
  const query = { role: ROLES.EMPLOYEE };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { workEmail: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  return { items: await attachDepartmentRoles(items), total, page, limit };
}

async function getEmployeeById(id) {
  const employee = await User.findOne({ _id: id, role: ROLES.EMPLOYEE })
    .select('-passwordHash')
    .lean();
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  return attachDepartmentRole(employee);
}

async function updateEmployee(id, payload) {
  const { temporaryPassword, ...rawProfile } = payload;
  const current = await User.findOne({ _id: id, role: ROLES.EMPLOYEE });

  if (!current) {
    throw new ApiError(404, 'Employee not found');
  }

  const mergedWorkEmail = normalizeWorkEmail(rawProfile.workEmail || current.workEmail);
  await ensureUniqueEmail(mergedWorkEmail, current._id);

  const mergedPayload = {
    firstName: rawProfile.firstName ?? current.firstName,
    lastName: rawProfile.lastName ?? current.lastName,
    workEmail: mergedWorkEmail,
    personalEmail: rawProfile.personalEmail ?? current.personalEmail,
    phone: rawProfile.phone ?? current.phone,
    department: rawProfile.department ?? current.department,
    title: rawProfile.title ?? current.title,
    employmentType: rawProfile.employmentType ?? current.employmentType,
    startDate: rawProfile.startDate ?? current.startDate,
    status: rawProfile.status ?? current.status,
    emergencyContact: rawProfile.emergencyContact ?? current.emergencyContact,
    businessCard: { ...(current.businessCard?.toObject?.() || current.businessCard || {}) }
  };

  const profile = syncBusinessCard(mergedPayload);
  const updates = pickUserProfileFields(profile);

  if (temporaryPassword) {
    updates.passwordHash = await bcrypt.hash(temporaryPassword, env.bcryptSaltRounds);
    updates.mustChangePassword = false;
    updates.passwordUpdatedAt = new Date();
  }

  const employee = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
    .select('-passwordHash')
    .lean();

  return attachDepartmentRole(employee);
}

async function deleteEmployee(id) {
  const employee = await User.findOneAndDelete({ _id: id, role: ROLES.EMPLOYEE }).lean();

  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  await DepartmentRoleAssignment.deleteOne({ userId: id });
}

module.exports = {
  createEmployee,
  listEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
