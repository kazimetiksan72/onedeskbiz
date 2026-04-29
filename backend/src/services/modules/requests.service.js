const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DepartmentRole, PERMISSIONS } = require('../../models/DepartmentRole');
const { Request, REQUEST_STATUS, REQUEST_TYPES } = require('../../models/Request');
const { Vehicle } = require('../../models/Vehicle');
const env = require('../../config/env');
const { ApiError } = require('../../utils/apiError');
const { logger } = require('../../utils/logger');
const { getPagination } = require('../../utils/pagination');
const { ROLES } = require('../../constants/roles');

const permissionByRequestType = {
  [REQUEST_TYPES.VEHICLE]: PERMISSIONS.VEHICLE_APPROVAL,
  [REQUEST_TYPES.LEAVE]: PERMISSIONS.LEAVE_APPROVAL,
  [REQUEST_TYPES.MATERIAL]: PERMISSIONS.MATERIAL_APPROVAL,
  [REQUEST_TYPES.EXPENSE]: PERMISSIONS.EXPENSE_APPROVAL
};

function ensureValidDateRange(startAt, endAt) {
  if (!startAt || !endAt) return;
  if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
    throw new ApiError(400, 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır.');
  }
}

function getBlobExtension(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ext) return ext;

  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  return '.jpg';
}

async function uploadExpenseAttachments(userId, files = []) {
  if (!files.length) return [];

  if (!env.azureStorage.connectionString) {
    throw new ApiError(500, 'Azure Storage is not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(env.azureStorage.connectionString);
  const containerClient = blobServiceClient.getContainerClient(env.azureStorage.containerName);
  await containerClient.createIfNotExists({ access: 'blob' });

  const uploaded = [];
  for (const file of files) {
    const extension = getBlobExtension(file);
    const fileName = `expense-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    const blobName = `expenses/${userId}/${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    logger.info('Uploading expense attachment to Azure Blob Storage', {
      userId: userId.toString(),
      containerName: env.azureStorage.containerName,
      blobName,
      mimeType: file.mimetype,
      size: file.size
    });

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl: 'public, max-age=31536000'
      }
    });

    uploaded.push({
      url: blockBlobClient.url,
      fileName,
      mimeType: file.mimetype,
      size: file.size
    });
  }

  return uploaded;
}

async function createRequest(user, payload, files = []) {
  ensureValidDateRange(payload.startAt, payload.endAt);

  if (payload.type === REQUEST_TYPES.VEHICLE) {
    const vehicle = await Vehicle.findById(payload.vehicleId).select('_id status').lean();
    if (!vehicle || vehicle.status !== 'ACTIVE') {
      throw new ApiError(404, 'Araç bulunamadı.');
    }
  }

  const expenseAttachments = payload.type === REQUEST_TYPES.EXPENSE
    ? await uploadExpenseAttachments(user._id, files)
    : [];

  return Request.create({
    requesterUserId: user._id,
    requesterDepartment: user.department || '',
    type: payload.type,
    vehicleId: payload.type === REQUEST_TYPES.VEHICLE ? payload.vehicleId : null,
    startAt: payload.startAt ? new Date(payload.startAt) : null,
    endAt: payload.endAt ? new Date(payload.endAt) : null,
    materialText: payload.type === REQUEST_TYPES.MATERIAL ? payload.materialText : '',
    expenseAmount: payload.type === REQUEST_TYPES.EXPENSE ? payload.expenseAmount : undefined,
    expenseCurrency: payload.type === REQUEST_TYPES.EXPENSE ? payload.expenseCurrency || 'TRY' : undefined,
    expenseDescription: payload.type === REQUEST_TYPES.EXPENSE ? payload.expenseDescription : '',
    expenseAttachments
  });
}

async function listMyRequests(user, { page, limit }) {
  const { skip } = getPagination({ page, limit });
  const query = { requesterUserId: user._id };

  const [items, total] = await Promise.all([
    Request.find(query)
      .populate('vehicleId')
      .populate('approvalAction.actorUserId', 'firstName lastName workEmail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function getApprovalPermissions(user) {
  if (user.role === ROLES.ADMIN) {
    return Object.values(permissionByRequestType);
  }

  const roleId = user.departmentRoleId?._id || user.departmentRoleId;
  if (!roleId) return [];

  const role = typeof user.departmentRoleId === 'object' && Array.isArray(user.departmentRoleId.permissions)
    ? user.departmentRoleId
    : await DepartmentRole.findById(roleId).select('permissions').lean();

  return role?.permissions || [];
}

async function listApprovals(user, { page, limit }) {
  const permissions = await getApprovalPermissions(user);
  const allowedTypes = Object.entries(permissionByRequestType)
    .filter(([, permission]) => permissions.includes(permission))
    .map(([type]) => type);

  if (allowedTypes.length === 0) {
    return { items: [], total: 0, page, limit };
  }

  const { skip } = getPagination({ page, limit });
  const query = {
    type: { $in: allowedTypes },
    status: REQUEST_STATUS.PENDING,
    requesterUserId: { $ne: user._id }
  };

  if (user.role !== ROLES.ADMIN) {
    query.requesterDepartment = user.department || '';
  }

  const [items, total] = await Promise.all([
    Request.find(query)
      .populate('requesterUserId', 'firstName lastName workEmail department')
      .populate('vehicleId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function actOnRequest(user, id, action, note) {
  const request = await Request.findById(id);
  if (!request) throw new ApiError(404, 'Talep bulunamadı.');
  if (request.status !== REQUEST_STATUS.PENDING) {
    throw new ApiError(409, 'Bu talep daha önce sonuçlandırılmış.');
  }

  const permissions = await getApprovalPermissions(user);
  const requiredPermission = permissionByRequestType[request.type];
  const sameDepartment = user.role === ROLES.ADMIN || request.requesterDepartment === (user.department || '');

  if (!permissions.includes(requiredPermission) || !sameDepartment || String(request.requesterUserId) === String(user._id)) {
    throw new ApiError(403, 'Bu talep için onay yetkiniz yok.');
  }

  request.status = action === 'APPROVE' ? REQUEST_STATUS.APPROVED : REQUEST_STATUS.REJECTED;
  request.approvalAction = {
    actorUserId: user._id,
    action,
    note,
    actedAt: new Date()
  };

  await request.save();
  return Request.findById(request._id)
    .populate('requesterUserId', 'firstName lastName workEmail department')
    .populate('vehicleId')
    .populate('approvalAction.actorUserId', 'firstName lastName workEmail')
    .lean();
}

module.exports = {
  createRequest,
  listMyRequests,
  listApprovals,
  approveRequest: (user, id, note) => actOnRequest(user, id, 'APPROVE', note),
  rejectRequest: (user, id, note) => actOnRequest(user, id, 'REJECT', note)
};
