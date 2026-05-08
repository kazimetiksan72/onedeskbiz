const { z, objectId } = require('../common');
const { TASK_STATUS } = require('../../models/Task');

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(4000).optional().default(''),
    assignedUserId: objectId,
    dueDate: z.string().datetime().optional().nullable(),
    status: z.enum(Object.values(TASK_STATUS)).optional(),
    notes: z.string().max(4000).optional().default('')
  }),
  params: z.object({}),
  query: z.object({})
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(160).optional(),
    description: z.string().max(4000).optional(),
    assignedUserId: objectId.optional(),
    dueDate: z.string().datetime().optional().nullable(),
    status: z.enum(Object.values(TASK_STATUS)).optional(),
    notes: z.string().max(4000).optional()
  }),
  params: z.object({ id: objectId }),
  query: z.object({})
});

module.exports = { createTaskSchema, updateTaskSchema };
