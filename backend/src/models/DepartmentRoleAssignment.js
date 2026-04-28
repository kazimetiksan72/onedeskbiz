const mongoose = require('mongoose');

const departmentRoleAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    departmentRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DepartmentRole',
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'department_role_assignments'
  }
);

departmentRoleAssignmentSchema.index({ userId: 1, departmentRoleId: 1 });

const DepartmentRoleAssignment = mongoose.model('DepartmentRoleAssignment', departmentRoleAssignmentSchema);

module.exports = { DepartmentRoleAssignment };
