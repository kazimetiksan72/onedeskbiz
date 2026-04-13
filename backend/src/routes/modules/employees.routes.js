const express = require('express');
const controller = require('../../controllers/employees/employees.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamsSchema
} = require('../../validators/modules/employees.validator');

const router = express.Router();

router.get('/', controller.listEmployees);
router.post('/', requireRole(ROLES.ADMIN), validate(createEmployeeSchema), controller.createEmployee);
router.get('/:id', validate(employeeIdParamsSchema), controller.getEmployee);
router.patch('/:id', requireRole(ROLES.ADMIN), validate(updateEmployeeSchema), controller.updateEmployee);
router.delete('/:id', requireRole(ROLES.ADMIN), validate(employeeIdParamsSchema), controller.deleteEmployee);

module.exports = router;
