const express = require('express');
const controller = require('../../controllers/profile/profile.controller');
const { memoryUpload } = require('../../middleware/upload');

const router = express.Router();

router.post('/photo', memoryUpload.single('photo'), controller.uploadProfilePhoto);

module.exports = router;
