import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Landing.module.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === 'caregiver') {
        navigate('/caregiver/dashboard');
      } else if (user.role === 'care_seeker') {
        navigate('/seeker/dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Carelynk Homecare</h1>
        <p className={styles.subtitle}>
          Connecting care seekers with compassionate caregivers
        </p>

        <div className={styles.buttonGrid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>For Caregivers</h2>
            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={() => navigate('/auth/caregiver/signup')}
            >
              Sign Up as Caregiver
            </button>
            <button
              className={`${styles.button} ${styles.secondary}`}
              onClick={() => navigate('/auth/caregiver/login')}
            >
              Caregiver Login
            </button>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>For Care Seekers</h2>
            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={() => navigate('/auth/seeker/signup')}
            >
              Sign Up as Care Seeker
            </button>
            <button
              className={`${styles.button} ${styles.secondary}`}
              onClick={() => navigate('/auth/seeker/login')}
            >
              Seeker Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
