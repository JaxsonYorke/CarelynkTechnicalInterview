import React from 'react';

interface ExperienceOptionsFieldProps {
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  label: string;
  helpText?: React.ReactNode;
  options: string[];
  selectedOptions: string[];
  onToggleOption: (option: string) => void;
  disabled: boolean;
  error?: string;
  gridClassName?: string;
  gridStyle?: React.CSSProperties;
  optionClassName?: string;
  optionStyle?: React.CSSProperties;
  textClassName?: string;
  textStyle?: React.CSSProperties;
  helpTextClassName?: string;
  helpTextStyle?: React.CSSProperties;
  errorClassName?: string;
  errorStyle?: React.CSSProperties;
  emptyMessage?: string;
  emptyMessageClassName?: string;
  emptyMessageStyle?: React.CSSProperties;
  addValue?: string;
  onAddValueChange?: (value: string) => void;
  onAddOption?: () => void;
  addPlaceholder?: string;
  addButtonLabel?: string;
  addDisabled?: boolean;
  addContainerClassName?: string;
  addContainerStyle?: React.CSSProperties;
  addInputClassName?: string;
  addInputStyle?: React.CSSProperties;
  addButtonClassName?: string;
  addButtonStyle?: React.CSSProperties;
}

const ExperienceOptionsField: React.FC<ExperienceOptionsFieldProps> = ({
  label,
  helpText,
  options,
  selectedOptions,
  onToggleOption,
  disabled,
  error,
  gridClassName,
  gridStyle,
  optionClassName,
  optionStyle,
  textClassName,
  textStyle,
  helpTextClassName,
  helpTextStyle,
  errorClassName,
  errorStyle,
  emptyMessage,
  emptyMessageClassName,
  emptyMessageStyle,
  addValue,
  onAddValueChange,
  onAddOption,
  addPlaceholder = 'Add a new experience option',
  addButtonLabel = 'Add',
  addDisabled,
  addContainerClassName,
  addContainerStyle,
  addInputClassName,
  addInputStyle,
  addButtonClassName,
  addButtonStyle,
  containerClassName,
  containerStyle,
}) => {
  const hasAddControls =
    typeof addValue === 'string' && onAddValueChange && onAddOption;

  return (
    <div className={containerClassName} style={containerStyle}>
      <label>{label}</label>
      {helpText && (
        <p className={helpTextClassName} style={helpTextStyle}>
          {helpText}
        </p>
      )}
      <div className={gridClassName} style={gridStyle}>
        {options.map((option) => (
          <label key={option} className={optionClassName} style={optionStyle}>
            <input
              type="checkbox"
              checked={selectedOptions.includes(option)}
              onChange={() => onToggleOption(option)}
              disabled={disabled}
            />
            <span className={textClassName} style={textStyle}>
              {option}
            </span>
          </label>
        ))}
      </div>
      {options.length === 0 && emptyMessage && (
        <p className={emptyMessageClassName} style={emptyMessageStyle}>
          {emptyMessage}
        </p>
      )}
      {hasAddControls && (
        <div className={addContainerClassName} style={addContainerStyle}>
          <input
            type="text"
            className={addInputClassName}
            style={addInputStyle}
            value={addValue}
            onChange={(e) => onAddValueChange(e.target.value)}
            placeholder={addPlaceholder}
            disabled={disabled}
          />
          <button
            type="button"
            className={addButtonClassName}
            style={addButtonStyle}
            onClick={onAddOption}
            disabled={Boolean(addDisabled)}
          >
            {addButtonLabel}
          </button>
        </div>
      )}
      {error && (
        <span className={errorClassName} style={errorStyle}>
          {error}
        </span>
      )}
    </div>
  );
};

export default ExperienceOptionsField;
