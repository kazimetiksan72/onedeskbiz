const express = require('express');
const controller = require('../../controllers/feed/feed.controller');
const { feedImageUpload } = require('../../middleware/upload');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');

const router = express.Router();

router.get('/', controller.listPublished);
router.get('/admin', requireRole(ROLES.ADMIN), controller.listAdmin);
router.post('/', requireRole(ROLES.ADMIN), feedImageUpload.single('image'), controller.createPost);
router.delete('/:id', requireRole(ROLES.ADMIN), controller.deletePost);

module.exports = router;
