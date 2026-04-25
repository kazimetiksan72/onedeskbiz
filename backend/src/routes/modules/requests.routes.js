const express = require('express');
const controller = require('../../controllers/requests/requests.controller');
const { validate } = require('../../middleware/validate');
const { createRequestSchema, requestActionSchema } = require('../../validators/modules/requests.validator');

const router = express.Router();

router.get('/mine', controller.listMyRequests);
router.post('/', validate(createRequestSchema), controller.createRequest);
router.get('/approvals', controller.listApprovals);
router.patch('/:id/approve', validate(requestActionSchema), controller.approveRequest);
router.patch('/:id/reject', validate(requestActionSchema), controller.rejectRequest);

module.exports = router;
