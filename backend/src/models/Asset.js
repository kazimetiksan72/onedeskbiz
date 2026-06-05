const mongoose = require('mongoose');

const ASSET_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

const ASSET_ASSIGNMENT_TYPE = {
  PERMANENT: 'PERMANENT',
  TEMPORARY: 'TEMPORARY'
};

const ASSET_ASSIGNMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  RETURNED: 'RETURNED'
};

const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true, unique: true, sparse: true, index: true },
    inventoryCode: { type: String, trim: true, unique: true, sparse: true, index: true },
    department: { type: String, trim: true, index: true },
    status: { type: String, enum: Object.values(ASSET_STATUS), default: ASSET_STATUS.ACTIVE, index: true },
    notes: { type: String, trim: true }
  },
  {
    timestamps: true,
    collection: 'assets'
  }
);

const assetAssignmentSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(ASSET_ASSIGNMENT_TYPE), required: true, index: true },
    startAt: { type: Date, default: Date.now, index: true },
    endAt: { type: Date, default: null, index: true },
    status: { type: String, enum: Object.values(ASSET_ASSIGNMENT_STATUS), default: ASSET_ASSIGNMENT_STATUS.ACTIVE, index: true },
    returnedAt: { type: Date, default: null },
    notes: { type: String, trim: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', default: null }
  },
  {
    timestamps: true,
    collection: 'asset_assignments'
  }
);

assetAssignmentSchema.index({ assetId: 1, status: 1, startAt: 1, endAt: 1 });
assetAssignmentSchema.index({ assignedUserId: 1, status: 1 });

const Asset = mongoose.model('Asset', assetSchema);
const AssetAssignment = mongoose.model('AssetAssignment', assetAssignmentSchema);

module.exports = {
  Asset,
  AssetAssignment,
  ASSET_STATUS,
  ASSET_ASSIGNMENT_TYPE,
  ASSET_ASSIGNMENT_STATUS
};
