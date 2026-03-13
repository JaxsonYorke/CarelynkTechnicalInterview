import React from 'react';
import {
  AVAILABILITY_DAY_OPTIONS,
  type AvailabilityDay,
  type AvailabilitySlot,
} from '../../utils/availability';

interface StructuredAvailabilityFieldsProps {
  availabilitySlots: AvailabilitySlot[];
  disabled: boolean;
  onDayToggle: (day: AvailabilityDay) => void;
  onTimeChange: (
    day: AvailabilityDay,
    field: 'start' | 'end',
    value: string
  ) => void;
  rowClassName?: string;
  rowStyle?: React.CSSProperties;
  dayToggleClassName?: string;
  dayToggleStyle?: React.CSSProperties;
  timeRangeClassName?: string;
  timeRangeStyle?: React.CSSProperties;
  timeInputClassName?: string;
  timeInputStyle?: React.CSSProperties;
}

const StructuredAvailabilityFields: React.FC<StructuredAvailabilityFieldsProps> = ({
  availabilitySlots,
  disabled,
  onDayToggle,
  onTimeChange,
  rowClassName,
  rowStyle,
  dayToggleClassName,
  dayToggleStyle,
  timeRangeClassName,
  timeRangeStyle,
  timeInputClassName,
  timeInputStyle,
}) => (
  <>
    {AVAILABILITY_DAY_OPTIONS.map((day) => {
      const daySlot = availabilitySlots.find((slot) => slot.day === day.key);
      const isSelected = Boolean(daySlot);

      return (
        <div key={day.key} className={rowClassName} style={rowStyle}>
          <label className={dayToggleClassName} style={dayToggleStyle}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onDayToggle(day.key)}
              disabled={disabled}
            />
            <span>{day.label}</span>
          </label>
          <div className={timeRangeClassName} style={timeRangeStyle}>
            <input
              type="time"
              value={daySlot?.start || ''}
              onChange={(e) => onTimeChange(day.key, 'start', e.target.value)}
              disabled={disabled || !isSelected}
              aria-label={`${day.label} start time`}
              className={timeInputClassName}
              style={timeInputStyle}
            />
            <span>to</span>
            <input
              type="time"
              value={daySlot?.end || ''}
              onChange={(e) => onTimeChange(day.key, 'end', e.target.value)}
              disabled={disabled || !isSelected}
              aria-label={`${day.label} end time`}
              className={timeInputClassName}
              style={timeInputStyle}
            />
          </div>
        </div>
      );
    })}
  </>
);

export default StructuredAvailabilityFields;
