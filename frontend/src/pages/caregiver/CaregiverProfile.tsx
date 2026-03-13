import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPut } from '../../services/api';
import { validateName, validateContactInfo } from '../../utils/validators';
import {
  formatAvailabilitySummary,
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
import { CAREGIVER_PROFILE } from '../../utils/constants';
import type { CaregiverProfile as CaregiverProfileType } from '../../types';
import CaregiverPersonalInfoSection from './components/CaregiverPersonalInfoSection';
import CaregiverSkillsExperienceSection from './components/CaregiverSkillsExperienceSection';
import CaregiverAvailabilityQualificationsSection from './components/CaregiverAvailabilityQualificationsSection';
import { SKILLS_OPTIONS } from './components/caregiverFormConstants';
import './CaregiverProfile.css';

interface FormErrors {
  [key: string]: string;
}

interface ProfileState {
  profile: CaregiverProfileType | null;
  loading: boolean;
  error: { status: number; message: string } | null;
}

const CaregiverProfile: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: true,
    error: null,
  });
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<CaregiverProfileType>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availabilityMode, setAvailabilityMode] = useState<'structured' | 'legacy'>(
    'structured'
  );
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [legacyAvailability, setLegacyAvailability] = useState('');
  const [locationFields, setLocationFields] = useState<LocationFields>(emptyLocationFields());
  const [experienceOptions, setExperienceOptions] = useState<string[]>([]);
  const [newExperienceOption, setNewExperienceOption] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await apiGet<CaregiverProfileType>(CAREGIVER_PROFILE);
      setState({ profile, loading: false, error: null });
    } catch (error) {
      const errorStatus = error instanceof Error ? (error as any).status || 500 : 500;
      const errorMsg = error instanceof Error ? error.message : 'Failed to load profile';

      if (errorStatus === 404) {
        navigate('/caregiver/onboarding');
      } else {
        setState({
          profile: null,
          loading: false,
          error: { status: errorStatus, message: errorMsg },
        });
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const handleEditClick = () => {
    if (state.profile) {
      setEditData(state.profile);
      setLocationFields(
        state.profile.location_details
          ? parseStructuredLocation(state.profile.location_details)
          : parseLocationString(state.profile.location || '')
      );
      const parsedAvailability = parseAvailabilitySlots(state.profile.availability);
      if (parsedAvailability === null) {
        setAvailabilityMode('legacy');
        setLegacyAvailability(state.profile.availability || '');
        setAvailabilitySlots([]);
      } else {
        setAvailabilityMode('structured');
        setAvailabilitySlots(parsedAvailability);
        setLegacyAvailability('');
      }
      setEditMode(true);
      setErrors({});
      setSaveError(null);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData({});
    setErrors({});
    setSaveError(null);
    setAvailabilityMode('structured');
    setAvailabilitySlots([]);
    setLegacyAvailability('');
    setLocationFields(emptyLocationFields());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvailabilityDayToggle = (day: AvailabilityDay) => {
    setAvailabilitySlots((prev) => {
      const exists = prev.some((slot) => slot.day === day);
      return exists
        ? prev.filter((slot) => slot.day !== day)
        : [...prev, { day, start: '09:00', end: '17:00' }];
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
    setAvailabilitySlots((prev) =>
      prev.map((slot) => (slot.day === day ? { ...slot, [field]: value } : slot))
    );

    if (errors.availability) {
      setErrors((prev) => ({ ...prev, availability: '' }));
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
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSkillChange = (skill: string) => {
    setEditData((prev) => {
      const updatedSkills = prev.skills || [];
      const newSkills = updatedSkills.includes(skill)
        ? updatedSkills.filter((s) => s !== skill)
        : [...updatedSkills, skill];
      return { ...prev, skills: newSkills };
    });
    if (errors.skills) {
      setErrors((prev) => ({ ...prev, skills: '' }));
    }
  };

  const handleExperienceTagToggle = (tag: string) => {
    setEditData((prev) => {
      const currentTags = prev.experience_tags || [];
      const isSelected = currentTags.includes(tag);
      return {
        ...prev,
        experience_tags: isSelected
          ? currentTags.filter((item) => item !== tag)
          : [...currentTags, tag],
      };
    });
    if (errors.experience_tags) {
      setErrors((prev) => ({ ...prev, experience_tags: '' }));
    }
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
      setEditData((prev) => {
        const currentTags = prev.experience_tags || [];
        return {
          ...prev,
          experience_tags: currentTags.includes(createdLabel)
            ? currentTags
            : [...currentTags, createdLabel],
        };
      });
      setNewExperienceOption('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to add experience option');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const nameError = validateName(editData.name || '');
    if (nameError) newErrors.name = nameError;

    const contactError = validateContactInfo(editData.contact_info || '');
    if (contactError) newErrors.contact_info = contactError;

    const locationFieldErrors = validateLocationFields(locationFields);
    if (locationFieldErrors.countryCode) newErrors.countryCode = locationFieldErrors.countryCode;
    if (locationFieldErrors.cityOrTown) newErrors.cityOrTown = locationFieldErrors.cityOrTown;
    if (locationFieldErrors.stateOrRegion) newErrors.stateOrRegion = locationFieldErrors.stateOrRegion;
    if (locationFieldErrors.postalCode) newErrors.postalCode = locationFieldErrors.postalCode;

    if (!editData.skills || editData.skills.length === 0) {
      newErrors.skills = 'Please select at least one skill';
    }
    if (!editData.experience_tags || editData.experience_tags.length === 0) {
      newErrors.experience_tags = 'Please select at least one experience area';
    }

    if (availabilityMode === 'structured') {
      const availabilityError = validateAvailabilitySlots(availabilitySlots);
      if (availabilityError) newErrors.availability = availabilityError;
    } else if (legacyAvailability.trim().length === 0) {
      newErrors.availability = 'Availability is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: Partial<CaregiverProfileType> = {
        ...editData,
        location: formatLocationString(locationFields),
        location_details: toStructuredLocation(locationFields),
        availability:
          availabilityMode === 'structured'
            ? serializeAvailabilitySlots(availabilitySlots)
            : legacyAvailability.trim(),
      };

      const updatedProfile = await apiPut<CaregiverProfileType>(CAREGIVER_PROFILE, payload);
      setState({ profile: updatedProfile, loading: false, error: null });
      setSaveSuccess(true);
      setEditMode(false);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (state.loading) {
    return (
      <div className="caregiver-profile loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (state.error && !state.profile) {
    return (
      <div className="caregiver-profile error">
        <div className="error-container">
          <h2>Error</h2>
          <p>{state.error.message}</p>
          <button className="btn btn-primary" onClick={() => navigate('/caregiver/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!state.profile) {
    return (
      <div className="caregiver-profile">
        <div className="profile-container">
          <p className="no-profile">No profile found</p>
          <button className="btn btn-primary" onClick={() => navigate('/caregiver/onboarding')}>
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="caregiver-profile">
      <div className="profile-container">
        <header className="profile-header">
          <h1>My Profile</h1>
          {!editMode && (
            <button className="btn btn-primary" onClick={handleEditClick}>
              Edit Profile
            </button>
          )}
        </header>

        {saveSuccess && (
          <div className="success-banner">
            <p>Profile updated successfully! ✓</p>
          </div>
        )}

        {saveError && (
          <div className="error-banner">
            <p>{saveError}</p>
          </div>
        )}

        {editMode ? (
          <form onSubmit={handleSave} className="edit-form">
            <CaregiverPersonalInfoSection
              sectionClassName="form-section"
              title="Personal Information"
              name={editData.name || ''}
              contactInfo={editData.contact_info || ''}
              disabled={saving}
              errors={errors}
              onInputChange={handleInputChange}
              locationFields={locationFields}
              onLocationFieldChange={handleLocationFieldChange}
              locationFieldProps={{
                showFieldLabels: true,
                labels: {
                  countryCode: 'Country *',
                  cityOrTown: 'City / Town *',
                  stateOrRegion: 'State / Region *',
                  addressLine: 'Address Line',
                  postalCode: 'Postal Code',
                },
                ids: {
                  countryCode: 'countryCode',
                  cityOrTown: 'cityOrTown',
                  stateOrRegion: 'stateOrRegion',
                  addressLine: 'addressLine',
                  postalCode: 'postalCode',
                },
                fieldsContainerClassName: 'location-fields-grid',
                fieldWrapperClassName: 'location-field',
                errorClassName: 'error',
              }}
            />

            <CaregiverSkillsExperienceSection
              sectionClassName="form-section"
              title="Skills & Experience"
              disabled={saving}
              errors={errors}
              skillsOptions={SKILLS_OPTIONS}
              selectedSkills={editData.skills || []}
              onSkillToggle={handleSkillChange}
              experienceOptions={experienceOptions}
              selectedExperienceTags={editData.experience_tags || []}
              onExperienceTagToggle={handleExperienceTagToggle}
              newExperienceOption={newExperienceOption}
              onNewExperienceOptionChange={setNewExperienceOption}
              onAddExperienceOption={handleAddExperienceOption}
              experienceDescription={editData.experience || ''}
              onExperienceDescriptionChange={handleInputChange}
            />

            <CaregiverAvailabilityQualificationsSection
              sectionClassName="form-section"
              title="Availability & Qualifications"
              disabled={saving}
              errors={errors}
              availabilitySlots={availabilitySlots}
              onAvailabilityDayToggle={handleAvailabilityDayToggle}
              onAvailabilityTimeChange={handleAvailabilityTimeChange}
              availabilityMode={availabilityMode}
              legacyAvailability={legacyAvailability}
              onLegacyAvailabilityChange={(value) => {
                setLegacyAvailability(value);
                if (errors.availability) {
                  setErrors((prev) => ({ ...prev, availability: '' }));
                }
              }}
              onAvailabilityModeToggle={() => {
                if (availabilityMode === 'structured') {
                  setAvailabilityMode('legacy');
                  setLegacyAvailability(editData.availability || '');
                } else {
                  setAvailabilityMode('structured');
                  setAvailabilitySlots([]);
                  setLegacyAvailability('');
                }
                if (errors.availability) {
                  setErrors((prev) => ({ ...prev, availability: '' }));
                }
              }}
              qualifications={editData.qualifications || ''}
              onQualificationsChange={handleInputChange}
            />

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-display">
            <div className="profile-section">
              <h2>Personal Information</h2>
              <div className="profile-field">
                <label>Full Name</label>
                <p>{state.profile.name || 'Not provided'}</p>
              </div>
              <div className="profile-field">
                <label>Contact Information</label>
                <p>{state.profile.contact_info || 'Not provided'}</p>
              </div>
              <div className="profile-field">
                <label>Location</label>
                <p>{state.profile.location || 'Not provided'}</p>
              </div>
            </div>

            <div className="profile-section">
              <h2>Skills & Experience</h2>
              <div className="profile-field">
                <label>Skills</label>
                <div className="skills-display">
                  {state.profile.skills && state.profile.skills.length > 0 ? (
                    state.profile.skills.map((skill) => (
                      <span key={skill} className="skill-badge">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p>No skills listed</p>
                  )}
                </div>
              </div>
              <div className="profile-field">
                <label>Experience Areas</label>
                <div className="skills-display">
                  {state.profile.experience_tags && state.profile.experience_tags.length > 0 ? (
                    state.profile.experience_tags.map((tag) => (
                      <span key={tag} className="skill-badge">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p>No experience areas selected</p>
                  )}
                </div>
              </div>
              {state.profile.experience && (
                <div className="profile-field">
                  <label>Experience</label>
                  <p>{state.profile.experience}</p>
                </div>
              )}
            </div>

            <div className="profile-section">
              <h2>Availability & Qualifications</h2>
              <div className="profile-field">
                <label>Availability</label>
                <p>{formatAvailabilitySummary(state.profile.availability || '')}</p>
              </div>
              {state.profile.qualifications && (
                <div className="profile-field">
                  <label>Qualifications</label>
                  <p>{state.profile.qualifications}</p>
                </div>
              )}
            </div>

            <div className="profile-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/caregiver/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaregiverProfile;
