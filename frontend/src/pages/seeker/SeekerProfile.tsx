/**
 * Care Seeker Profile Page - Create/Edit profile
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { apiPost, apiGet, apiPut } from '../../services/api';
import { validateName, validateContactInfo, validateLocation } from '../../utils/validators';
import {
  emptyLocationFields,
  formatLocationString,
  parseLocationString,
  validateLocationFields,
  type LocationFields,
} from '../../utils/location';
import type { CareSeekerProfile } from '../../types';

interface ProfileFormData {
  name: string;
  contact_info: string;
  location: string;
}

interface ValidationErrors {
  name?: string;
  contact_info?: string;
  countryCode?: string;
  cityOrTown?: string;
  stateOrRegion?: string;
  addressLine?: string;
  postalCode?: string;
}

interface ProfileError {
  status: number;
  message: string;
}

const SeekerProfile: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    contact_info: '',
    location: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ProfileError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [existingProfile, setExistingProfile] = useState<CareSeekerProfile | null>(null);
  const [locationFields, setLocationFields] = useState<LocationFields>(emptyLocationFields());

  // Fetch existing profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await apiGet<CareSeekerProfile>('/api/seekers/profile');
        setExistingProfile(profile);
        setFormData({
          name: profile.name,
          contact_info: profile.contact_info,
          location: profile.location,
        });
        setLocationFields(parseLocationString(profile.location));
        setIsEditing(true);
      } catch (err) {
        // Profile doesn't exist yet, show create form
        setIsEditing(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const contactError = validateContactInfo(formData.contact_info);
    if (contactError) newErrors.contact_info = contactError;

    const locationFieldErrors = validateLocationFields(locationFields);
    if (locationFieldErrors.cityOrTown) {
      newErrors.cityOrTown = locationFieldErrors.cityOrTown;
    }
    if (locationFieldErrors.stateOrRegion) {
      newErrors.stateOrRegion = locationFieldErrors.stateOrRegion;
    }
    if (locationFieldErrors.postalCode) {
      newErrors.postalCode = locationFieldErrors.postalCode;
    }

    const normalizedLocation = formatLocationString(locationFields);
    const locationError = validateLocation(normalizedLocation);
    if (locationError) {
      newErrors.cityOrTown = locationError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLocationFieldChange = (
    field: keyof LocationFields,
    value: string
  ) => {
    setLocationFields((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
      const payload: ProfileFormData = {
        ...formData,
        location: formatLocationString(locationFields),
      };

      if (isEditing && existingProfile) {
        // Update existing profile
        await apiPut<CareSeekerProfile>('/api/seekers/profile', payload);
        setSuccess('Profile updated successfully!');
      } else {
        // Create new profile
        await apiPost<CareSeekerProfile>('/api/seekers/profile', payload);
        setSuccess('Profile created successfully!');
      }

      // Redirect to dashboard after success
      setTimeout(() => {
        navigate('/seeker/dashboard');
      }, 1500);
    } catch (err) {
      const errorStatus = err instanceof Error ? (err as any).status || 500 : 500;
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError({ status: errorStatus, message: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="care_seeker">
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading profile...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="care_seeker">
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <h1>{isEditing ? 'Edit Your Profile' : 'Create Your Profile'}</h1>

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

        {success && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px',
            color: '#3c3',
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '8px',
                border: errors.name ? '2px solid #c33' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              disabled={submitting}
            />
            {errors.name && (
              <span style={{ color: '#c33', fontSize: '12px' }}>{errors.name}</span>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Contact Info (Email or Phone) *
            </label>
            <input
              type="text"
              name="contact_info"
              value={formData.contact_info}
              onChange={handleChange}
              placeholder="john@example.com or 555-123-4567"
              style={{
                width: '100%',
                padding: '8px',
                border: errors.contact_info ? '2px solid #c33' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              disabled={submitting}
            />
            {errors.contact_info && (
              <span style={{ color: '#c33', fontSize: '12px' }}>{errors.contact_info}</span>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Location *
            </label>
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              <div>
                <input
                  type="text"
                  value={locationFields.cityOrTown}
                  onChange={(e) => handleLocationFieldChange('cityOrTown', e.target.value)}
                  placeholder="City or Town"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: errors.cityOrTown ? '2px solid #c33' : '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  disabled={submitting}
                />
                {errors.cityOrTown && (
                  <span style={{ color: '#c33', fontSize: '12px' }}>{errors.cityOrTown}</span>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={locationFields.stateOrRegion}
                  onChange={(e) => handleLocationFieldChange('stateOrRegion', e.target.value)}
                  placeholder="State or Region"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: errors.stateOrRegion ? '2px solid #c33' : '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  disabled={submitting}
                />
                {errors.stateOrRegion && (
                  <span style={{ color: '#c33', fontSize: '12px' }}>{errors.stateOrRegion}</span>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={locationFields.postalCode}
                  onChange={(e) => handleLocationFieldChange('postalCode', e.target.value)}
                  placeholder="Postal Code (optional)"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: errors.postalCode ? '2px solid #c33' : '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                  disabled={submitting}
                />
                {errors.postalCode && (
                  <span style={{ color: '#c33', fontSize: '12px' }}>{errors.postalCode}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                backgroundColor: submitting ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                marginRight: '10px',
              }}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}
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

export default SeekerProfile;
