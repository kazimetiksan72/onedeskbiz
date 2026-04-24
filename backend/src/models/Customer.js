const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, index: true },
    website: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    taxNumber: { type: String, trim: true, index: true },
    taxOffice: { type: String, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'customers'
  }
);

customerSchema.index({ companyName: 1, status: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = { Customer };
