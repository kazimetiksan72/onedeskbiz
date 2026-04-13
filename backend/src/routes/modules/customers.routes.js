const express = require('express');
const controller = require('../../controllers/customers/customers.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamsSchema
} = require('../../validators/modules/customers.validator');

const router = express.Router();

router.get('/', controller.listCustomers);
router.post('/', requireRole(ROLES.ADMIN), validate(createCustomerSchema), controller.createCustomer);
router.get('/:id', validate(customerIdParamsSchema), controller.getCustomer);
router.patch('/:id', requireRole(ROLES.ADMIN), validate(updateCustomerSchema), controller.updateCustomer);
router.delete('/:id', requireRole(ROLES.ADMIN), validate(customerIdParamsSchema), controller.deleteCustomer);

module.exports = router;
