const { Customer } = require('../../models/Customer');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

function normalizeCustomerPayload(payload) {
  const normalized = { ...payload };

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
      { website: { $regex: search, $options: 'i' } },
      { taxNumber: { $regex: search, $options: 'i' } },
      { taxOffice: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function getCustomerById(id) {
  const customer = await Customer.findById(id).lean();

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
