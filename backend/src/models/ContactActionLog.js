const mongoose = require('mongoose');

const contactActionLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true
    },
    actionType: {
      type: String,
      enum: ['CALL', 'WHATSAPP', 'EMAIL'],
      required: true,
      index: true
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    contactSnapshot: {
      fullName: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      companyName: { type: String, trim: true }
    }
  },
  {
    timestamps: true,
    collection: 'contact_action_logs'
  }
);

contactActionLogSchema.index({ actorUserId: 1, occurredAt: -1 });
contactActionLogSchema.index({ contactId: 1, occurredAt: -1 });

const ContactActionLog = mongoose.model('ContactActionLog', contactActionLogSchema);

module.exports = { ContactActionLog };
