const { z } = require('../common');

const bankDetailsSchema = z.object({
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional()
});

const billingInfoSchema = z.object({
  legalCompanyName: z.string().min(1),
  taxNumber: z.string().min(1),
  taxOffice: z.string().optional(),
  billingEmail: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  bankDetails: bankDetailsSchema.optional()
});

const upsertCompanySettingsSchema = z.object({
  body: z.object({
    companyName: z.string().min(1),
    domain: z.string().optional(),
    timezone: z.string().optional(),
    billingInfo: billingInfoSchema
  }),
  params: z.object({}),
  query: z.object({})
});

module.exports = { upsertCompanySettingsSchema };
