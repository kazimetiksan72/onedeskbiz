const { Asset, AssetAssignment, ASSET_ASSIGNMENT_STATUS, ASSET_ASSIGNMENT_TYPE } = require('../../models/Asset');
const { PERMISSIONS } = require('../../models/DepartmentRole');
const { User } = require('../../models/User');
const { ROLES } = require('../../constants/roles');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

function canManageAssets(user, department = '') {
  if (user.role === ROLES.ADMIN) return true;
  const permissions = user.departmentRoleId?.permissions || [];
  return permissions.includes(PERMISSIONS.ASSET_APPROVAL) && (!department || department === (user.department || ''));
}

function ensureAssetManager(user, department = '') {
  if (!canManageAssets(user, department)) {
    throw new ApiError(403, 'Demirbaş yönetim yetkiniz yok.');
  }
}

function normalizePayload(payload) {
  return {
    ...payload,
    name: payload.name?.trim(),
    category: payload.category?.trim(),
    brand: payload.brand?.trim() || '',
    model: payload.model?.trim() || '',
    serialNumber: payload.serialNumber?.trim() || undefined,
    inventoryCode: payload.inventoryCode?.trim() || undefined,
    department: payload.department?.trim() || '',
    notes: payload.notes?.trim() || ''
  };
}

function ensureDateRange(type, startAt, endAt) {
  if (type === ASSET_ASSIGNMENT_TYPE.TEMPORARY) {
    if (!startAt || !endAt) throw new ApiError(400, 'Geçici atama için başlangıç ve bitiş tarihi zorunludur.');
    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      throw new ApiError(400, 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
    }
  }
}

async function ensureAssetAvailable(assetId, type, startAt, endAt, excludeAssignmentId = null) {
  const query = {
    assetId,
    status: ASSET_ASSIGNMENT_STATUS.ACTIVE
  };

  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }

  const activeAssignments = await AssetAssignment.find(query).lean();
  const requestedStart = startAt ? new Date(startAt) : new Date();
  const requestedEnd = type === ASSET_ASSIGNMENT_TYPE.TEMPORARY ? new Date(endAt) : null;

  for (const assignment of activeAssignments) {
    if (assignment.type === ASSET_ASSIGNMENT_TYPE.PERMANENT || type === ASSET_ASSIGNMENT_TYPE.PERMANENT) {
      throw new ApiError(409, 'Bu demirbaş seçilen dönem için zaten atanmış.');
    }

    const existingStart = assignment.startAt ? new Date(assignment.startAt) : new Date(0);
    const existingEnd = assignment.endAt ? new Date(assignment.endAt) : new Date('9999-12-31T23:59:59.999Z');
    if (requestedStart <= existingEnd && requestedEnd >= existingStart) {
      throw new ApiError(409, 'Bu demirbaş seçilen tarih aralığında zaten atanmış.');
    }
  }
}

async function createAsset(user, payload) {
  ensureAssetManager(user, payload.department || '');
  return Asset.create(normalizePayload(payload));
}

async function listAssets(user, { page, limit, search, status }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (status && status !== 'ALL') query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { serialNumber: { $regex: search, $options: 'i' } },
      { inventoryCode: { $regex: search, $options: 'i' } }
    ];
  }

  if (user.role !== ROLES.ADMIN && user.department) {
    query.$and = [{ $or: [{ department: user.department }, { department: '' }, { department: { $exists: false } }] }];
  }

  const [items, total] = await Promise.all([
    Asset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Asset.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function updateAsset(user, id, payload) {
  const current = await Asset.findById(id).lean();
  if (!current) throw new ApiError(404, 'Demirbaş bulunamadı.');
  ensureAssetManager(user, payload.department ?? current.department ?? '');

  return Asset.findByIdAndUpdate(id, normalizePayload(payload), { new: true, runValidators: true }).lean();
}

async function deleteAsset(user, id) {
  const current = await Asset.findById(id).lean();
  if (!current) throw new ApiError(404, 'Demirbaş bulunamadı.');
  ensureAssetManager(user, current.department || '');

  const activeAssignment = await AssetAssignment.findOne({ assetId: id, status: ASSET_ASSIGNMENT_STATUS.ACTIVE }).lean();
  if (activeAssignment) throw new ApiError(409, 'Aktif ataması olan demirbaş silinemez.');

  await Asset.findByIdAndDelete(id);
}

async function listAssignments(user, { page, limit, mine }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (mine) {
    query.assignedUserId = user._id;
  } else if (user.role !== ROLES.ADMIN) {
    const assetIds = await Asset.find({ department: user.department || '' }).select('_id').lean();
    query.assetId = { $in: assetIds.map((asset) => asset._id) };
  }

  const [items, total] = await Promise.all([
    AssetAssignment.find(query)
      .populate('assetId')
      .populate('assignedUserId', 'firstName lastName workEmail department')
      .populate('assignedByUserId', 'firstName lastName workEmail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AssetAssignment.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function assignAsset(user, payload) {
  const asset = await Asset.findById(payload.assetId).lean();
  if (!asset || asset.status !== 'ACTIVE') throw new ApiError(404, 'Aktif demirbaş bulunamadı.');
  ensureAssetManager(user, asset.department || '');

  const assignedUser = await User.findById(payload.assignedUserId).select('_id department').lean();
  if (!assignedUser) throw new ApiError(404, 'Personel bulunamadı.');
  if (user.role !== ROLES.ADMIN && assignedUser.department !== (user.department || '')) {
    throw new ApiError(403, 'Sadece kendi departmanınızdaki personele atama yapabilirsiniz.');
  }

  const type = payload.type || ASSET_ASSIGNMENT_TYPE.PERMANENT;
  ensureDateRange(type, payload.startAt, payload.endAt);
  await ensureAssetAvailable(asset._id, type, payload.startAt, payload.endAt);

  return AssetAssignment.create({
    assetId: asset._id,
    assignedUserId: assignedUser._id,
    assignedByUserId: user._id,
    type,
    startAt: payload.startAt ? new Date(payload.startAt) : new Date(),
    endAt: type === ASSET_ASSIGNMENT_TYPE.TEMPORARY ? new Date(payload.endAt) : null,
    notes: payload.notes || '',
    requestId: payload.requestId || null
  });
}

async function returnAssignment(user, assignmentId) {
  const assignment = await AssetAssignment.findById(assignmentId).populate('assetId').lean();
  if (!assignment) throw new ApiError(404, 'Atama bulunamadı.');
  ensureAssetManager(user, assignment.assetId?.department || '');

  return AssetAssignment.findByIdAndUpdate(
    assignmentId,
    { $set: { status: ASSET_ASSIGNMENT_STATUS.RETURNED, returnedAt: new Date() } },
    { new: true, runValidators: true }
  ).lean();
}

module.exports = {
  assignAsset,
  canManageAssets,
  createAsset,
  deleteAsset,
  ensureAssetAvailable,
  listAssets,
  listAssignments,
  returnAssignment,
  updateAsset
};
