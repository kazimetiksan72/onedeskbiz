const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plate: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    brand: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true, index: true },
    modelYear: { type: Number, required: true, index: true },
    kilometer: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'vehicles'
  }
);

vehicleSchema.index({ plate: 1, status: 1 });
vehicleSchema.index({ brand: 1, model: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = { Vehicle };
