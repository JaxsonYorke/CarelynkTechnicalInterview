/**
 * My Jobs / Care Requests Page
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { toDataLoadingError, useDataLoading } from '../../hooks/useDataLoading';
import { apiDelete, apiGet } from '../../services/api';
import { formatAvailabilitySummary } from '../../utils/availability';
import type { CareRequest } from '../../types';

interface JobsError {
  status: number;
  message: string;
}

const MyJobs: React.FC = () => {
  const navigate = useNavigate();
  const fetchJobs = useCallback(async (): Promise<CareRequest[]> => {
    const jobsData = await apiGet<CareRequest[]>('/api/jobs');
    return jobsData || [];
  }, []);

  const {
    data: jobs,
    loading,
    error,
    setError,
    reload: refreshJobs,
  } = useDataLoading<CareRequest[], JobsError>(fetchJobs, {
    initialData: [],
    mapError: (fetchError) => toDataLoadingError(fetchError, 'Failed to load jobs'),
  });

  const handleDeleteJob = async (jobId: string, canModify?: boolean) => {
    if (canModify === false) {
      setError({
        status: 409,
        message: 'This request cannot be deleted because it was sent or accepted.',
      });
      return;
    }

    const confirmed = window.confirm('Delete this care request? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await apiDelete(`/api/jobs/${jobId}`);
      await refreshJobs();
    } catch (err) {
      setError(toDataLoadingError(err, 'Failed to delete request'));
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="care_seeker">
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
          <p style={{ textAlign: 'center' }}>Loading your care requests...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="care_seeker">
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1>My Care Requests</h1>
          <p style={{ color: '#666' }}>
            View and manage all your care requests
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33',
          }}>
            {error.message}
          </div>
        )}

        {jobs.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
          }}>
            <h2 style={{ color: '#666', marginBottom: '10px' }}>No Care Requests Yet</h2>
            <p style={{ color: '#999', marginBottom: '20px' }}>
              Start by creating your first care request to connect with caregivers.
            </p>
            <button
              onClick={() => navigate('/seeker/create-job')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Create Care Request
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => navigate('/seeker/create-job')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                + New Care Request
              </button>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              {jobs.map(job => (
                <div
                  key={job.id}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '15px',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                    <div style={{ marginBottom: '10px' }}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        {job.care_type}
                      </h3>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        Location: {job.service_location}
                      </p>
                    </div>

                    <div>
                      <span
                        style={{
                          fontSize: "14px",
                          opacity: 0.9,
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontWeight: 500,
                          color: "#fff",
                          background: job.accept_request_status === 'accepted' ? 'green' : '#6c757d'
                        }}
                      >
                        {job.accept_request_status === 'accepted' ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: '#999', fontSize: '12px' }}>Schedule</span>
                      <p style={{ margin: '3px 0', fontSize: '14px' }}>
                        {formatAvailabilitySummary(job.schedule)}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: '12px' }}>Duration</span>
                      <p style={{ margin: '3px 0', fontSize: '14px' }}>{job.duration}</p>
                    </div>
                  </div>

                  {job.preferences && (
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ color: '#999', fontSize: '12px' }}>Notes</span>
                      <p style={{ margin: '3px 0', fontSize: '14px', color: '#555' }}>
                        {job.preferences}
                      </p>
                    </div>
                  )}

                  {job.required_experiences && job.required_experiences.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                        Required Experience
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {job.required_experiences.map((experience) => (
                          <span
                            key={experience}
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#eef3ff',
                              color: '#3b5ccc',
                              borderRadius: '999px',
                              padding: '4px 10px',
                              fontSize: '12px',
                            }}
                          >
                            {experience}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{
                    marginTop: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        Created: {formatDate(job.created_at)}
                      </span>
                      {job.can_modify === false && (
                        <span style={{ fontSize: '12px', color: '#c33' }}>
                          Locked: already sent or accepted
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/seeker/matches/${job.id}`)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        View Matches
                      </button>
                      <button
                        onClick={() => navigate(`/seeker/jobs/${job.id}/edit`)}
                        disabled={job.can_modify === false}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: job.can_modify === false ? '#ccc' : '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: job.can_modify === false ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id, job.can_modify)}
                        disabled={job.can_modify === false}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: job.can_modify === false ? '#ccc' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: job.can_modify === false ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <button
            onClick={() => navigate('/seeker/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MyJobs;
