import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';
import { validateName, validateContactInfo, validateLocation } from '../../utils/validators';
import {
  emptyLocationFields,
  formatLocationString,
  toStructuredLocation,
  validateLocationFields,
  type LocationFields,
} from '../../utils/location';
import {
  serializeAvailabilitySlots,
  validateAvailabilitySlots,
  type AvailabilityDay,
  type AvailabilitySlot,
} from '../../utils/availability';
import { CAREGIVER_PROFILE } from '../../utils/constants';
import type { CaregiverProfile } from '../../types';
import CaregiverPersonalInfoSection from './components/CaregiverPersonalInfoSection';
import CaregiverSkillsExperienceSection from './components/CaregiverSkillsExperienceSection';
import CaregiverAvailabilityQualificationsSection from './components/CaregiverAvailabilityQualificationsSection';
import { SKILLS_OPTIONS } from './components/caregiverFormConstants';
import './CaregiverOnboarding.css';

interface FormErrors {
  [key: string]: string;
}

interface OnboardingFormData {
  name: string;
  contact_info: string;
  location: string;
  skills: string[];
  experience_tags: string[];
  experience: string;
  availability_slots: AvailabilitySlot[];
  qualifications: string;
}

const CaregiverOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    contact_info: '',
    location: '',
    skills: [],
    experience_tags: [],
    experience: '',
    availability_slots: [],
    qualifications: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [locationFields, setLocationFields] = useState<LocationFields>(emptyLocationFields());
  const [experienceOptions, setExperienceOptions] = useState<string[]>([]);
  const [newExperienceOption, setNewExperienceOption] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
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
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSkillChange = (skill: string) => {
    setFormData((prev) => {
      const updatedSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills: updatedSkills };
    });
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: '' }));
    }
  };

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

  const handleExperienceTagToggle = (tag: string) => {
    setFormData((prev) => {
      const isSelected = prev.experience_tags.includes(tag);
      return {
        ...prev,
        experience_tags: isSelected
          ? prev.experience_tags.filter((item) => item !== tag)
          : [...prev.experience_tags, tag],
      };
    });
  };

  const handleAddExperienceOption = async () => {
    const label = newExperienceOption.trim();
    if (!label) {
      return;
    }

    try {
      const createdLabel = await apiPost<string>('/api/experience-options', { label });
      setExperienceOptions((prev) =>
        prev.includes(createdLabel) ? prev : [...prev, createdLabel].sort()
      );
      setFormData((prev) => ({
        ...prev,
        experience_tags: prev.experience_tags.includes(createdLabel)
          ? prev.experience_tags
          : [...prev.experience_tags, createdLabel],
      }));
      setNewExperienceOption('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add experience option');
    }
  };

  const handleAvailabilityDayToggle = (day: AvailabilityDay) => {
    setFormData((prev) => {
      const exists = prev.availability_slots.some((slot) => slot.day === day);
      const updatedSlots = exists
        ? prev.availability_slots.filter((slot) => slot.day !== day)
        : [...prev.availability_slots, { day, start: '09:00', end: '17:00' }];

      return { ...prev, availability_slots: updatedSlots };
    });

    if (errors.availability) {
      setErrors((prev) => ({ ...prev, availability: '' }));
    }
  };

  const handleAvailabilityTimeChange = (
    day: AvailabilityDay,
    field: 'start' | 'end',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      availability_slots: prev.availability_slots.map((slot) =>
        slot.day === day ? { ...slot, [field]: value } : slot
      ),
    }));

    if (errors.availability) {
      setErrors((prev) => ({ ...prev, availability: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      const nameError = validateName(formData.name);
      if (nameError) newErrors.name = nameError;

      const contactError = validateContactInfo(formData.contact_info);
      if (contactError) newErrors.contact_info = contactError;

      const locationFieldErrors = validateLocationFields(locationFields);
      if (locationFieldErrors.countryCode) newErrors.countryCode = locationFieldErrors.countryCode;
      if (locationFieldErrors.cityOrTown) newErrors.cityOrTown = locationFieldErrors.cityOrTown;
      if (locationFieldErrors.stateOrRegion) newErrors.stateOrRegion = locationFieldErrors.stateOrRegion;
      if (locationFieldErrors.postalCode) newErrors.postalCode = locationFieldErrors.postalCode;

      const normalizedLocation = formatLocationString(locationFields);
      const locationError = validateLocation(normalizedLocation);
      if (locationError) {
        newErrors.cityOrTown = locationError;
      }
    }

    if (step === 2) {
      if (formData.skills.length === 0) {
        newErrors.skills = 'Please select at least one skill';
      }
      if (formData.experience_tags.length === 0) {
        newErrors.experience_tags = 'Please select at least one experience area';
      }
    }

    if (step === 3) {
      const availabilityError = validateAvailabilitySlots(formData.availability_slots);
      if (availabilityError) newErrors.availability = availabilityError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      setSubmitError(null);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const profileData: Partial<CaregiverProfile> = {
        name: formData.name,
        contact_info: formData.contact_info,
        location: formatLocationString(locationFields),
        location_details: toStructuredLocation(locationFields),
        skills: formData.skills,
        experience_tags: formData.experience_tags,
        experience: formData.experience || undefined,
        availability: serializeAvailabilitySlots(formData.availability_slots),
        qualifications: formData.qualifications || undefined,
      };

      await apiPost(CAREGIVER_PROFILE, profileData);
      setSubmitSuccess(true);

      setTimeout(() => {
        navigate('/caregiver/profile');
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="caregiver-onboarding success">
        <div className="success-message">
          <h2>Profile Created Successfully! ✓</h2>
          <p>Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="caregiver-onboarding">
      <div className="onboarding-container">
        <header className="onboarding-header">
          <h1>Caregiver Onboarding</h1>
          <p>Step {currentStep} of 3</p>
        </header>

        <div className="progress-indicator">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`progress-step ${step === currentStep ? 'active' : ''} ${
                step < currentStep ? 'completed' : ''
              }`}
            >
              {step}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          {submitError && (
            <div className="error-banner">
              <p>{submitError}</p>
            </div>
          )}

          {currentStep === 1 && (
            <CaregiverPersonalInfoSection
              sectionClassName="form-step"
              title="Personal Information"
              name={formData.name}
              contactInfo={formData.contact_info}
              disabled={loading}
              errors={errors}
              onInputChange={handleInputChange}
              locationFields={locationFields}
              onLocationFieldChange={handleLocationFieldChange}
              namePlaceholder="Enter your full name"
              contactInfoPlaceholder="Email or phone number"
              locationFieldProps={{
                statePlaceholderOption: 'State / Province',
                placeholders: {
                  cityOrTown: 'City or Town',
                  addressLine: 'Address Line (optional)',
                  postalCode: 'Postal Code (optional)',
                },
                fieldsContainerClassName: 'location-fields',
                fieldsContainerStyle: {
                  display: 'grid',
                  gap: '10px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                },
                selectStyle: (_, hasError) => ({
                  width: '100%',
                  padding: '8px',
                  border: hasError ? '2px solid #c33' : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }),
                inputStyle: (_, hasError) => ({
                  width: '100%',
                  padding: '8px',
                  border: hasError ? '2px solid #c33' : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }),
                errorClassName: 'error',
                errorStyle: {
                  color: '#c33',
                  fontSize: '12px',
                  display: 'block',
                  marginTop: '4px',
                },
              }}
            />
          )}

          {currentStep === 2 && (
            <CaregiverSkillsExperienceSection
              sectionClassName="form-step"
              title="Skills & Experience"
              disabled={loading}
              errors={errors}
              skillsOptions={SKILLS_OPTIONS}
              selectedSkills={formData.skills}
              onSkillToggle={handleSkillChange}
              experienceOptions={experienceOptions}
              selectedExperienceTags={formData.experience_tags}
              onExperienceTagToggle={handleExperienceTagToggle}
              newExperienceOption={newExperienceOption}
              onNewExperienceOptionChange={setNewExperienceOption}
              onAddExperienceOption={handleAddExperienceOption}
              experienceDescription={formData.experience}
              onExperienceDescriptionChange={handleInputChange}
            />
          )}

          {currentStep === 3 && (
            <CaregiverAvailabilityQualificationsSection
              sectionClassName="form-step"
              title="Availability & Qualifications"
              disabled={loading}
              errors={errors}
              availabilitySlots={formData.availability_slots}
              onAvailabilityDayToggle={handleAvailabilityDayToggle}
              onAvailabilityTimeChange={handleAvailabilityTimeChange}
              qualifications={formData.qualifications}
              onQualificationsChange={handleInputChange}
            />
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrev}
                disabled={loading}
              >
                Previous
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/caregiver/dashboard')}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default CaregiverOnboarding;
