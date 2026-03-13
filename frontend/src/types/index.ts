/**
 * Global TypeScript interfaces for the Carelynk application
 */

export interface StructuredLocation {
  country_code: string;
  state_or_province: string;
  city: string;
  address_line?: string | null;
  postal_code?: string | null;
}

export interface User {
  id: string;
  email: string;
  role: 'caregiver' | 'care_seeker';
}

export interface AuthResponse {
  userId: string;
  email: string;
  role: 'caregiver' | 'care_seeker';
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string;
  };
}

export interface CareSeekerProfile {
  id: string;
  user_id: string;
  name: string;
  contact_info: string;
  location: string;
  location_details?: StructuredLocation | null;
}

export interface CaregiverProfile {
  id: string;
  user_id: string;
  name: string;
  contact_info: string;
  location: string;
  location_details?: StructuredLocation | null;
  skills: string[];
  experience_tags?: string[];
  experience?: string;
  availability: string;
  qualifications?: string;
}

export interface ExperienceOptionResponse {
  label: string;
}

export interface CareRequest {
  id: string;
  care_seeker_id: string;
  care_type: string;
  service_location: string;
  service_location_details?: StructuredLocation | null;
  schedule: string;
  duration: string;
  preferences?: string;
  required_experiences?: string[];
  accept_request_status?: JobAcceptRequestStatus | null;
  can_modify?: boolean;
  created_at?: string;
}

export interface Match {
  id: string;
  care_request_id: string;
  caregiver_id: string;
  matched_at: string;
  caregiver?: CaregiverProfile;
}

export type JobAcceptRequestStatus = 'pending' | 'accepted' | 'declined';

export interface JobAcceptRequest {
  id: string;
  care_request_id: string;
  caregiver_id: string;
  status: JobAcceptRequestStatus;
  created_at: string;
  responded_at?: string | null;
  is_accepted_by_caregiver?: boolean;
  accepted_caregiver_contact_email?: string | null;
  care_request?: {
    id: string;
    care_type: string;
    service_location: string;
    schedule: string;
    duration?: string | null;
  };
  care_seeker?: {
    id: string;
    name: string;
    contact_info: string;
    email?: string;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'caregiver' | 'care_seeker';
  iat?: number;
  exp?: number;
}
