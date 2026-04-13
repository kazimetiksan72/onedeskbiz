const { asyncHandler } = require('../../utils/asyncHandler');
const employeesService = require('../../services/modules/employees.service');

const createEmployee = asyncHandler(async (req, res) => {
  const item = await employeesService.createEmployee(req.body);
  res.status(201).json(item);
});

const listEmployees = asyncHandler(async (req, res) => {
  const result = await employeesService.listEmployees({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20),
    search: req.query.search
  });
  res.json(result);
});

const getEmployee = asyncHandler(async (req, res) => {
  const item = await employeesService.getEmployeeById(req.params.id);
  res.json(item);
});

const updateEmployee = asyncHandler(async (req, res) => {
  const item = await employeesService.updateEmployee(req.params.id, req.body);
  res.json(item);
});

const deleteEmployee = asyncHandler(async (req, res) => {
  await employeesService.deleteEmployee(req.params.id);
  res.status(204).send();
});

module.exports = {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
};
