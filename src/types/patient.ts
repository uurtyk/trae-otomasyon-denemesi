export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: Array<{
    condition: string;
    diagnosedDate: string;
    status: 'active' | 'resolved' | 'chronic';
    notes?: string;
  }>;
  allergies: string[];
  medications: string[];
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validUntil: string;
  };
  dentalChart?: {
    teeth: Array<{
      toothNumber: number;
      condition: string;
      surfaces?: string[];
      notes?: string;
    }>;
    updatedBy?: string;
    updatedAt?: string;
  };
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: Array<{
    condition: string;
    diagnosedDate: string;
    status: 'active' | 'resolved' | 'chronic';
    notes?: string;
  }>;
  allergies?: string[];
  medications?: string[];
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validUntil: string;
  };
  notes?: string;
}

export interface SearchPatientsParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'firstName' | 'lastName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}