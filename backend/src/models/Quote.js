const mongoose = require('mongoose');

const QUOTE_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

const VAT_RATES = [0, 8, 10, 18, 20];

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    vatRate: { type: Number, enum: VAT_RATES, default: 18 },
    lineTotal: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const quoteSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, trim: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(QUOTE_STATUS),
      default: QUOTE_STATUS.DRAFT,
      index: true
    },
    items: { type: [lineItemSchema], required: true, validate: { validator: (v) => v.length > 0, message: 'En az bir kalem gereklidir.' } },
    subtotal: { type: Number, required: true, min: 0 },
    vatTotal: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: 'TRY' },
    validUntil: { type: Date, default: null },
    notes: { type: String, trim: true }
  },
  {
    timestamps: true,
    collection: 'quotes'
  }
);

quoteSchema.index({ customerId: 1, status: 1, createdAt: -1 });

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = { Quote, QUOTE_STATUS, VAT_RATES };
