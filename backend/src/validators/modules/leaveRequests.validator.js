const { z, objectId } = require('../common');

const createLeaveRequestSchema = z.object({
  body: z.object({
    employeeId: objectId.optional(),
    leaveType: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const reviewLeaveRequestSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reviewNote: z.string().optional()
  }),
  params: z.object({ id: objectId }),
  query: z.object({})
});

const leaveRequestQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    employeeId: objectId.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

module.exports = {
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
  leaveRequestQuerySchema
};
