/**
 * Application-wide constants
 */

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

// Auth endpoints
export const AUTH_SIGNUP_CAREGIVER = '/api/auth/caregiver/signup';
export const AUTH_SIGNUP_SEEKER = '/api/auth/care_seeker/signup';
export const AUTH_LOGIN = '/api/auth/login';
export const AUTH_LOGOUT = '/api/auth/logout';

// Caregiver endpoints
export const CAREGIVER_PROFILE = '/api/caregiver/profile';
export const CAREGIVER_SEARCH = '/api/caregiver/search';

// Care Seeker endpoints
export const CARE_SEEKER_PROFILE = '/api/care_seeker/profile';
export const CARE_SEEKER_REQUESTS = '/api/care_seeker/requests';

// Matching endpoints
export const MATCHES = '/api/matches';
export const MATCHES_PENDING = '/api/matches/pending';

// User roles
export const ROLE_CAREGIVER = 'caregiver';
export const ROLE_SEEKER = 'care_seeker';

// Storage keys
export const TOKEN_STORAGE_KEY = 'carelynk_token';
export const USER_STORAGE_KEY = 'carelynk_user';

// Error messages
export const ERROR_NETWORK = 'Network error. Please check your connection.';
export const ERROR_UNAUTHORIZED = 'Unauthorized. Please login again.';
export const ERROR_SERVER = 'Server error. Please try again later.';
export const ERROR_INVALID_TOKEN = 'Invalid or expired token.';

