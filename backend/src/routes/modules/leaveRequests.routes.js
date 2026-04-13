const express = require('express');
const controller = require('../../controllers/leaveRequests/leaveRequests.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createLeaveRequestSchema,
  reviewLeaveRequestSchema,
  leaveRequestQuerySchema
} = require('../../validators/modules/leaveRequests.validator');

const router = express.Router();

router.get('/', validate(leaveRequestQuerySchema), controller.listLeaveRequests);
router.post('/', validate(createLeaveRequestSchema), controller.createLeaveRequest);
router.patch(
  '/:id/review',
  requireRole(ROLES.ADMIN),
  validate(reviewLeaveRequestSchema),
  controller.reviewLeaveRequest
);

module.exports = router;
