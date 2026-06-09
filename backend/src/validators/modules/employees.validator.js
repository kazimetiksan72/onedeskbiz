const { z, objectId } = require('../common');

function isValidTckn(value) {
  if (!value) return true;
  if (!/^[1-9][0-9]{10}$/.test(value)) return false;

  const digits = value.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenthDigit = ((oddSum * 7) - evenSum) % 10;
  const eleventhDigit = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;

  return digits[9] === tenthDigit && digits[10] === eleventhDigit;
}

const employeeBody = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  tckn: z.string().optional().or(z.literal('')).refine(isValidTckn, 'Geçerli bir TCKN girin.'),
  birthDate: z.string().datetime().optional().nullable(),
  workEmail: z.string().email(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  jobDescription: z.string().max(4000).optional(),
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

const generateJobDescriptionSchema = z.object({
  body: z.object({
    department: z.string().min(1),
    title: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeParamsSchema,
  generateJobDescriptionSchema
};
