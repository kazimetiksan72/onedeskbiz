const { Notification } = require('../../models/Notification');
const { getPagination } = require('../../utils/pagination');

async function createForUsers(userIds, { type, title, message, data = {} }) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map((id) => String(id)))];
  if (uniqueUserIds.length === 0) return [];

  return Notification.insertMany(
    uniqueUserIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      data
    })),
    { ordered: false }
  );
}

async function listForUser(user, { page, limit, unreadOnly }) {
  const { skip } = getPagination({ page, limit });
  const query = { userId: user._id };
  if (unreadOnly) query.readAt = null;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: user._id, readAt: null })
  ]);

  return { items, total, unreadCount, page, limit };
}

async function markAsRead(user, id) {
  const item = await Notification.findOneAndUpdate(
    { _id: id, userId: user._id },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  return item;
}

async function markAllAsRead(user) {
  await Notification.updateMany(
    { userId: user._id, readAt: null },
    { $set: { readAt: new Date() } }
  );
}

module.exports = {
  createForUsers,
  listForUser,
  markAsRead,
  markAllAsRead
};
