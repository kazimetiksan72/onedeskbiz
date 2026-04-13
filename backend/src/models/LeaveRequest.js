const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    leaveType: {
      type: String,
      enum: ['ANNUAL', 'SICK', 'UNPAID', 'OTHER'],
      required: true,
      index: true
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    days: { type: Number, required: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewNote: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: 'leave_requests'
  }
);

leaveRequestSchema.index({ userId: 1, startDate: -1 });
leaveRequestSchema.index({ status: 1, startDate: -1 });

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

module.exports = { LeaveRequest };
