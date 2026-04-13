const { z, objectId } = require('../common');

const createAttendanceSchema = z.object({
  body: z.object({
    employeeId: objectId.optional(),
    type: z.enum(['CLOCK_IN', 'CLOCK_OUT']),
    timestamp: z.string().datetime().optional(),
    source: z.enum(['WEB', 'MANUAL']).optional(),
    note: z.string().max(300).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const attendanceQuerySchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    employeeId: objectId.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

module.exports = { createAttendanceSchema, attendanceQuerySchema };
