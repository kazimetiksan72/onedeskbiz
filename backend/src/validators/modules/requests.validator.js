const { z, objectId } = require('../common');
const { REQUEST_TYPES } = require('../../models/Request');

const createRequestSchema = z.object({
  body: z
    .object({
      type: z.enum(Object.values(REQUEST_TYPES)),
      vehicleId: objectId.optional(),
      startAt: z.string().datetime().optional(),
      endAt: z.string().datetime().optional(),
      materialText: z.string().min(1).max(2000).optional(),
      expenseAmount: z.coerce.number().positive().optional(),
      expenseCurrency: z.string().min(3).max(3).default('TRY').optional(),
      expenseDescription: z.string().min(1).max(2000).optional()
    })
    .superRefine((body, ctx) => {
      if (body.type === REQUEST_TYPES.VEHICLE && (!body.vehicleId || !body.startAt || !body.endAt)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Araç, başlangıç ve bitiş tarihi zorunludur.' });
      }
      if (body.type === REQUEST_TYPES.LEAVE && (!body.startAt || !body.endAt)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Başlangıç ve bitiş tarihi zorunludur.' });
      }
      if (body.type === REQUEST_TYPES.MATERIAL && !body.materialText) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Malzeme talep metni zorunludur.' });
      }
      if (body.type === REQUEST_TYPES.EXPENSE && (!body.expenseAmount || !body.expenseDescription)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Masraf tutarı ve açıklaması zorunludur.' });
      }
    }),
  params: z.object({}),
  query: z.object({})
});

const requestActionSchema = z.object({
  body: z.object({ note: z.string().max(1000).optional() }),
  params: z.object({ id: objectId }),
  query: z.object({})
});

module.exports = {
  createRequestSchema,
  requestActionSchema
};
