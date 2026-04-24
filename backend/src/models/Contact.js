const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },
    firstName: { type: String, required: true, trim: true, index: true },
    lastName: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true }
  },
  {
    timestamps: true,
    collection: 'contacts'
  }
);

contactSchema.index({ firstName: 1, lastName: 1 });
contactSchema.index({ customerId: 1, lastName: 1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = { Contact };
