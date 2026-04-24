export interface Vehicle {
  _id: string;
  plate: string;
  brand: string;
  model: string;
  modelYear: number;
  kilometer: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}
