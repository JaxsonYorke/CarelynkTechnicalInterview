import React, { useEffect, useState } from 'react';
import { apiGet } from '../../services/api';
import { parseAvailabilitySlots } from '../../utils/availability';
import type { JobAcceptRequest } from '../../types';
import './CaregiverAcceptedJobs.css';

interface AcceptedJobsState {
  jobs: JobAcceptRequest[];
  loading: boolean;
  error: string | null;
}

const CaregiverAcceptedJobs: React.FC = () => {
  const [state, setState] = useState<AcceptedJobsState>({
    jobs: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchAcceptedJobs = async () => {
      try {
        const jobs = await apiGet<JobAcceptRequest[]>('/api/caregiver/accepted-jobs');
        setState({ jobs, loading: false, error: null });
      } catch (error) {
        setState({
          jobs: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load accepted jobs.',
        });
      }
    };

    fetchAcceptedJobs();
  }, []);

  const formatDateTime = (timestamp?: string | null): string => {
    if (!timestamp) {
      return 'N/A';
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString();
  };

  const renderSchedule = (schedule: string | undefined | null) => {
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

  if (state.loading) {
    return (
      <div className="caregiver-accepted-jobs loading">
        <p>Loading accepted jobs...</p>
      </div>
    );
  }

  return (
    <div className="caregiver-accepted-jobs">
      <h2>Accepted Jobs</h2>

      {state.error && <p className="accepted-jobs-error">{state.error}</p>}

      {!state.error && state.jobs.length === 0 && (
        <p className="accepted-jobs-empty">No accepted jobs yet.</p>
      )}

      <div className="accepted-jobs-list">
        {state.jobs.map((job) => (
          <article key={job.id} className="accepted-job-card">
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
              <strong>Duration:</strong> {job.care_request?.duration || 'N/A'}
            </p>
            <p>
              <strong>Seeker Name:</strong> {job.care_seeker?.name || 'N/A'}
            </p>
            <p>
              <strong>Seeker Contact:</strong>{' '}
              {job.care_seeker?.email || job.care_seeker?.contact_info || 'N/A'}
            </p>
            <p>
              <strong>Accepted At:</strong> {formatDateTime(job.responded_at || job.created_at)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CaregiverAcceptedJobs;
