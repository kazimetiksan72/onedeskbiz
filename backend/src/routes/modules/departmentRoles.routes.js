const express = require('express');
const controller = require('../../controllers/departmentRoles/departmentRoles.controller');
const { validate } = require('../../middleware/validate');
const { objectId, z } = require('../../validators/common');
const {
  createDepartmentRoleSchema,
  updateDepartmentRoleSchema,
  assignDepartmentRoleSchema
} = require('../../validators/modules/departmentRoles.validator');

const router = express.Router();

router.get('/', controller.listRoles);
router.post('/', validate(createDepartmentRoleSchema), controller.createRole);
router.patch('/:id', validate(updateDepartmentRoleSchema), controller.updateRole);
router.delete(
  '/:id',
  validate(z.object({ body: z.object({}), params: z.object({ id: objectId }), query: z.object({}) })),
  controller.deleteRole
);
router.patch('/users/:userId', validate(assignDepartmentRoleSchema), controller.assignRole);

module.exports = router;
