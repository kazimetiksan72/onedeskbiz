const mongoose = require('mongoose');

const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED'
};

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 4000 },
    assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dueDate: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.TODO,
      index: true
    },
    notes: { type: String, trim: true, maxlength: 4000 }
  },
  {
    timestamps: true,
    collection: 'tasks'
  }
);

taskSchema.index({ assignedUserId: 1, status: 1, dueDate: 1 });
taskSchema.index({ createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task, TASK_STATUS };
