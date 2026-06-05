const { z, objectId } = require('../common');

const assetFields = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional().or(z.literal('')),
  inventoryCode: z.string().optional().or(z.literal('')),
  department: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().max(2000).optional()
});

const assetBodySchema = z.object({
  body: assetFields,
  params: z.object({}),
  query: z.object({})
});

const assetIdParamsSchema = z.object({
  body: assetFields.partial(),
  params: z.object({ id: objectId }),
  query: z.object({})
});

const assetAssignmentSchema = z.object({
  body: z
    .object({
      assetId: objectId,
      assignedUserId: objectId,
      type: z.enum(['PERMANENT', 'TEMPORARY']),
      startAt: z.string().datetime().optional(),
      endAt: z.string().datetime().optional(),
      notes: z.string().max(2000).optional()
    })
    .superRefine((body, ctx) => {
      if (body.type === 'TEMPORARY' && (!body.startAt || !body.endAt)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Geçici atama için başlangıç ve bitiş tarihi zorunludur.' });
      }
    }),
  params: z.object({}),
  query: z.object({})
});

const assignmentIdParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({})
});

module.exports = {
  assetAssignmentSchema,
  assetBodySchema,
  assetIdParamsSchema,
  assignmentIdParamsSchema
};
