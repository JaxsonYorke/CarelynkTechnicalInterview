import React from 'react';
import StructuredAvailabilityFields from '../../../components/forms/StructuredAvailabilityFields';
import type { AvailabilityDay, AvailabilitySlot } from '../../../utils/availability';

interface CaregiverAvailabilityQualificationsSectionProps {
  sectionClassName: string;
  title: string;
  disabled: boolean;
  errors: Record<string, string | undefined>;
  availabilitySlots: AvailabilitySlot[];
  onAvailabilityDayToggle: (day: AvailabilityDay) => void;
  onAvailabilityTimeChange: (
    day: AvailabilityDay,
    field: 'start' | 'end',
    value: string
  ) => void;
  availabilityMode?: 'structured' | 'legacy';
  legacyAvailability?: string;
  onLegacyAvailabilityChange?: (value: string) => void;
  onAvailabilityModeToggle?: () => void;
  qualifications: string;
  onQualificationsChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const CaregiverAvailabilityQualificationsSection: React.FC<
  CaregiverAvailabilityQualificationsSectionProps
> = ({
  sectionClassName,
  title,
  disabled,
  errors,
  availabilitySlots,
  onAvailabilityDayToggle,
  onAvailabilityTimeChange,
  availabilityMode = 'structured',
  legacyAvailability = '',
  onLegacyAvailabilityChange,
  onAvailabilityModeToggle,
  qualifications,
  onQualificationsChange,
}) => (
  <div className={sectionClassName}>
    <h2>{title}</h2>

    <div className="form-group">
      <label>Availability *</label>
      {availabilityMode === 'structured' ? (
        <>
          <p className="availability-help-text">
            Select your available days and working hours.
          </p>
          <div className="availability-grid">
            <StructuredAvailabilityFields
              availabilitySlots={availabilitySlots}
              disabled={disabled}
              onDayToggle={onAvailabilityDayToggle}
              onTimeChange={onAvailabilityTimeChange}
              rowClassName="availability-row"
              dayToggleClassName="availability-day-toggle"
              timeRangeClassName="availability-time-range"
            />
          </div>
        </>
      ) : (
        <>
          <p className="availability-help-text">
            Legacy availability format detected. You can keep it as text or switch to
            structured scheduling.
          </p>
          <input
            type="text"
            value={legacyAvailability}
            onChange={(e) => onLegacyAvailabilityChange?.(e.target.value)}
            disabled={disabled}
          />
        </>
      )}
      {onAvailabilityModeToggle && (
        <button
          type="button"
          className="btn btn-secondary availability-mode-toggle"
          onClick={onAvailabilityModeToggle}
          disabled={disabled}
        >
          {availabilityMode === 'structured'
            ? 'Use Legacy Text Format'
            : 'Use Structured Availability'}
        </button>
      )}
      {errors.availability && <span className="error">{errors.availability}</span>}
    </div>

    <div className="form-group">
      <label htmlFor="qualifications">Qualifications</label>
      <textarea
        id="qualifications"
        name="qualifications"
        value={qualifications}
        onChange={onQualificationsChange}
        placeholder="List any certifications, licenses, or relevant qualifications..."
        rows={4}
        disabled={disabled}
      />
    </div>
  </div>
);

export default CaregiverAvailabilityQualificationsSection;
