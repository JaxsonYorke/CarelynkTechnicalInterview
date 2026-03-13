/**
 * Caregiver Portal Layout
 * Wrapper component for caregiver portal pages
 */

import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CaregiverLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ margin: '0', fontSize: '24px' }}>Caregiver Portal</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>{user?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <nav style={{
        backgroundColor: '#ecf0f1',
        padding: '12px 20px',
        borderBottom: '1px solid #bdc3c7',
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={() => navigate('/caregiver/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#2c3e50',
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => navigate('/caregiver/profile')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#2c3e50',
          }}
        >
          Profile
        </button>
        <button
          onClick={() => navigate('/caregiver/accepted-jobs')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#2c3e50',
          }}
        >
          Accepted Jobs
        </button>
        
      </nav>

      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>

      <footer style={{
        backgroundColor: '#ecf0f1',
        padding: '20px',
        textAlign: 'center',
        color: '#555',
        fontSize: '12px',
        borderTop: '1px solid #bdc3c7',
      }}>
        <p>&copy; 2024 Carelynk. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CaregiverLayout;
