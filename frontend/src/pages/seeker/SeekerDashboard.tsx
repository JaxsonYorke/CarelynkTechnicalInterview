/**
 * Care Seeker Dashboard - Main hub
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { apiGet } from '../../services/api';
import type { CareSeekerProfile, CareRequest } from '../../types';

interface DashboardError {
  status: number;
  message: string;
}

const SeekerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CareSeekerProfile | null>(null);
  const [jobs, setJobs] = useState<CareRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DashboardError | null>(null);

  // Fetch profile and jobs on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Try to fetch profile
        try {
          const profileData = await apiGet<CareSeekerProfile>('/api/seekers/profile');
          setProfile(profileData);
        } catch (err) {
          // Profile doesn't exist yet, that's ok
        }

        // Fetch jobs
        try {
          const jobsData = await apiGet<CareRequest[]>('/api/jobs');
          setJobs(jobsData || []);
        } catch (err) {
          // Failed to load jobs
        }
      } catch (err) {
        const errorStatus = err instanceof Error ? (err as any).status || 500 : 500;
        const errorMsg = err instanceof Error ? err.message : 'Failed to load dashboard';
        setError({ status: errorStatus, message: errorMsg });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const goToProfile = () => {
    navigate('/seeker/profile');
  };

  const goToCreateJob = () => {
    navigate('/seeker/create-job');
  };

  const goToMyJobs = () => {
    navigate('/seeker/my-jobs');
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="care_seeker">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading dashboard...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="care_seeker">

        {/* Main Content */}
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
          {/* Error Message */}
          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33',
            }}>
              {error.message}
            </div>
          )}

          {/* Welcome Section */}
          <div style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #ddd',
          }}>
            <h2 style={{ margin: '0 0 10px 0' }}>
              Welcome{profile?.name ? `, ${profile.name}` : ''}!
            </h2>
            <p style={{ margin: '0 0 15px 0', color: '#666' }}>
              Manage your care requests and connect with qualified caregivers.
            </p>

            {!profile && (
              <div style={{
                padding: '10px',
                backgroundColor: '#e7f3ff',
                border: '1px solid #b3d9ff',
                borderRadius: '4px',
                color: '#004085',
                marginBottom: '15px',
              }}>
                📋 Complete your profile to get started
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#007bff',
                marginBottom: '5px',
              }}>
                {jobs.length}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                Care Requests
              </div>
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: profile ? '#28a745' : '#dc3545',
                marginBottom: '5px',
              }}>
                {profile ? '✓' : '✗'}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                Profile Status
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
          }}>
            <button
              onClick={goToProfile}
              style={{
                padding: '15px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
            >
              👤 {profile ? 'Edit' : 'Complete'} Profile
            </button>

            <button
              onClick={goToCreateJob}
              style={{
                padding: '15px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e7e34')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
            >
              ➕ Create Care Request
            </button>

            <button
              onClick={goToMyJobs}
              style={{
                padding: '15px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#117a8b')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#17a2b8')}
            >
              📋 View My Requests
            </button>

            <button
              onClick={() => navigate('/seeker/browse-caregivers')}
              style={{
                padding: '15px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#545b62')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
            >
              👥 Browse Caregivers
            </button>
          </div>

          {/* Recent Jobs Preview */}
          {jobs.length > 0 && (
            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginBottom: '20px',
            }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Recent Care Requests</h3>
              <div style={{
                display: 'grid',
                gap: '10px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {jobs.slice(0, 3).map(job => (
                  <div
                    key={job.id}
                    style={{
                      padding: '10px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      borderLeft: '4px solid #007bff',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {job.care_type}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {job.service_location} • {job.schedule}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/seeker/matches/${job.id}`)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View Matches
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {jobs.length > 3 && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button
                    onClick={goToMyJobs}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      color: '#007bff',
                      border: '1px solid #007bff',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    View All {jobs.length} Requests
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Profile Info */}
          {profile && (
            <div style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Your Profile Information</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
              }}>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>Name</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {profile.name}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>Contact</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {profile.contact_info}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: '12px' }}>Location</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    {profile.location}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </ProtectedRoute>
  );
};

export default SeekerDashboard;
