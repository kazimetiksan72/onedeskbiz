export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  personalEmail?: string;
  phone?: string;
  department?: string;
  title?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR';
  startDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  businessCard?: {
    displayName?: string;
    title?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    bio?: string;
    avatarUrl?: string;
    avatarPublicUrl?: string;
    isPublic?: boolean;
  };
}
