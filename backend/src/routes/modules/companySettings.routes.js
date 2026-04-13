const express = require('express');
const controller = require('../../controllers/companySettings/companySettings.controller');
const { validate } = require('../../middleware/validate');
const {
  upsertCompanySettingsSchema
} = require('../../validators/modules/companySettings.validator');

const router = express.Router();

router.get('/', controller.getCompanySettings);
router.put('/', validate(upsertCompanySettingsSchema), controller.upsertCompanySettings);

module.exports = router;
