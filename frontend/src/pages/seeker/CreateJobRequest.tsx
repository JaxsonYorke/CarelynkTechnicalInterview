/**
 * Create Care Request/Job Page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { apiGet, apiPatch, apiPost } from '../../services/api';
import {
  parseAvailabilitySlots,
  serializeAvailabilitySlots,
  validateAvailabilitySlots,
  type AvailabilityDay,
  type AvailabilitySlot,
} from '../../utils/availability';
import {
  emptyLocationFields,
  formatLocationString,
  parseLocationString,
  parseStructuredLocation,
  toStructuredLocation,
  validateLocationFields,
  type LocationFields,
} from '../../utils/location';
import type { CareRequest } from '../../types';
import {
  CareTypeSection,
  DurationSection,
  JobRequestFeedback,
  PreferencesSection,
  RequiredExperienceSection,
  ScheduleSection,
  ServiceLocationSection,
} from './components/JobRequestFormSections';

interface JobFormData {
  care_type: string;
  duration: string;
  preferences: string;
  required_experiences: string[];
}

interface ValidationErrors {
  care_type?: string;
  countryCode?: string;
  cityOrTown?: string;
  stateOrRegion?: string;
  addressLine?: string;
  postalCode?: string;
  schedule?: string;
  duration?: string;
  required_experiences?: string;
}

interface JobError {
  status: number;
  message: string;
}

const CARE_TYPES = [
  'Elderly Care',
  'Childcare',
  'Post-op Care',
  'Physical Therapy',
  'Companionship',
  'Meal Preparation',
  'Personal Care',
  'Other',
];

const CreateJobRequest: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const isEditMode = Boolean(jobId);
  const [formData, setFormData] = useState<JobFormData>({
    care_type: '',
    duration: '',
    preferences: '',
    required_experiences: [],
  });
  const [locationFields, setLocationFields] = useState<LocationFields>(emptyLocationFields());
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<JobError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [experienceOptions, setExperienceOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchExperienceOptions = async () => {
      try {
        const options = await apiGet<string[]>('/api/experience-options');
        setExperienceOptions(options || []);
      } catch {
        setExperienceOptions([]);
      }
    };

    fetchExperienceOptions();
  }, []);

  useEffect(() => {
    const fetchJobForEdit = async () => {
      if (!isEditMode || !jobId) {
        return;
      }

      try {
        setLoadingJob(true);
        const job = await apiGet<CareRequest>(`/api/jobs/${jobId}`);

        if (job.can_modify === false) {
          setError({
            status: 409,
            message: 'This care request can no longer be edited because it was sent or accepted.',
          });
          return;
        }

        setFormData({
          care_type: job.care_type || '',
          duration: job.duration || '',
          preferences: job.preferences || '',
          required_experiences: job.required_experiences || [],
        });
        setLocationFields(
          job.service_location_details
            ? parseStructuredLocation(job.service_location_details)
            : parseLocationString(job.service_location || '')
        );

        const parsedSchedule = parseAvailabilitySlots(job.schedule || '');
        setAvailabilitySlots(parsedSchedule ?? []);
      } catch (err) {
        const errorStatus = err instanceof Error ? (err as any).status || 500 : 500;
        const errorMsg = err instanceof Error ? err.message : 'Failed to load care request';
        setError({ status: errorStatus, message: errorMsg });
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJobForEdit();
  }, [isEditMode, jobId]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.care_type || formData.care_type.trim().length === 0) {
      newErrors.care_type = 'Care type is required';
    }

    const locationErrors = validateLocationFields(locationFields);
    if (locationErrors.countryCode) newErrors.countryCode = locationErrors.countryCode;
    if (locationErrors.cityOrTown) newErrors.cityOrTown = locationErrors.cityOrTown;
    if (locationErrors.stateOrRegion) newErrors.stateOrRegion = locationErrors.stateOrRegion;
    if (locationErrors.addressLine) newErrors.addressLine = locationErrors.addressLine;
    if (locationErrors.postalCode) newErrors.postalCode = locationErrors.postalCode;

    const availabilityError = validateAvailabilitySlots(availabilitySlots);
    if (availabilityError) {
      newErrors.schedule = availabilityError;
    }

    if (!formData.duration || formData.duration.trim().length === 0) {
      newErrors.duration = 'Duration is required';
    }

    if (formData.required_experiences.length === 0) {
      newErrors.required_experiences = 'Select at least one required experience';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        care_type: formData.care_type,
        service_location: formatLocationString(locationFields),
        service_location_details: toStructuredLocation(locationFields),
        schedule: serializeAvailabilitySlots(availabilitySlots),
        duration: formData.duration,
        preferences: formData.preferences || undefined,
        required_experiences: formData.required_experiences,
      };
      const response =
        isEditMode && jobId
          ? await apiPatch<CareRequest>(`/api/jobs/${jobId}`, payload)
          : await apiPost<CareRequest>('/api/jobs', payload);

      setCreatedJobId(response.id);
      setSuccess(isEditMode ? 'Care request updated successfully!' : 'Care request created successfully!');

      setTimeout(() => {
        navigate('/seeker/my-jobs');
      }, 2000);
    } catch (err) {
      const errorStatus = err instanceof Error ? (err as any).status || 500 : 500;
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError({ status: errorStatus, message: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequiredExperienceToggle = (experience: string) => {
    setFormData((prev) => {
      const isSelected = prev.required_experiences.includes(experience);
      return {
        ...prev,
        required_experiences: isSelected
          ? prev.required_experiences.filter((item) => item !== experience)
          : [...prev.required_experiences, experience],
      };
    });

    if (errors.required_experiences) {
      setErrors((prev) => ({ ...prev, required_experiences: undefined }));
    }
  };

  const handleAvailabilityDayToggle = (day: AvailabilityDay) => {
    setAvailabilitySlots((prev) => {
      const exists = prev.some((slot) => slot.day === day);
      return exists
        ? prev.filter((slot) => slot.day !== day)
        : [...prev, { day, start: '09:00', end: '17:00' }];
    });

    if (errors.schedule) {
      setErrors((prev) => ({ ...prev, schedule: undefined }));
    }
  };

  const handleAvailabilityTimeChange = (
    day: AvailabilityDay,
    field: 'start' | 'end',
    value: string
  ) => {
    setAvailabilitySlots((prev) =>
      prev.map((slot) => (slot.day === day ? { ...slot, [field]: value } : slot))
    );

    if (errors.schedule) {
      setErrors((prev) => ({ ...prev, schedule: undefined }));
    }
  };

  const handleLocationFieldChange = (field: keyof LocationFields, value: string) => {
    setLocationFields((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'countryCode') {
        next.stateOrRegion = '';
      }
      return next;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ProtectedRoute requiredRole="care_seeker">
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1>{isEditMode ? 'Edit Care Request' : 'Create Care Request'}</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          {isEditMode
            ? 'Update the details for your care request'
            : 'Fill in the details about the care you need'}
        </p>

        <JobRequestFeedback
          loadingJob={loadingJob}
          error={error}
          success={success}
          createdJobId={createdJobId}
        />

        <form onSubmit={handleSubmit}>
          <CareTypeSection
            careType={formData.care_type}
            careTypes={CARE_TYPES}
            disabled={submitting}
            errors={errors}
            onChange={handleChange}
          />

          <ServiceLocationSection
            locationFields={locationFields}
            errors={errors}
            disabled={submitting}
            onLocationFieldChange={handleLocationFieldChange}
          />

          <ScheduleSection
            availabilitySlots={availabilitySlots}
            errors={errors}
            disabled={submitting}
            onAvailabilityDayToggle={handleAvailabilityDayToggle}
            onAvailabilityTimeChange={handleAvailabilityTimeChange}
          />

          <RequiredExperienceSection
            experienceOptions={experienceOptions}
            selectedExperiences={formData.required_experiences}
            errors={errors}
            disabled={submitting}
            onToggleExperience={handleRequiredExperienceToggle}
          />

          <DurationSection
            duration={formData.duration}
            disabled={submitting}
            errors={errors}
            onChange={handleChange}
          />

          <PreferencesSection
            preferences={formData.preferences}
            disabled={submitting}
            onChange={handleChange}
          />

          <div style={{ marginTop: '20px' }}>
            <button
              type="submit"
              disabled={submitting || loadingJob || (isEditMode && !!error && error.status === 409)}
              style={{
                padding: '10px 20px',
                backgroundColor: submitting ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                marginRight: '10px',
              }}
            >
              {submitting ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save Changes' : 'Create Care Request'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/seeker/dashboard')}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
};

export default CreateJobRequest;
