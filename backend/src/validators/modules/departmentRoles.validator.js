const { z, objectId } = require('../common');
const { PERMISSIONS } = require('../../models/DepartmentRole');

const roleBody = z.object({
  department: z.string().min(1),
  name: z.string().min(1),
  permissions: z.array(z.enum(Object.values(PERMISSIONS))).default([])
});

const createDepartmentRoleSchema = z.object({
  body: roleBody,
  params: z.object({}),
  query: z.object({})
});

const updateDepartmentRoleSchema = z.object({
  body: roleBody.partial(),
  params: z.object({ id: objectId }),
  query: z.object({})
});

const assignDepartmentRoleSchema = z.object({
  body: z.object({ departmentRoleId: objectId.nullable() }),
  params: z.object({ userId: objectId }),
  query: z.object({})
});

module.exports = {
  createDepartmentRoleSchema,
  updateDepartmentRoleSchema,
  assignDepartmentRoleSchema
};
