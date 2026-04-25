const express = require('express');
const controller = require('../../controllers/contactActionLogs/contactActionLogs.controller');
const { validate } = require('../../middleware/validate');
const {
  createContactActionLogSchema,
  listContactActionLogsSchema,
  updateContactActionLogNoteSchema
} = require('../../validators/modules/contactActionLogs.validator');

const router = express.Router();

router.get('/', validate(listContactActionLogsSchema), controller.listContactActionLogs);
router.post('/', validate(createContactActionLogSchema), controller.createContactActionLog);
router.patch('/:id/note', validate(updateContactActionLogNoteSchema), controller.updateContactActionLogNote);

module.exports = router;
