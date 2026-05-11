const express = require('express');
const controller = require('../../controllers/notifications/notifications.controller');

const router = express.Router();

router.get('/', controller.listNotifications);
router.patch('/:id/read', controller.markAsRead);
router.patch('/read-all', controller.markAllAsRead);

module.exports = router;
