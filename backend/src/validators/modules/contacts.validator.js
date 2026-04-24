const { z, objectId } = require('../common');

const contactBody = z.object({
  customerId: objectId.optional().or(z.literal('')),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal(''))
});

const createContactSchema = z.object({
  body: contactBody,
  params: z.object({}),
  query: z.object({})
});

const updateContactSchema = z.object({
  body: contactBody.partial(),
  params: z.object({ id: objectId }),
  query: z.object({})
});

const contactIdParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({})
});

module.exports = {
  createContactSchema,
  updateContactSchema,
  contactIdParamsSchema
};
