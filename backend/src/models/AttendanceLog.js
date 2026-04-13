const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['CLOCK_IN', 'CLOCK_OUT'],
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    source: {
      type: String,
      enum: ['WEB', 'MANUAL'],
      default: 'WEB'
    },
    note: { type: String, trim: true }
  },
  {
    timestamps: true,
    collection: 'attendance_logs'
  }
);

attendanceLogSchema.index({ employeeId: 1, timestamp: -1 });
attendanceLogSchema.index({ timestamp: -1 });

const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);

module.exports = { AttendanceLog };
