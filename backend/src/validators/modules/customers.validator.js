const { z, objectId } = require('../common');

const customerBody = z.object({
  companyName: z.string().min(1),
  website: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
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
