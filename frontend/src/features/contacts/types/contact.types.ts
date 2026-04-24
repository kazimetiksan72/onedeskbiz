import type { Customer } from '../../customers/types/customer.types';

export interface Contact {
  _id: string;
  customerId?: Pick<Customer, '_id' | 'companyName' | 'website' | 'phone' | 'address'> | null;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}
