/**
 * Authentication utilities for token and user management
 */

import { TOKEN_STORAGE_KEY } from './constants';
import type { TokenPayload } from '../types';

/**
 * Retrieve JWT token from localStorage
 * @returns JWT token or null if not present
 */
export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Store JWT token in localStorage
 * @param token JWT token to store
 */
export const saveToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    console.error('Failed to save token to localStorage');
  }
};

/**
 * Remove JWT token from localStorage
 */
export const clearStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    console.error('Failed to clear token from localStorage');
  }
};

/**
 * Decode JWT token and extract payload
 * @param token JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
const decodeToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    return payload as TokenPayload;
  } catch {
    return null;
  }
};

/**
 * Get decoded token payload with user info
 * @returns Token payload with userId, email, and role, or null if token invalid
 */
export const getTokenPayload = (): TokenPayload | null => {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  return decodeToken(token);
};

/**
 * Check if JWT token is valid and not expired
 * @returns true if token exists and is not expired, false otherwise
 */
export const isTokenValid = (): boolean => {
  const token = getStoredToken();
  if (!token) {
    return false;
  }

  const payload = decodeToken(token);
  if (!payload) {
    return false;
  }

  // Check expiration if exp claim exists
  if (payload.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  }

  // If no exp claim, assume token is valid
  return true;
};

/**
 * Get user ID from stored token
 * @returns User ID or null if token invalid
 */
export const getUserId = (): string | null => {
  const payload = getTokenPayload();
  return payload?.userId || null;
};

/**
 * Get user role from stored token
 * @returns User role ('caregiver' or 'care_seeker') or null if token invalid
 */
export const getUserRole = (): 'caregiver' | 'care_seeker' | null => {
  const payload = getTokenPayload();
  return payload?.role || null;
};
