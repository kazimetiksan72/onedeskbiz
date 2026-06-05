const express = require('express');
const controller = require('../../controllers/assets/assets.controller');
const { validate } = require('../../middleware/validate');
const {
  assetAssignmentSchema,
  assetBodySchema,
  assetIdParamsSchema,
  assignmentIdParamsSchema
} = require('../../validators/modules/assets.validator');

const router = express.Router();

router.get('/', controller.listAssets);
router.post('/', validate(assetBodySchema), controller.createAsset);
router.get('/assignments', controller.listAssignments);
router.post('/assignments', validate(assetAssignmentSchema), controller.assignAsset);
router.patch('/assignments/:id/return', validate(assignmentIdParamsSchema), controller.returnAssignment);
router.patch('/:id', validate(assetIdParamsSchema), controller.updateAsset);
router.delete('/:id', validate(assetIdParamsSchema), controller.deleteAsset);

module.exports = router;
