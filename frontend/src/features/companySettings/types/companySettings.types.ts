export interface CompanySettings {
  _id: string;
  companyName: string;
  website?: string;
  timezone?: string;
  departments?: string[];
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
    bankAccounts?: {
      bankName?: string;
      branchName?: string;
      iban?: string;
      swiftCode?: string;
    }[];
  };
}
