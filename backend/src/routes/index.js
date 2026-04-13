const express = require('express');
const authRoutes = require('./modules/auth.routes');
const employeeRoutes = require('./modules/employees.routes');
const customerRoutes = require('./modules/customers.routes');
const companySettingsRoutes = require('./modules/companySettings.routes');
const digitalCardRoutes = require('./modules/digitalCards.routes');
const attendanceRoutes = require('./modules/attendance.routes');
const leaveRequestRoutes = require('./modules/leaveRequests.routes');
const dashboardRoutes = require('./modules/dashboard.routes');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/digital-cards', digitalCardRoutes);

router.use('/employees', auth, employeeRoutes);
router.use('/customers', auth, customerRoutes);
router.use('/company-settings', auth, requireRole(ROLES.ADMIN), companySettingsRoutes);
router.use('/attendance', auth, attendanceRoutes);
router.use('/leave-requests', auth, leaveRequestRoutes);
router.use('/dashboard', auth, dashboardRoutes);

module.exports = router;
