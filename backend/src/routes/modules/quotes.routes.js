const express = require('express');
const controller = require('../../controllers/quotes/quotes.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createQuoteSchema,
  updateQuoteSchema,
  quoteIdParamsSchema,
  listQuotesSchema
} = require('../../validators/modules/quotes.validator');

const router = express.Router();

router.get('/', validate(listQuotesSchema), controller.listQuotes);
router.post('/', requireRole(ROLES.ADMIN), validate(createQuoteSchema), controller.createQuote);
router.get('/:id', validate(quoteIdParamsSchema), controller.getQuote);
router.patch('/:id', requireRole(ROLES.ADMIN), validate(updateQuoteSchema), controller.updateQuote);
router.delete('/:id', requireRole(ROLES.ADMIN), validate(quoteIdParamsSchema), controller.deleteQuote);
router.get('/:id/download', validate(quoteIdParamsSchema), controller.downloadQuote);
router.get('/:id/print', validate(quoteIdParamsSchema), controller.printQuote);

module.exports = router;
