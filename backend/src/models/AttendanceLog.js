const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ['CHECK_IN', 'CHECK_OUT'],
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    source: {
      type: String,
      enum: ['WEB', 'MOBILE', 'KIOSK', 'SYSTEM'],
      default: 'WEB'
    },
    metadata: {
      ip: String,
      userAgent: String,
      note: String
    }
  },
  {
    timestamps: true,
    collection: 'attendance_logs'
  }
);

attendanceLogSchema.index({ userId: 1, timestamp: -1 });
attendanceLogSchema.index({ timestamp: -1 });

const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);

module.exports = { AttendanceLog };
