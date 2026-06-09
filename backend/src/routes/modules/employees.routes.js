const express = require('express');
const controller = require('../../controllers/employees/employees.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeParamsSchema,
  generateJobDescriptionSchema
} = require('../../validators/modules/employees.validator');

const router = express.Router();

router.get('/', controller.listEmployees);
router.post(
  '/generate-job-description',
  requireRole(ROLES.ADMIN),
  validate(generateJobDescriptionSchema),
  controller.generateJobDescription
);
router.post('/', requireRole(ROLES.ADMIN), validate(createEmployeeSchema), controller.createEmployee);
router.get('/:id/profile-document.pdf', requireRole(ROLES.ADMIN), validate(employeeParamsSchema), controller.downloadEmployeeProfilePdf);
router.get('/:id', validate(employeeParamsSchema), controller.getEmployee);
router.patch('/:id', requireRole(ROLES.ADMIN), validate(updateEmployeeSchema), controller.updateEmployee);
router.delete('/:id', requireRole(ROLES.ADMIN), validate(employeeParamsSchema), controller.deleteEmployee);

module.exports = router;
