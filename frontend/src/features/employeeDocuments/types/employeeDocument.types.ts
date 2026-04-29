export type EmployeeDocumentType = 'POPULATION_REGISTRY' | 'RESIDENCE_CERTIFICATE' | 'GRADUATION_CERTIFICATE' | 'HEALTH_REPORT' | 'ID_CARD_FRONT' | 'ID_CARD_BACK';

export interface EmployeeDocument {
  _id: string;
  userId: string;
  type: EmployeeDocumentType;
  url: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  source?: 'WEB_UPLOAD' | 'MOBILE_SCAN' | 'MOBILE_CAMERA';
  createdAt: string;
  updatedAt: string;
}
