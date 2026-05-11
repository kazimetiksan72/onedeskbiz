const express = require('express');
const controller = require('../../controllers/activityLogs/activityLogs.controller');

const router = express.Router();

router.get('/', controller.listActivityLogs);

module.exports = router;
