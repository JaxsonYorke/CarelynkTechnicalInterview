import React from 'react';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword } from '../../utils/validators';
import { AUTH_LOGIN, ROLE_SEEKER } from '../../utils/constants';
import styles from './AuthForm.module.css';
import { useAuthForm } from './useAuthForm';

const SeekerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { values, errors, loading, serverError, updateField, handleSubmit } = useAuthForm({
    initialValues: {
      email: '',
      password: '',
    },
    endpoint: AUTH_LOGIN,
    role: ROLE_SEEKER,
    successRedirect: '/seeker/dashboard',
    submitErrorMessage: 'Login failed. Please try again.',
    validate: (formValues) => {
      const newErrors: Record<string, string> = {};

      const emailError = validateEmail(formValues.email);
      if (emailError) newErrors.email = emailError;

      const passwordError = validatePassword(formValues.password);
      if (passwordError) newErrors.password = passwordError;

      return newErrors;
    },
  });

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <h1 className={styles.title}>Care Seeker Login</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
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
                  placeholder="Enter your password"
                  className={errors.password ? styles.inputError : ''}
                />
              {errors.password && (
                <span className={styles.fieldError}>{errors.password}</span>
              )}
            </div>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
          <div className={styles.actionButtonsDiv}>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.reverseButton}`}
              onClick={() => navigate('/auth/seeker/signup')}
            >
              Don't have an account? <br></br>
              Sign Up
            </button>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.opositeButton}`}
              onClick={() => navigate('/auth/caregiver/login')}
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

export default SeekerLogin;
