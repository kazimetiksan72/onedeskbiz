const express = require('express');
const controller = require('../../controllers/employeeDocuments/employeeDocuments.controller');
const { documentMemoryUpload } = require('../../middleware/upload');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');

const router = express.Router();

router.get('/mine', controller.listMine);
router.post('/mine', documentMemoryUpload.single('document'), controller.uploadMine);
router.get('/employees/:userId', requireRole(ROLES.ADMIN), controller.listForEmployee);

module.exports = router;
