const { z, objectId } = require('../common');

const employeeBody = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  workEmail: z.string().email(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']).optional(),
  startDate: z.string().datetime(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  temporaryPassword: z.string().min(8).max(64),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relation: z.string().optional()
    })
    .optional()
});

const createEmployeeSchema = z.object({
  body: employeeBody,
  params: z.object({}),
  query: z.object({})
});

const updateEmployeeSchema = z.object({
  body: employeeBody
    .partial()
    .extend({ temporaryPassword: z.string().min(8).max(64).optional() }),
  params: z.object({ id: objectId }),
  query: z.object({})
});

const employeeParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({})
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeParamsSchema
};
