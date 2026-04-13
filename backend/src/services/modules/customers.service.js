const { Customer } = require('../../models/Customer');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

function normalizeCustomerPayload(payload) {
  const normalized = { ...payload };

  if (!normalized.ownerUserId) {
    delete normalized.ownerUserId;
  }

  if (normalized.contactEmail === '') {
    delete normalized.contactEmail;
  }

  return normalized;
}

async function createCustomer(payload) {
  return Customer.create(normalizeCustomerPayload(payload));
}

async function listCustomers({ page, limit, search }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { contactName: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Customer.find(query)
      .populate('ownerUserId', 'firstName lastName workEmail department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function getCustomerById(id) {
  const customer = await Customer.findById(id)
    .populate('ownerUserId', 'firstName lastName workEmail department')
    .lean();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  return customer;
}

async function updateCustomer(id, payload) {
  const customer = await Customer.findByIdAndUpdate(id, normalizeCustomerPayload(payload), {
    new: true,
    runValidators: true
  })
    .populate('ownerUserId', 'firstName lastName workEmail department')
    .lean();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  return customer;
}

async function deleteCustomer(id) {
  const customer = await Customer.findByIdAndDelete(id).lean();

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }
}

module.exports = {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
