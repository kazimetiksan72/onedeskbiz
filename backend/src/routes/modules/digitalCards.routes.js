const express = require('express');
const controller = require('../../controllers/digitalCards/digitalCards.controller');
const { validate } = require('../../middleware/validate');
const { getPublicCardSchema } = require('../../validators/modules/businessCard.validator');

const router = express.Router();

router.get('/public/:userId', validate(getPublicCardSchema), controller.getPublicCard);

module.exports = router;
