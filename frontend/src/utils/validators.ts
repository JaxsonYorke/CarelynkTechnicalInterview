/**
 * Form validation helper functions
 */

/**
 * Validate email format
 * @param email Email address to validate
 * @returns Error message or null if valid
 */
export const validateEmail = (email: string): string | null => {
  if (!email || email.trim().length === 0) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
};

/**
 * Validate password strength
 * @param password Password to validate
 * @returns Error message or null if valid
 */
export const validatePassword = (password: string): string | null => {
  if (!password || password.length === 0) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  return null;
};

/**
 * Validate confirm password matches password
 * @param password Password to match
 * @param confirmPassword Password confirmation to match
 * @returns Error message or null if valid
 */
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return 'Confirm password is required';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
};

/**
 * Validate location (required, non-empty)
 * @param location Location to validate
 * @returns Error message or null if valid
 */
export const validateLocation = (location: string): string | null => {
  if (!location || location.trim().length === 0) {
    return 'Location is required';
  }

  if (location.trim().length < 2) {
    return 'Location must be at least 2 characters long';
  }

  return null;
};

/**
 * Validate name (required, non-empty)
 * @param name Name to validate
 * @returns Error message or null if valid
 */
export const validateName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }

  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters long';
  }

  if (name.trim().length > 100) {
    return 'Name must be less than 100 characters';
  }

  return null;
};

/**
 * Validate contact info (required, non-empty)
 * @param contactInfo Contact information to validate
 * @returns Error message or null if valid
 */
export const validateContactInfo = (contactInfo: string): string | null => {
  if (!contactInfo || contactInfo.trim().length === 0) {
    return 'Contact information is required';
  }

  if (contactInfo.trim().length < 5) {
    return 'Please enter valid contact information';
  }

  return null;
};
