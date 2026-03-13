import React from 'react';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword, validateConfirmPassword } from '../../utils/validators';
import { AUTH_SIGNUP_SEEKER, ROLE_SEEKER } from '../../utils/constants';
import styles from './AuthForm.module.css';
import { useAuthForm } from './useAuthForm';

const SeekerSignup: React.FC = () => {
  const navigate = useNavigate();
  const { values, errors, loading, serverError, updateField, handleSubmit } = useAuthForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    endpoint: AUTH_SIGNUP_SEEKER,
    role: ROLE_SEEKER,
    successRedirect: '/seeker/profile',
    submitErrorMessage: 'Signup failed. Please try again.',
    validate: (formValues) => {
      const newErrors: Record<string, string> = {};

      const emailError = validateEmail(formValues.email);
      if (emailError) newErrors.email = emailError;

      const passwordError = validatePassword(formValues.password);
      if (passwordError) newErrors.password = passwordError;

      const confirmError = validateConfirmPassword(formValues.password, formValues.confirmPassword);
      if (confirmError) newErrors.confirmPassword = confirmError;

      return newErrors;
    },
  });

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <h1 className={styles.title}>Sign Up as Care Seeker</h1>
          <p className={styles.subtitle}>Create your account to get started</p>
          {serverError && (
            <div className={styles.errorAlert}>{serverError}</div>
          )}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Enter your email"
                  className={errors.email ? styles.inputError : ''}
                />
              {errors.email && (
                <span className={styles.fieldError}>{errors.email}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={values.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={errors.password ? styles.inputError : ''}
                />
              {errors.password && (
                <span className={styles.fieldError}>{errors.password}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? styles.inputError : ''}
                />
              {errors.confirmPassword && (
                <span className={styles.fieldError}>{errors.confirmPassword}</span>
              )}
            </div>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        </div>
          <div className={styles.actionButtonsDiv}>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.reverseButton}`}
              onClick={() => navigate('/auth/seeker/login')}
            >
              Already have an account? <br></br>
              Login
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.opositeButton}`}
              onClick={() => navigate('/auth/caregiver/signup')}
            >
              Not a seeker?
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.homeButton}`}
              onClick={() => navigate('/')}
            >
              Home
            </button>
          </div>
      </div>
    </div>
  );
};

export default SeekerSignup;
