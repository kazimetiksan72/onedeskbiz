const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/activityLogs.service');

const listActivityLogs = asyncHandler(async (req, res) => {
  res.json(
    await service.listActivityLogs(req.user, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 100),
      entityType: req.query.entityType,
      action: req.query.action
    })
  );
});

module.exports = { listActivityLogs };
