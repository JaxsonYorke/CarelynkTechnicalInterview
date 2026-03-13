/**
 * Not Found (404) Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
    }}>
      <h1 style={{ fontSize: '72px', margin: '0', color: '#dc3545' }}>404</h1>
      <h2 style={{ fontSize: '32px', marginTop: '10px', marginBottom: '10px', color: '#333' }}>
        Page Not Found
      </h2>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Return to Home
      </button>
    </div>
  );
};

export default NotFound;
