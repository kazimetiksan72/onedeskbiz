const { ActivityLog } = require('../../models/ActivityLog');
const { logger } = require('../../utils/logger');
const { getPagination } = require('../../utils/pagination');

async function logActivity({
  actorUserId = null,
  targetUserId = null,
  entityType,
  entityId = null,
  action,
  description,
  metadata = {}
}) {
  return ActivityLog.create({
    actorUserId,
    targetUserId,
    entityType,
    entityId,
    action,
    description,
    metadata
  });
}

async function listActivityLogs(_user, { page, limit, entityType, action }) {
  const { skip } = getPagination({ page, limit });
  const query = {};
  if (entityType) query.entityType = entityType;
  if (action) query.action = action;

  const [items, total] = await Promise.all([
    ActivityLog.find(query)
      .populate('actorUserId', 'firstName lastName workEmail email role')
      .populate('targetUserId', 'firstName lastName workEmail email role department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function logActivitySafe(payload) {
  try {
    await logActivity(payload);
  } catch (error) {
    logger.warn('Activity log could not be written', {
      error: logger.serializeError(error),
      entityType: payload.entityType,
      action: payload.action
    });
  }
}

module.exports = {
  logActivity,
  logActivitySafe,
  listActivityLogs
};
