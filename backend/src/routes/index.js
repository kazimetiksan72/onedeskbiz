const express = require('express');
const authRoutes = require('./modules/auth.routes');
const employeeRoutes = require('./modules/employees.routes');
const customerRoutes = require('./modules/customers.routes');
const contactRoutes = require('./modules/contacts.routes');
const contactActionLogRoutes = require('./modules/contactActionLogs.routes');
const vehicleRoutes = require('./modules/vehicles.routes');
const departmentRoleRoutes = require('./modules/departmentRoles.routes');
const requestRoutes = require('./modules/requests.routes');
const companySettingsRoutes = require('./modules/companySettings.routes');
const digitalCardRoutes = require('./modules/digitalCards.routes');
const leaveRequestRoutes = require('./modules/leaveRequests.routes');
const dashboardRoutes = require('./modules/dashboard.routes');
const profileRoutes = require('./modules/profile.routes');
const companySettingsController = require('../controllers/companySettings/companySettings.controller');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { enforcePasswordChange } = require('../middleware/enforcePasswordChange');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/digital-cards', digitalCardRoutes);
router.get('/company-settings/public-billing', companySettingsController.getPublicBillingInfo);

router.use('/employees', auth, enforcePasswordChange, employeeRoutes);
router.use('/profile', auth, enforcePasswordChange, profileRoutes);
router.use('/customers', auth, enforcePasswordChange, customerRoutes);
router.use('/contacts', auth, enforcePasswordChange, contactRoutes);
router.use('/contact-action-logs', auth, enforcePasswordChange, contactActionLogRoutes);
router.use('/vehicles', auth, enforcePasswordChange, vehicleRoutes);
router.use('/requests', auth, enforcePasswordChange, requestRoutes);
router.use(
  '/department-roles',
  auth,
  enforcePasswordChange,
  requireRole(ROLES.ADMIN),
  departmentRoleRoutes
);
router.use(
  '/company-settings',
  auth,
  enforcePasswordChange,
  requireRole(ROLES.ADMIN),
  companySettingsRoutes
);
router.use('/leave-requests', auth, enforcePasswordChange, leaveRequestRoutes);
router.use('/dashboard', auth, enforcePasswordChange, dashboardRoutes);

module.exports = router;
