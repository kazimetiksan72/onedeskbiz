export type ContactActionType = 'CALL' | 'WHATSAPP' | 'EMAIL';

export interface ContactActionLog {
  _id: string;
  actorUserId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    workEmail?: string;
    email?: string;
  };
  contactId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  customerId?: {
    _id: string;
    companyName?: string;
  } | null;
  actionType: ContactActionType;
  occurredAt: string;
  contactSnapshot?: {
    fullName?: string;
    phone?: string;
    email?: string;
    companyName?: string;
  };
}
