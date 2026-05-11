const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/notifications.service');

const listNotifications = asyncHandler(async (req, res) => {
  res.json(
    await service.listForUser(req.user, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 50),
      unreadOnly: req.query.unreadOnly === 'true'
    })
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  res.json(await service.markAsRead(req.user, req.params.id));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await service.markAllAsRead(req.user);
  res.status(204).send();
});

module.exports = { listNotifications, markAsRead, markAllAsRead };
