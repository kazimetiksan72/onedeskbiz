const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relation: { type: String, trim: true }
  },
  { _id: false }
);

const businessCardSchema = new mongoose.Schema(
  {
    displayName: { type: String, trim: true },
    title: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true },
    address: { type: String, trim: true },
    bio: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    publicSlug: { type: String, trim: true, lowercase: true },
    isPublic: { type: Boolean, default: false }
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    workEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    personalEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    department: { type: String, trim: true, index: true },
    title: { type: String, trim: true, index: true },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACTOR'],
      default: 'FULL_TIME'
    },
    startDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    },
    emergencyContact: emergencyContactSchema,
    businessCard: businessCardSchema
  },
  {
    timestamps: true,
    collection: 'employees'
  }
);

employeeSchema.index({ 'businessCard.publicSlug': 1 }, { unique: true, sparse: true });
employeeSchema.index({ firstName: 1, lastName: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = { Employee };
