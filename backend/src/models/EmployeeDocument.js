const mongoose = require('mongoose');

const EMPLOYEE_DOCUMENT_TYPES = {
  POPULATION_REGISTRY: 'POPULATION_REGISTRY',
  RESIDENCE_CERTIFICATE: 'RESIDENCE_CERTIFICATE',
  ID_CARD_FRONT: 'ID_CARD_FRONT',
  ID_CARD_BACK: 'ID_CARD_BACK'
};

const employeeDocumentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(EMPLOYEE_DOCUMENT_TYPES), required: true, index: true },
    url: { type: String, trim: true, required: true },
    fileName: { type: String, trim: true },
    originalName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number, min: 0 },
    uploadedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source: { type: String, enum: ['WEB_UPLOAD', 'MOBILE_SCAN', 'MOBILE_CAMERA'], default: 'WEB_UPLOAD' }
  },
  {
    timestamps: true,
    collection: 'employee_documents'
  }
);

employeeDocumentSchema.index({ userId: 1, type: 1, createdAt: -1 });

const EmployeeDocument = mongoose.model('EmployeeDocument', employeeDocumentSchema);

module.exports = { EmployeeDocument, EMPLOYEE_DOCUMENT_TYPES };
