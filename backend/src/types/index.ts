export type UserRole = 'caregiver' | 'care_seeker';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface CaregiverProfile {
  id: string;
  user_id: string;
  name: string;
  contact_info: string;
  location: string;
  skills: string[];
  experience: string | null;
  availability: string;
  qualifications: string | null;
  created_at: Date;
}

export interface CareSeekerProfile {
  id: string;
  user_id: string;
  name: string;
  contact_info: string;
  location: string;
  created_at: Date;
}

export interface CareRequest {
  id: string;
  care_seeker_id: string;
  care_type: string;
  service_location: string;
  schedule: string;
  duration: string | null;
  preferences: string | null;
  created_at: Date;
}

export interface Match {
  id: string;
  care_request_id: string;
  caregiver_id: string;
  matched_at: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPayload extends AuthPayload {
  iat: number;
  exp: number;
}
