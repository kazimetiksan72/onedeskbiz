const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true },
    accountName: { type: String, trim: true },
    iban: { type: String, trim: true },
    swiftCode: { type: String, trim: true }
  },
  { _id: false }
);

const billingInfoSchema = new mongoose.Schema(
  {
    legalCompanyName: { type: String, required: true, trim: true },
    taxNumber: { type: String, required: true, trim: true },
    taxOffice: { type: String, trim: true },
    billingEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    bankDetails: bankDetailsSchema
  },
  { _id: false }
);

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    domain: { type: String, trim: true, lowercase: true },
    timezone: { type: String, default: 'UTC' },
    billingInfo: { type: billingInfoSchema, required: true }
  },
  {
    timestamps: true,
    collection: 'company_settings'
  }
);

companySettingsSchema.index({ companyName: 1 });

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

module.exports = { CompanySettings };
