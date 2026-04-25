const { z, objectId } = require('../common');

const createContactActionLogSchema = z.object({
  body: z.object({
    contactId: objectId,
    actionType: z.enum(['CALL', 'WHATSAPP', 'EMAIL'])
  }),
  params: z.object({}),
  query: z.object({})
});

const listContactActionLogsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
    actionType: z.enum(['CALL', 'WHATSAPP', 'EMAIL']).optional()
  })
});

module.exports = {
  createContactActionLogSchema,
  listContactActionLogsSchema
};
