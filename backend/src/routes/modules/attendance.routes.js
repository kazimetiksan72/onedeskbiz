const express = require('express');
const controller = require('../../controllers/attendance/attendance.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createAttendanceSchema,
  attendanceQuerySchema
} = require('../../validators/modules/attendance.validator');

const router = express.Router();

router.get('/', validate(attendanceQuerySchema), controller.listAttendance);
router.post('/', validate(createAttendanceSchema), controller.createAttendance);
router.post('/manual', requireRole(ROLES.ADMIN), validate(createAttendanceSchema), controller.createAttendance);

module.exports = router;
