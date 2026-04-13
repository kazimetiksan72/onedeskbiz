const { z } = require('../common');

const createLeaveRequestSchema = z.object({
  body: z.object({
    leaveType: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const leaveRequestQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

module.exports = {
  createLeaveRequestSchema,
  leaveRequestQuerySchema
};
