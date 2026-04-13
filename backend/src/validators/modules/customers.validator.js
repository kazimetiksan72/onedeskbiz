const { z, objectId } = require('../common');

const customerBody = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  ownerEmployeeId: objectId.optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

const createCustomerSchema = z.object({
  body: customerBody,
  params: z.object({}),
  query: z.object({})
});

const updateCustomerSchema = z.object({
  body: customerBody.partial(),
  params: z.object({ id: objectId }),
  query: z.object({})
});

const customerIdParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({})
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamsSchema
};
