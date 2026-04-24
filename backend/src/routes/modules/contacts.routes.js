const express = require('express');
const controller = require('../../controllers/contacts/contacts.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createContactSchema,
  updateContactSchema,
  contactIdParamsSchema
} = require('../../validators/modules/contacts.validator');

const router = express.Router();

router.get('/', controller.listContacts);
router.post('/', requireRole(ROLES.ADMIN), validate(createContactSchema), controller.createContact);
router.get('/:id', validate(contactIdParamsSchema), controller.getContact);
router.patch('/:id', requireRole(ROLES.ADMIN), validate(updateContactSchema), controller.updateContact);
router.delete('/:id', requireRole(ROLES.ADMIN), validate(contactIdParamsSchema), controller.deleteContact);

module.exports = router;
