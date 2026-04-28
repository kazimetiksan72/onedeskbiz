const mongoose = require('mongoose');

const PERMISSIONS = {
  VEHICLE_APPROVAL: 'VEHICLE_APPROVAL',
  LEAVE_APPROVAL: 'LEAVE_APPROVAL',
  MATERIAL_APPROVAL: 'MATERIAL_APPROVAL',
  EXPENSE_APPROVAL: 'EXPENSE_APPROVAL'
};

const departmentRoleSchema = new mongoose.Schema(
  {
    department: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    permissions: {
      type: [String],
      enum: Object.values(PERMISSIONS),
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'department_roles'
  }
);

departmentRoleSchema.index({ department: 1, name: 1 }, { unique: true });

const DepartmentRole = mongoose.model('DepartmentRole', departmentRoleSchema);

module.exports = { DepartmentRole, PERMISSIONS };
