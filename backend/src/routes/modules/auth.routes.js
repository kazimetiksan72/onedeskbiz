const express = require('express');
const authController = require('../../controllers/auth/auth.controller');
const { auth } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema
} = require('../../validators/modules/auth.validator');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/change-password', auth, validate(changePasswordSchema), authController.changePassword);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.get('/me', auth, authController.me);

module.exports = router;
