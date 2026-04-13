const { z } = require('../common');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(64),
    role: z.enum(['ADMIN', 'EMPLOYEE']).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(64)
  }),
  params: z.object({}),
  query: z.object({})
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10)
  }),
  params: z.object({}),
  query: z.object({})
});

const changePasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8).max(64)
  }),
  params: z.object({}),
  query: z.object({})
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema
};
