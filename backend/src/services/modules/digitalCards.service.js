const { Employee } = require('../../models/Employee');
const { ApiError } = require('../../utils/apiError');

async function updateBusinessCard(employeeId, payload) {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }

  employee.businessCard = {
    ...(employee.businessCard?.toObject ? employee.businessCard.toObject() : employee.businessCard || {}),
    ...payload
  };

  await employee.save();

  return Employee.findById(employeeId).lean();
}

async function getPublicCard(slug) {
  const employee = await Employee.findOne({
    'businessCard.publicSlug': slug,
    'businessCard.isPublic': true,
    status: 'ACTIVE'
  }).lean();

  if (!employee || !employee.businessCard) {
    throw new ApiError(404, 'Business card not found');
  }

  return {
    employeeId: employee._id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    businessCard: employee.businessCard
  };
}

module.exports = { updateBusinessCard, getPublicCard };
