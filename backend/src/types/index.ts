export type UserRole = 'caregiver' | 'care_seeker';

export interface StructuredLocation {
  country_code: string;
  state_or_province: string;
  city: string;
  address_line: string | null;
  postal_code: string | null;
}

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
  location_details: StructuredLocation | null;
  experience_tags: string[];
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
  service_location_details: StructuredLocation | null;
  schedule: string;
  duration: string | null;
  preferences: string | null;
  required_experiences: string[];
  created_at: Date;
}

export interface Match {
  id: string;
  care_request_id: string;
  caregiver_id: string;
  matched_at: Date;
}

export type JobAcceptRequestStatus = 'pending' | 'accepted' | 'declined';

export interface JobAcceptRequest {
  id: string;
  care_request_id: string;
  caregiver_id: string;
  status: JobAcceptRequestStatus;
  created_at: Date;
  responded_at: Date | null;
}

export interface JobAcceptRequestWithContext extends JobAcceptRequest {
  care_request: {
    id: string;
    care_type: string;
    service_location: string;
    schedule: string;
    duration: string | null;
  };
  care_seeker: {
    id: string;
    name: string;
    contact_info: string;
    email: string;
  };
}

export interface JobAcceptRequestForSeeker extends JobAcceptRequest {
  is_accepted_by_caregiver: boolean;
  accepted_caregiver_contact_email: string | null;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ExperienceOption {
  id: string;
  label: string;
  normalized_label: string;
  created_by_user_id: string | null;
  created_at: Date;
}

export interface SkillOption {
  id: string;
  label: string;
  normalized_label: string;
  created_by_user_id: string | null;
  created_at: Date;
}

export interface TokenPayload extends AuthPayload {
  iat: number;
  exp: number;
}
