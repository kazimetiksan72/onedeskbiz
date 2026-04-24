const { Contact } = require('../../models/Contact');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

function normalizeContactPayload(payload) {
  const normalized = { ...payload };

  if (!normalized.customerId) {
    normalized.customerId = null;
  }

  if (normalized.email === '') {
    delete normalized.email;
  }

  return normalized;
}

async function createContact(payload) {
  const contact = await Contact.create(normalizeContactPayload(payload));
  return Contact.findById(contact._id).populate('customerId', 'companyName website phone').lean();
}

async function listContacts({ page, limit, search }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Contact.find(query)
      .populate('customerId', 'companyName website phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Contact.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function getContactById(id) {
  const contact = await Contact.findById(id).populate('customerId', 'companyName website phone address').lean();

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  return contact;
}

async function updateContact(id, payload) {
  const contact = await Contact.findByIdAndUpdate(id, normalizeContactPayload(payload), {
    new: true,
    runValidators: true
  })
    .populate('customerId', 'companyName website phone')
    .lean();

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }

  return contact;
}

async function deleteContact(id) {
  const contact = await Contact.findByIdAndDelete(id).lean();

  if (!contact) {
    throw new ApiError(404, 'Contact not found');
  }
}

module.exports = {
  createContact,
  listContacts,
  getContactById,
  updateContact,
  deleteContact
};
