import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiPost } from '../../services/api';
import { toDataLoadingError, useDataLoading } from '../../hooks/useDataLoading';
import { CAREGIVER_PROFILE } from '../../utils/constants';
import { parseAvailabilitySlots } from '../../utils/availability';
import type { CaregiverProfile, JobAcceptRequest } from '../../types';
import './CaregiverDashboard.css';

interface DashboardData {
  profile: CaregiverProfile | null;
  acceptRequests: JobAcceptRequest[];
  acceptedJobs: JobAcceptRequest[];
}

interface DashboardError {
  status: number;
  message: string;
}

const CaregiverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (): Promise<DashboardData> => {
    const [profile, acceptRequests, acceptedJobs] = await Promise.all([
      apiGet<CaregiverProfile>(CAREGIVER_PROFILE),
      apiGet<JobAcceptRequest[]>('/api/caregiver/job-accept-requests'),
      apiGet<JobAcceptRequest[]>('/api/caregiver/accepted-jobs'),
    ]);

    return {
      profile,
      acceptRequests,
      acceptedJobs,
    };
  }, []);

  const {
    data: dashboardData,
    setData: setDashboardData,
    loading,
    error,
  } = useDataLoading<DashboardData, DashboardError>(fetchDashboardData, {
    initialData: {
      profile: null,
      acceptRequests: [],
      acceptedJobs: [],
    },
    mapError: (fetchError) => toDataLoadingError(fetchError, 'Failed to load profile'),
  });

  const calculateProfileCompletion = (profile: CaregiverProfile): number => {
    let completed = 0;
    const totalFields = 7;

    if (profile.name) completed++;
    if (profile.contact_info) completed++;
    if (profile.location) completed++;
    if (profile.skills && profile.skills.length > 0) completed++;
    if (profile.availability) completed++;
    if (profile.experience) completed++;
    if (profile.qualifications) completed++;

    return Math.round((completed / totalFields) * 100);
  };

  const handleAcceptJob = async (requestId: string) => {
    setAcceptingRequestId(requestId);
    setActionMessage(null);
    try {
      await apiPost(`/api/caregiver/job-accept-requests/${requestId}/accept`);
      setDashboardData((prev) => ({
        ...prev,
        acceptRequests: prev.acceptRequests.filter((request) => request.id !== requestId),
        acceptedJobs: [
          ...prev.acceptedJobs,
          ...prev.acceptRequests
            .filter((request) => request.id === requestId)
            .map((request) => ({
              ...request,
              status: 'accepted' as const,
              responded_at: new Date().toISOString(),
            })),
        ],
      }));
      setActionMessage('Job accepted successfully.');
    } catch (acceptError) {
      setActionMessage(acceptError instanceof Error ? acceptError.message : 'Failed to accept job.');
    } finally {
      setAcceptingRequestId(null);
    }
  };

  const getContactEmail = (request: JobAcceptRequest): string | null => {
    if (request.care_seeker?.email) {
      return request.care_seeker.email;
    }

    const contactInfo = request.care_seeker?.contact_info || '';
    return /\S+@\S+\.\S+/.test(contactInfo) ? contactInfo : null;
  };

  const renderSchedule = (schedule: string | undefined) => {
    const dayLabels: Record<string, string> = {
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
      sun: 'Sunday',
    };

    if (!schedule) {
      return <span className="schedule-fallback">N/A</span>;
    }

    const slots = parseAvailabilitySlots(schedule);
    if (slots === null) {
      return <span className="schedule-fallback">{schedule}</span>;
    }

    if (slots.length === 0) {
      return <span className="schedule-fallback">Not provided</span>;
    }

    return (
      <ul className="schedule-list">
        {slots.map((slot) => (
          <li key={`${slot.day}-${slot.start}-${slot.end}`} className="schedule-item">
            <span className="schedule-day">{dayLabels[slot.day] || slot.day}</span>
            <span className="schedule-time">{`${slot.start} - ${slot.end}`}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="caregiver-dashboard loading">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const profileCompletion = dashboardData.profile ? calculateProfileCompletion(dashboardData.profile) : 0;

  return (
    <div className="caregiver-dashboard">
      <div className="dashboard-container">
        <section className="welcome-section">
          <h2>Welcome, {user?.email || 'Caregiver'}!</h2>
          <p>Manage your profile and get matched with care seekers.</p>
          {actionMessage && <p className="action-message">{actionMessage}</p>}
        </section>

        <section className="profile-section">
        {error ? (
          <div className="error-message">
            {getErrorMessage(error.status)}
            {error.status === 404 && (
              <button className="btn btn-primary" onClick={() => navigate('/caregiver/onboarding')}>
                Create Profile
              </button>
            )}
          </div>
        ) : dashboardData.profile ? (
          <div className="profile-card">
            <h3>Profile Status</h3>
              <>
                <div className="profile-completion">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <p className="completion-text">
                    Profile {profileCompletion}% complete
                  </p>
                </div>
                {dashboardData.profile.name && (
                  <p className="profile-name">
                    <strong>Name:</strong> {dashboardData.profile.name}
                  </p>
                )}
                {dashboardData.profile.location && (
                  <p className="profile-location">
                    <strong>Location:</strong> {dashboardData.profile.location}
                  </p>
                )}
              </>
            </div>
          ) : (
            <div>
              <p className="no-profile">No profile created yet</p>
              <button className="btn btn-primary" onClick={() => navigate('/caregiver/onboarding')}>
                Start Onboarding
              </button>
            </div>
          )}
        </section>

        <section className="actions-section">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/caregiver/profile')}
            >
              {dashboardData.profile ? 'View/Edit Profile' : 'Create Profile'}
            </button>
          </div>
        </section>

        <section className="actions-section accepted-jobs-section">
          <h3>Accepted Jobs</h3>
          {dashboardData.acceptedJobs.length === 0 ? (
            <p className="section-empty-text">You have no accepted jobs yet.</p>
          ) : (
            <div className="accepted-job-list">
              {dashboardData.acceptedJobs.map((job) => (
                <div key={job.id} className="accepted-job-card">
                  <p>
                    <strong>Care Type:</strong> {job.care_request?.care_type || 'N/A'}
                  </p>
                  <p>
                    <strong>Location:</strong> {job.care_request?.service_location || 'N/A'}
                  </p>
                  <div className="schedule-row">
                    <strong>Schedule:</strong>
                    {renderSchedule(job.care_request?.schedule)}
                  </div>
                  <p>
                    <strong>Seeker:</strong> {job.care_seeker?.name || 'N/A'}
                  </p>
                  <p>
                    <strong>Contact:</strong> {job.care_seeker?.contact_info || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {dashboardData.acceptRequests.length > 0 && (
          <section className="actions-section">
            <h3>Incoming Job Accept Requests</h3>
            <div className="accept-request-list">
              {dashboardData.acceptRequests.map((request) => (
                <div key={request.id} className="accept-request-card">
                  <p>
                    <strong>Care Type:</strong> {request.care_request?.care_type || 'N/A'}
                  </p>
                  <p>
                    <strong>Location:</strong> {request.care_request?.service_location || 'N/A'}
                  </p>
                  <p>
                    <strong>Seeker:</strong> {request.care_seeker?.name || 'N/A'}
                  </p>
                  <p>
                    <strong>Contact:</strong> {request.care_seeker?.contact_info || 'N/A'}
                  </p>
                  <div className="accept-request-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAcceptJob(request.id)}
                      disabled={acceptingRequestId === request.id}
                    >
                      {acceptingRequestId === request.id ? 'Accepting...' : 'Accept Job'}
                    </button>
                    {getContactEmail(request) && (
                      <a
                        className="btn btn-secondary"
                        href={`mailto:${getContactEmail(request)}`}
                      >
                        Contact
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CaregiverDashboard;

const getErrorMessage = (status: number): string => {
  switch (status) {
    case 401:
      return 'Unauthorized access. Please log in again.';
    case 404:
      return 'Profile not found. Please complete your profile.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};
