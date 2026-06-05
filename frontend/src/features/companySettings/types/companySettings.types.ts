export interface CompanySettings {
  _id: string;
  companyName: string;
  website?: string;
  logoUrl?: string;
  timezone?: string;
  departments?: string[];
  companyReferences?: {
    _id: string;
    name: string;
    logoUrl: string;
    blobName?: string;
    createdAt?: string;
    updatedAt?: string;
  }[];
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
