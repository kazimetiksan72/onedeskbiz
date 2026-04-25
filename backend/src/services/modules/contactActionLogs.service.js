const { Contact } = require('../../models/Contact');
const { ContactActionLog } = require('../../models/ContactActionLog');
const { ROLES } = require('../../constants/roles');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

async function createContactActionLog(actorUser, payload) {
  const contact = await Contact.findById(payload.contactId).populate('customerId', 'companyName').lean();

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  const log = await ContactActionLog.create({
    actorUserId: actorUser._id,
    contactId: contact._id,
    customerId: contact.customerId?._id || null,
    actionType: payload.actionType,
    occurredAt: new Date(),
    contactSnapshot: {
      fullName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      phone: contact.phone || '',
      email: contact.email || '',
      companyName: contact.customerId?.companyName || ''
    }
  });

  return ContactActionLog.findById(log._id)
    .populate('actorUserId', 'firstName lastName workEmail email')
    .populate('contactId', 'firstName lastName phone email')
    .populate('customerId', 'companyName')
    .lean();
}

async function listContactActionLogs({ user, page, limit, actionType }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (user.role !== ROLES.ADMIN) {
    query.actorUserId = user._id;
  }

  if (actionType) {
    query.actionType = actionType;
  }

  const [items, total] = await Promise.all([
    ContactActionLog.find(query)
      .populate('actorUserId', 'firstName lastName workEmail email')
      .populate('contactId', 'firstName lastName phone email')
      .populate('customerId', 'companyName')
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ContactActionLog.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

module.exports = {
  createContactActionLog,
  listContactActionLogs
};
