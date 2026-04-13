const express = require('express');
const controller = require('../../controllers/dashboard/dashboard.controller');

const router = express.Router();

router.get('/summary', controller.getDashboardSummary);

module.exports = router;
