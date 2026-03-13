import React from 'react';
import {
  COUNTRY_OPTIONS,
  getRegionOptions,
  type LocationFields,
} from '../../utils/location';

type LocationFieldKey =
  | 'countryCode'
  | 'cityOrTown'
  | 'stateOrRegion'
  | 'addressLine'
  | 'postalCode';

type LocationErrors = Partial<Record<LocationFieldKey, string | undefined>>;

interface StructuredLocationFieldsProps {
  locationFields: LocationFields;
  errors: LocationErrors;
  disabled: boolean;
  onFieldChange: (field: keyof LocationFields, value: string) => void;
  fieldOrder?: LocationFieldKey[];
  labels?: Partial<Record<LocationFieldKey, string>>;
  placeholders?: Partial<Record<LocationFieldKey, string>>;
  showFieldLabels?: boolean;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  statePlaceholderOption?: string;
  ids?: Partial<Record<LocationFieldKey, string>>;
  fieldsContainerClassName?: string;
  fieldsContainerStyle?: React.CSSProperties;
  fieldWrapperClassName?: string;
  fieldWrapperStyle?: React.CSSProperties;
  inputClassName?: string;
  inputStyle?:
    | React.CSSProperties
    | ((field: LocationFieldKey, hasError: boolean) => React.CSSProperties);
  selectClassName?: string;
  selectStyle?:
    | React.CSSProperties
    | ((field: LocationFieldKey, hasError: boolean) => React.CSSProperties);
  errorClassName?: string;
  errorStyle?: React.CSSProperties;
}

const DEFAULT_FIELD_ORDER: LocationFieldKey[] = [
  'countryCode',
  'cityOrTown',
  'stateOrRegion',
  'addressLine',
  'postalCode',
];

const StructuredLocationFields: React.FC<StructuredLocationFieldsProps> = ({
  locationFields,
  errors,
  disabled,
  onFieldChange,
  fieldOrder = DEFAULT_FIELD_ORDER,
  labels = {},
  placeholders = {},
  showFieldLabels = false,
  labelClassName,
  labelStyle,
  statePlaceholderOption = '-- Select state/province --',
  ids = {},
  fieldsContainerClassName,
  fieldsContainerStyle,
  fieldWrapperClassName,
  fieldWrapperStyle,
  inputClassName,
  inputStyle,
  selectClassName,
  selectStyle,
  errorClassName,
  errorStyle,
}) => {
  const resolveStyle = (
    styleProp:
      | React.CSSProperties
      | ((field: LocationFieldKey, hasError: boolean) => React.CSSProperties)
      | undefined,
    field: LocationFieldKey
  ): React.CSSProperties | undefined => {
    if (!styleProp) {
      return undefined;
    }
    if (typeof styleProp === 'function') {
      return styleProp(field, Boolean(errors[field]));
    }
    return styleProp;
  };

  const renderError = (field: LocationFieldKey) =>
    errors[field] ? (
      <span className={errorClassName} style={errorStyle}>
        {errors[field]}
      </span>
    ) : null;

  return (
    <div className={fieldsContainerClassName} style={fieldsContainerStyle}>
      {fieldOrder.map((field) => {
        const id = ids[field];
        const label = labels[field];

        if (field === 'countryCode') {
          return (
            <div key={field} className={fieldWrapperClassName} style={fieldWrapperStyle}>
              {showFieldLabels && label && (
                <label htmlFor={id} className={labelClassName} style={labelStyle}>
                  {label}
                </label>
              )}
              <select
                id={id}
                value={locationFields.countryCode}
                onChange={(e) => onFieldChange('countryCode', e.target.value)}
                disabled={disabled}
                className={selectClassName}
                style={resolveStyle(selectStyle, field)}
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
              {renderError(field)}
            </div>
          );
        }

        if (field === 'stateOrRegion') {
          return (
            <div key={field} className={fieldWrapperClassName} style={fieldWrapperStyle}>
              {showFieldLabels && label && (
                <label htmlFor={id} className={labelClassName} style={labelStyle}>
                  {label}
                </label>
              )}
              <select
                id={id}
                value={locationFields.stateOrRegion}
                onChange={(e) => onFieldChange('stateOrRegion', e.target.value)}
                disabled={disabled}
                className={selectClassName}
                style={resolveStyle(selectStyle, field)}
              >
                <option value="">{statePlaceholderOption}</option>
                {getRegionOptions(locationFields.countryCode).map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              {renderError(field)}
            </div>
          );
        }

        return (
          <div key={field} className={fieldWrapperClassName} style={fieldWrapperStyle}>
            {showFieldLabels && label && (
              <label htmlFor={id} className={labelClassName} style={labelStyle}>
                {label}
              </label>
            )}
            <input
              id={id}
              type="text"
              value={locationFields[field] || ''}
              onChange={(e) => onFieldChange(field, e.target.value)}
              placeholder={placeholders[field]}
              disabled={disabled}
              className={inputClassName}
              style={resolveStyle(inputStyle, field)}
            />
            {renderError(field)}
          </div>
        );
      })}
    </div>
  );
};

export default StructuredLocationFields;
