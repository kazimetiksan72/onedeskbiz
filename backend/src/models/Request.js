const mongoose = require('mongoose');

const REQUEST_TYPES = {
  VEHICLE: 'VEHICLE',
  LEAVE: 'LEAVE',
  MATERIAL: 'MATERIAL'
};

const REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const approvalActionSchema = new mongoose.Schema(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['APPROVE', 'REJECT'], required: true },
    note: { type: String, trim: true },
    actedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    requesterUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterDepartment: { type: String, trim: true, index: true },
    type: { type: String, enum: Object.values(REQUEST_TYPES), required: true, index: true },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
      index: true
    },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
    startAt: { type: Date, default: null, index: true },
    endAt: { type: Date, default: null, index: true },
    materialText: { type: String, trim: true },
    approvalAction: { type: approvalActionSchema, default: null }
  },
  {
    timestamps: true,
    collection: 'requests'
  }
);

requestSchema.index({ requesterUserId: 1, createdAt: -1 });
requestSchema.index({ requesterDepartment: 1, type: 1, status: 1, createdAt: -1 });

const Request = mongoose.model('Request', requestSchema);

module.exports = { Request, REQUEST_TYPES, REQUEST_STATUS };
