const { z } = require('../common');

const bankAccountSchema = z.object({
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional()
});

const billingInfoSchema = z.object({
  legalCompanyName: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  bankAccounts: z.array(bankAccountSchema).max(50).optional()
});

const upsertCompanySettingsSchema = z.object({
  body: z.object({
    companyName: z.string().optional(),
    website: z.string().optional(),
    timezone: z.string().optional(),
    departments: z.array(z.string().min(1)).max(100).optional(),
    billingInfo: billingInfoSchema.optional()
  }),
  params: z.object({}),
  query: z.object({})
});

module.exports = { upsertCompanySettingsSchema };
