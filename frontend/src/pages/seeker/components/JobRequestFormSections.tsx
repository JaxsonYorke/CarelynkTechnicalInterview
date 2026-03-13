import React from 'react';
import StructuredLocationFields from '../../../components/forms/StructuredLocationFields';
import StructuredAvailabilityFields from '../../../components/forms/StructuredAvailabilityFields';
import ExperienceOptionsField from '../../../components/forms/ExperienceOptionsField';
import type { AvailabilityDay, AvailabilitySlot } from '../../../utils/availability';
import type { LocationFields } from '../../../utils/location';

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

export const JobRequestFeedback: React.FC<{
  loadingJob: boolean;
  error: JobError | null;
  success: string | null;
  createdJobId: string | null;
}> = ({ loadingJob, error, success, createdJobId }) => (
  <>
    {loadingJob && <div style={{ marginBottom: '15px', color: '#666' }}>Loading care request...</div>}

    {error && (
      <div
        style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33',
        }}
      >
        {error.message}
      </div>
    )}

    {success && (
      <div
        style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '4px',
          color: '#3c3',
        }}
      >
        {success}
        {createdJobId && <p style={{ marginTop: '10px', fontSize: '12px' }}>Job ID: {createdJobId}</p>}
      </div>
    )}
  </>
);

export const CareTypeSection: React.FC<{
  careType: string;
  careTypes: string[];
  disabled: boolean;
  errors: ValidationErrors;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}> = ({ careType, careTypes, disabled, errors, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
      Type of Care Needed *
    </label>
    <select
      name="care_type"
      value={careType}
      onChange={onChange}
      style={{
        width: '100%',
        padding: '8px',
        border: errors.care_type ? '2px solid #c33' : '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box',
      }}
      disabled={disabled}
    >
      <option value="">-- Select a care type --</option>
      {careTypes.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
    {errors.care_type && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.care_type}</span>}
  </div>
);

export const ServiceLocationSection: React.FC<{
  locationFields: LocationFields;
  errors: ValidationErrors;
  disabled: boolean;
  onLocationFieldChange: (field: keyof LocationFields, value: string) => void;
}> = ({ locationFields, errors, disabled, onLocationFieldChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Location *</label>
    <StructuredLocationFields
      locationFields={locationFields}
      errors={errors}
      disabled={disabled}
      onFieldChange={onLocationFieldChange}
      showFieldLabels
      fieldOrder={['countryCode', 'stateOrRegion', 'cityOrTown', 'addressLine', 'postalCode']}
      labels={{
        countryCode: 'Country *',
        stateOrRegion: 'State / Region *',
        cityOrTown: 'City / Town *',
        addressLine: 'Address Line (optional)',
        postalCode: 'Postal Code (optional)',
      }}
      labelStyle={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}
      statePlaceholderOption="-- Select state/province --"
      placeholders={{
        addressLine: 'Address Line (optional)',
        postalCode: 'Postal Code (optional)',
      }}
      fieldsContainerStyle={{ display: 'grid', gap: '10px' }}
      selectStyle={(_, hasError) => ({
        width: '100%',
        padding: '8px',
        border: hasError ? '2px solid #c33' : '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box',
      })}
      inputStyle={(_, hasError) => ({
        width: '100%',
        padding: '8px',
        border: hasError ? '2px solid #c33' : '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box',
      })}
      errorStyle={{ color: '#c33', fontSize: '12px' }}
    />
  </div>
);

export const ScheduleSection: React.FC<{
  availabilitySlots: AvailabilitySlot[];
  errors: ValidationErrors;
  disabled: boolean;
  onAvailabilityDayToggle: (day: AvailabilityDay) => void;
  onAvailabilityTimeChange: (day: AvailabilityDay, field: 'start' | 'end', value: string) => void;
}> = ({
  availabilitySlots,
  errors,
  disabled,
  onAvailabilityDayToggle,
  onAvailabilityTimeChange,
}) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Schedule *</label>
    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px' }}>
      Select required days and hours for this care request.
    </p>
    <div style={{ border: errors.schedule ? '2px solid #c33' : '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
      <StructuredAvailabilityFields
        availabilitySlots={availabilitySlots}
        disabled={disabled}
        onDayToggle={onAvailabilityDayToggle}
        onTimeChange={onAvailabilityTimeChange}
        rowStyle={{
          display: 'grid',
          gridTemplateColumns: 'minmax(130px, 1fr) minmax(220px, 2fr)',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px',
        }}
        dayToggleStyle={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        timeRangeStyle={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        timeInputStyle={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
    </div>
    {errors.schedule && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.schedule}</span>}
  </div>
);

export const RequiredExperienceSection: React.FC<{
  experienceOptions: string[];
  selectedExperiences: string[];
  errors: ValidationErrors;
  disabled: boolean;
  onToggleExperience: (experience: string) => void;
}> = ({
  experienceOptions,
  selectedExperiences,
  errors,
  disabled,
  onToggleExperience,
}) => (
  <div style={{ marginBottom: '15px' }}>
    <ExperienceOptionsField
      label="Required Caregiver Experience *"
      helpText="Select the experience areas required for this care request."
      options={experienceOptions}
      selectedOptions={selectedExperiences}
      onToggleOption={onToggleExperience}
      disabled={disabled}
      error={errors.required_experiences}
      gridStyle={{
        display: 'grid',
        gap: '8px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      }}
      optionStyle={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: '#fff',
      }}
      textStyle={{ fontSize: '14px' }}
      helpTextStyle={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px' }}
      emptyMessage="No shared experience options are available yet."
      emptyMessageStyle={{ margin: '10px 0 0 0', color: '#666', fontSize: '13px' }}
      errorStyle={{ color: '#c33', fontSize: '12px' }}
    />
  </div>
);

export const DurationSection: React.FC<{
  duration: string;
  disabled: boolean;
  errors: ValidationErrors;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}> = ({ duration, disabled, errors, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Duration *</label>
    <input
      type="text"
      name="duration"
      value={duration}
      onChange={onChange}
      placeholder="e.g., 3 months, ongoing, 2 weeks"
      style={{
        width: '100%',
        padding: '8px',
        border: errors.duration ? '2px solid #c33' : '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box',
      }}
      disabled={disabled}
    />
    {errors.duration && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.duration}</span>}
  </div>
);

export const PreferencesSection: React.FC<{
  preferences: string;
  disabled: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}> = ({ preferences, disabled, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
      Special Requirements / Notes (Optional)
    </label>
    <textarea
      name="preferences"
      value={preferences}
      onChange={onChange}
      placeholder="Any special requirements, allergies, dietary restrictions, or preferences..."
      rows={4}
      style={{
        width: '100%',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box',
      }}
      disabled={disabled}
    />
  </div>
);
