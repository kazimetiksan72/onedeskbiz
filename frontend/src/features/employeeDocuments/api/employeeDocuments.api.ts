import { api } from '../../../api/client';
import type { EmployeeDocument, EmployeeDocumentType } from '../types/employeeDocument.types';

export async function getMyEmployeeDocuments() {
  const { data } = await api.get<EmployeeDocument[]>('/employee-documents/mine');
  return data;
}

export async function uploadMyEmployeeDocument(type: EmployeeDocumentType, file: File) {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('source', 'WEB_UPLOAD');
  formData.append('document', file);

  const { data } = await api.post<EmployeeDocument>('/employee-documents/mine', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return data;
}
