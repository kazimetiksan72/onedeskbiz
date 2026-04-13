const express = require('express');
const controller = require('../../controllers/leaveRequests/leaveRequests.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createLeaveRequestSchema,
  leaveRequestQuerySchema
} = require('../../validators/modules/leaveRequests.validator');

const router = express.Router();

router.get('/', requireRole(ROLES.EMPLOYEE), validate(leaveRequestQuerySchema), controller.listLeaveRequests);
router.post('/', requireRole(ROLES.EMPLOYEE), validate(createLeaveRequestSchema), controller.createLeaveRequest);

module.exports = router;
