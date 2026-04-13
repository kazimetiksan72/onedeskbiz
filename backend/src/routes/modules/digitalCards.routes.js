const express = require('express');
const controller = require('../../controllers/digitalCards/digitalCards.controller');
const { validate } = require('../../middleware/validate');
const { upload } = require('../../middleware/upload');
const { auth } = require('../../middleware/auth');
const {
  updateBusinessCardSchema,
  getPublicCardSchema
} = require('../../validators/modules/businessCard.validator');

const router = express.Router();

router.get('/public/:slug', validate(getPublicCardSchema), controller.getPublicCard);
router.patch(
  '/:employeeId',
  auth,
  upload.single('avatar'),
  validate(updateBusinessCardSchema),
  controller.updateBusinessCard
);

module.exports = router;
