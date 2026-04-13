const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, index: true },
    contactName: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true, index: true },
    contactPhone: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    ownerEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
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
