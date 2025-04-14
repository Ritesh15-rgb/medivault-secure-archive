
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  userId: string;
  doctorName: string;
  purpose: string;
  category: RecordCategory;
  description?: string;
  documentUrl: string;
  thumbnailUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  visitDate: Date;
  uploadedAt: Date;
  updatedAt?: Date;
}

export type RecordCategory = 
  | 'prescription' 
  | 'lab_report' 
  | 'consultation' 
  | 'imaging' 
  | 'vaccination' 
  | 'receipt' 
  | 'insurance' 
  | 'other';
