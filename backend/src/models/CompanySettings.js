const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true },
    branchName: { type: String, trim: true },
    iban: { type: String, trim: true },
    swiftCode: { type: String, trim: true }
  },
  { _id: false }
);

const billingInfoSchema = new mongoose.Schema(
  {
    legalCompanyName: { type: String, trim: true },
    taxNumber: { type: String, trim: true },
    taxOffice: { type: String, trim: true },
    billingEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    bankAccounts: { type: [bankAccountSchema], default: [] }
  },
  { _id: false }
);

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true },
    website: { type: String, trim: true, lowercase: true },
    timezone: { type: String, default: 'UTC' },
    departments: [{ type: String, trim: true }],
    billingInfo: { type: billingInfoSchema, default: {} }
  },
  {
    timestamps: true,
    collection: 'company_settings'
  }
);

companySettingsSchema.index({ companyName: 1 });

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

module.exports = { CompanySettings };
