export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: 0 | 8 | 10 | 18 | 20;
  lineTotal: number;
}

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface CustomerRef {
  _id: string;
  companyName: string;
  taxNumber?: string;
  taxOffice?: string;
  address?: string;
  phone?: string;
}

export interface UserRef {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface Quote {
  _id: string;
  number: string;
  customerId: CustomerRef;
  createdByUserId: UserRef;
  status: QuoteStatus;
  items: LineItem[];
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  currency: string;
  validUntil?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


export interface LineItemForm {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}
