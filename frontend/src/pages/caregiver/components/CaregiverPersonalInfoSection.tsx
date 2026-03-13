import React from 'react';
import StructuredLocationFields from '../../../components/forms/StructuredLocationFields';
import type { LocationFields } from '../../../utils/location';

interface CaregiverPersonalInfoSectionProps {
  sectionClassName: string;
  title: string;
  name: string;
  contactInfo: string;
  disabled: boolean;
  errors: Record<string, string | undefined>;
  onInputChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  locationFields: LocationFields;
  onLocationFieldChange: (field: keyof LocationFields, value: string) => void;
  namePlaceholder?: string;
  contactInfoPlaceholder?: string;
  locationFieldProps?: Omit<
    React.ComponentProps<typeof StructuredLocationFields>,
    'locationFields' | 'errors' | 'disabled' | 'onFieldChange'
  >;
}

const CaregiverPersonalInfoSection: React.FC<CaregiverPersonalInfoSectionProps> = ({
  sectionClassName,
  title,
  name,
  contactInfo,
  disabled,
  errors,
  onInputChange,
  locationFields,
  onLocationFieldChange,
  namePlaceholder,
  contactInfoPlaceholder,
  locationFieldProps,
}) => (
  <div className={sectionClassName}>
    <h2>{title}</h2>

    <div className="form-group">
      <label htmlFor="name">Full Name *</label>
      <input
        type="text"
        id="name"
        name="name"
        value={name}
        onChange={onInputChange}
        placeholder={namePlaceholder}
        disabled={disabled}
      />
      {errors.name && <span className="error">{errors.name}</span>}
    </div>

    <div className="form-group">
      <label htmlFor="contact_info">Contact Information *</label>
      <input
        type="text"
        id="contact_info"
        name="contact_info"
        value={contactInfo}
        onChange={onInputChange}
        placeholder={contactInfoPlaceholder}
        disabled={disabled}
      />
      {errors.contact_info && <span className="error">{errors.contact_info}</span>}
    </div>

    <div className="form-group">
      <label>Location *</label>
      <StructuredLocationFields
        locationFields={locationFields}
        errors={errors}
        disabled={disabled}
        onFieldChange={onLocationFieldChange}
        {...locationFieldProps}
      />
    </div>
  </div>
);

export default CaregiverPersonalInfoSection;
