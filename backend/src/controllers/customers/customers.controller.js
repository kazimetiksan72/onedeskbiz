const { asyncHandler } = require('../../utils/asyncHandler');
const customersService = require('../../services/modules/customers.service');

const createCustomer = asyncHandler(async (req, res) => {
  const item = await customersService.createCustomer(req.body);
  res.status(201).json(item);
});

const listCustomers = asyncHandler(async (req, res) => {
  const result = await customersService.listCustomers({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20),
    search: req.query.search
  });
  res.json(result);
});

const getCustomer = asyncHandler(async (req, res) => {
  const item = await customersService.getCustomerById(req.params.id);
  res.json(item);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const item = await customersService.updateCustomer(req.params.id, req.body);
  res.json(item);
});

const deleteCustomer = asyncHandler(async (req, res) => {
  await customersService.deleteCustomer(req.params.id);
  res.status(204).send();
});

module.exports = {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer
};
