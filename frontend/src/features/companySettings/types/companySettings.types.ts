export interface CompanySettings {
  _id: string;
  companyName: string;
  domain?: string;
  timezone?: string;
  billingInfo: {
    legalCompanyName: string;
    taxNumber: string;
    taxOffice?: string;
    billingEmail?: string;
    phone?: string;
    address: string;
    city?: string;
    country?: string;
    postalCode?: string;
    bankDetails?: {
      bankName?: string;
      accountName?: string;
      iban?: string;
      swiftCode?: string;
    };
  };
}
