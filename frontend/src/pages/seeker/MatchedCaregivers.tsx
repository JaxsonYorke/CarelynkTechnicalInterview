import React, { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toDataLoadingError, useDataLoading } from '../../hooks/useDataLoading';
import { apiGet, apiPost } from '../../services/api';
import ProtectedRoute from '../../components/ProtectedRoute';
import { formatAvailabilitySummary } from '../../utils/availability';
import styles from './MatchedCaregivers.module.css';
import type { Match, CaregiverProfile, JobAcceptRequest, CareRequest } from '../../types';

interface MatchResponse {
  job_id: string;
  matches: Match[];
  accept_request: JobAcceptRequest | null;
  accept_requests: JobAcceptRequest[];
  accept_requests_by_caregiver: Record<string, JobAcceptRequest>;
}

type JobResponse = CareRequest;

interface MatchesError {
  status: number;
  message: string;
}

interface MatchedCaregiversData {
  job: CareRequest | null;
  matches: Match[];
  acceptRequest: JobAcceptRequest | null;
  acceptRequestsByCaregiver: Record<string, JobAcceptRequest>;
}

const MatchedCaregivers: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const fetchMatches = useCallback(async (): Promise<MatchedCaregiversData> => {
    if (!jobId) {
      return { job: null, matches: [], acceptRequest: null, acceptRequestsByCaregiver: {} };
    }

    const [matchesData, jobData] = await Promise.all([
      apiGet<MatchResponse>(`/api/jobs/${jobId}/matches`),
      apiGet<JobResponse>(`/api/jobs/${jobId}`),
    ]);

    return {
      job: jobData || null,
      matches: matchesData.matches || [],
      acceptRequest: matchesData.accept_request || null,
      acceptRequestsByCaregiver: matchesData.accept_requests_by_caregiver || {},
    };
  }, [jobId]);

  const {
    data: matchedData,
    setData: setMatchedData,
    loading,
    error,
    setError,
    reload,
  } = useDataLoading<MatchedCaregiversData, MatchesError>(fetchMatches, {
    initialData: { job: null, matches: [], acceptRequest: null, acceptRequestsByCaregiver: {} },
    enabled: Boolean(jobId),
    mapError: (fetchError) => toDataLoadingError(fetchError, 'Failed to load matches'),
  });

  const matches = matchedData.matches;
  const job = matchedData.job;
  const acceptRequestsByCaregiver = matchedData.acceptRequestsByCaregiver;
  const missingJobError = !jobId ? { status: 400, message: 'Job ID is missing' } : null;
  const displayError = missingJobError || error;

  const [acceptingCaregiverId, setAcceptingCaregiverId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRetry = () => {
    if (!jobId) {
      return;
    }

    void reload();
  };

  const handleBackToDashboard = () => {
    navigate('/seeker/dashboard');
  };

  const handleNewJob = () => {
    navigate('/seeker/create-job');
  };

  const handleAcceptMatch = async (caregiverId: string) => {
    if (!jobId) {
      return;
    }

    setAcceptingCaregiverId(caregiverId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiPost<JobAcceptRequest>(`/api/jobs/${jobId}/accept`, {
        caregiver_id: caregiverId,
      });
      setMatchedData((prev) => ({
        ...prev,
        acceptRequestsByCaregiver: {
          ...prev.acceptRequestsByCaregiver,
          [caregiverId]: response,
        },
      }));
      setSuccessMessage('Request sent to caregiver successfully.');
    } catch (err) {
      setError(toDataLoadingError(err, 'Failed to send accept request'));
    } finally {
      setAcceptingCaregiverId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute requiredRole="care_seeker">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Available Caregivers</h1>
          <p className={styles.subtitle}>Caregivers matching your care request</p>
        </div>

        <div className={styles.navigation}>
          <button
            className={styles.backButton}
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>
          <button
            className={styles.newJobButton}
            onClick={handleNewJob}
          >
            + Create New Request
          </button>
        </div>

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Finding the best caregivers for you...</p>
          </div>
        )}

        {displayError && (
          <div className={styles.errorContainer}>
            <div className={styles.error}>
              <p className={styles.errorTitle}>⚠️ Unable to Load Caregivers</p>
              <p className={styles.errorMessage}>{displayError.message}</p>
              <button className={styles.retryButton} onClick={handleRetry}>
                Try Again
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className={styles.successContainer}>
            <div className={styles.success}>
              <p className={styles.successTitle}>✅ Request Sent</p>
              <p className={styles.successMessage}>{successMessage}</p>
            </div>
          </div>
        )}

        {!loading && !displayError && job && (
          <div className={styles.requestSummaryContainer}>
            <div className={styles.requestSummaryCard}>
              <div className={styles.cardBody}>
                <p className={styles.requestSummaryTitle}>Request Summary</p>
                <div className={styles.requestSummaryRow}>
                  <span className={styles.requestSummaryLabel}>🩺 Care Type</span>
                  <span className={styles.requestSummaryValue}>{job.care_type}</span>
                </div>
                <div className={styles.requestSummaryRow}>
                  <span className={styles.requestSummaryLabel}>📍 Location</span>
                  <span className={styles.requestSummaryValue}>{job.service_location}</span>
                </div>
                <div className={styles.requestSummaryRow}>
                  <span className={styles.requestSummaryLabel}>⏰ Schedule</span>
                  <span className={styles.requestSummaryValue}>{formatAvailabilitySummary(job.schedule)}</span>
                </div>
                <div className={styles.requestSummaryRow}>
                  <span className={styles.requestSummaryLabel}>📅 Duration</span>
                  <span className={styles.requestSummaryValue}>{job.duration}</span>
                </div>
                <div className={styles.requestSummaryRow}>
                  <span className={styles.requestSummaryLabel}>💼 Required Experiences</span>
                  <div className={styles.requiredExperiencesList}>
                    {job.required_experiences && job.required_experiences.length > 0 ? (
                      job.required_experiences.map((experience, index) => (
                        <span key={`${experience}-${index}`} className={styles.requiredExperienceTag}>
                          {experience}
                        </span>
                      ))
                    ) : (
                      <span className={styles.requestSummaryValue}>Not specified</span>
                    )}
                  </div>
                </div>
                <div className={styles.requestSummaryRow}>
                  <span className={styles.requestSummaryLabel}>✨ Preferences</span>
                  <span className={styles.requestSummaryValue}>
                    {job.preferences && job.preferences.trim().length > 0
                      ? job.preferences
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !displayError && matches.length === 0 && (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>🔍</p>
              <p className={styles.emptyTitle}>No Caregivers Found Yet</p>
              <p className={styles.emptyMessage}>
                No caregivers currently match your requirements. Try adjusting your preferences or check back later.
              </p>
              <button className={styles.emptyActionButton} onClick={handleBackToDashboard}>
                Return to Dashboard
              </button>
            </div>
          </div>
        )}

        {!loading && !displayError && matches.length > 0 && (
          <div className={styles.matchesContainer}>
            <p className={styles.matchCount}>
              Found <strong>{matches.length}</strong> {matches.length === 1 ? 'caregiver' : 'caregivers'} available
            </p>
            
            <div className={styles.matchesList}>
              {matches.map((match) => (
                <CaregiverCard 
                  key={match.id} 
                  match={match} 
                  formatDate={formatDate}
                  accepting={acceptingCaregiverId === match.caregiver_id}
                  acceptRequest={acceptRequestsByCaregiver[match.caregiver_id] || null}
                  onAccept={handleAcceptMatch}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

interface CaregiverCardProps {
  match: Match;
  formatDate: (date: string) => string;
  accepting: boolean;
  acceptRequest: JobAcceptRequest | null;
  onAccept: (caregiverId: string) => void;
}

const CaregiverCard: React.FC<CaregiverCardProps> = ({
  match,
  formatDate,
  accepting,
  acceptRequest,
  onAccept,
}) => {
  const caregiver = match.caregiver as CaregiverProfile | undefined;

  if (!caregiver) {
    return null;
  }

  const hasAcceptRequest = !!acceptRequest;
  const isAcceptedByCaregiver = acceptRequest?.is_accepted_by_caregiver === true;
  const acceptedCaregiverContactEmail = acceptRequest?.accepted_caregiver_contact_email ?? null;
  const isDisabled = accepting || isAcceptedByCaregiver;
  const buttonLabel = accepting
    ? 'Sending...'
    : isAcceptedByCaregiver
      ? 'Accepted'
    : hasAcceptRequest
      ? 'Request Sent'
      : 'Accept Match';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.caregiverNameAndStatusDiv}>
          <h3 className={styles.caregiverName}>{caregiver.name}</h3>
          <span className={isAcceptedByCaregiver ? styles.accepted : hasAcceptRequest ? styles.pending : ''}>
          {isAcceptedByCaregiver ? `Accepted` : hasAcceptRequest ? `Pending` : '' }
          </span>
        </div>
        <span className={styles.matchedDate}>
          Matched {formatDate(match.matched_at)}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
          <span className={styles.label}>📍 Location</span>
          <span className={styles.value}>{caregiver.location}</span>
        </div>

        {caregiver.availability && (
          <div className={styles.infoRow}>
            <span className={styles.label}>⏰ Availability</span>
            <span className={styles.value}>
              {formatAvailabilitySummary(caregiver.availability)}
            </span>
          </div>
        )}

        {caregiver.skills && caregiver.skills.length > 0 && (
          <div className={styles.skillsRow}>
            <span className={styles.label}>🎯 Skills</span>
            <div className={styles.skills}>
              {caregiver.skills.map((skill, index) => (
                <span key={index} className={styles.skillTag}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {caregiver.qualifications && caregiver.qualifications.length > 0 && (
          <div className={styles.qualificationsRow}>
            <span className={styles.label}>📜 Qualifications</span>
            <div className={styles.qualifications}>
              <span className={styles.qualificationTag}>
                {caregiver.qualifications}
              </span>
            </div>
          </div>
        )}

        {caregiver.experience && (
          <div className={styles.infoRow}>
            <span className={styles.label}>👥 Experience</span>
            <span className={styles.value}>
              {caregiver.experience}
            </span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        {isAcceptedByCaregiver && acceptedCaregiverContactEmail ? (
          <a
            className={styles.contactButton}
            href={`mailto:${acceptedCaregiverContactEmail}`}
          >
            Contact Caregiver
          </a>
        ) : (
          <button
            className={styles.contactButton}
            onClick={() => onAccept(match.caregiver_id)}
            disabled={isDisabled}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchedCaregivers;
