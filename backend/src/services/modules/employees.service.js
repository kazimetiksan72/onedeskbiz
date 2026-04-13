const { Employee } = require('../../models/Employee');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

async function createEmployee(payload) {
  return Employee.create(payload);
}

async function listEmployees({ page, limit, search }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { workEmail: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Employee.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Employee.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function getEmployeeById(id) {
  const employee = await Employee.findById(id).lean();
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  return employee;
}

async function updateEmployee(id, payload) {
  const employee = await Employee.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  }).lean();

  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  return employee;
}

async function deleteEmployee(id) {
  const employee = await Employee.findByIdAndDelete(id).lean();

  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }
}

module.exports = {
  createEmployee,
  listEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
