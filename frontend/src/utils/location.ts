import type { StructuredLocation } from '../types';

export interface LocationFields {
  countryCode: string;
  cityOrTown: string;
  stateOrRegion: string;
  addressLine: string;
  postalCode: string;
}

export interface LocationFieldErrors {
  countryCode?: string;
  cityOrTown?: string;
  stateOrRegion?: string;
  addressLine?: string;
  postalCode?: string;
}

export interface CountryOption {
  code: string;
  label: string;
}

export interface RegionOption {
  value: string;
  label: string;
}

const POSTAL_CODE_REGEX = /^[A-Za-z0-9 -]{3,10}$/;

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
];

const US_REGION_OPTIONS: RegionOption[] = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

const CA_REGION_OPTIONS: RegionOption[] = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
];

export const getRegionOptions = (countryCode: string): RegionOption[] => {
  if (countryCode === 'CA') {
    return CA_REGION_OPTIONS;
  }
  return US_REGION_OPTIONS;
};

export const emptyLocationFields = (): LocationFields => ({
  countryCode: 'US',
  cityOrTown: '',
  stateOrRegion: '',
  addressLine: '',
  postalCode: '',
});

export const parseLocationString = (location: string): LocationFields => {
  if (!location || location.trim().length === 0) {
    return emptyLocationFields();
  }

  const [rawCity = '', remainder = ''] = location.split(',').map((part) => part.trim());
  if (!remainder) {
    return { ...emptyLocationFields(), cityOrTown: rawCity };
  }

  const remainderParts = remainder.split(/\s+/).filter(Boolean);
  if (remainderParts.length >= 2 && POSTAL_CODE_REGEX.test(remainderParts[remainderParts.length - 1])) {
    const postalCode = remainderParts[remainderParts.length - 1];
    const stateOrRegion = remainderParts.slice(0, -1).join(' ').toUpperCase();
    return { ...emptyLocationFields(), cityOrTown: rawCity, stateOrRegion, postalCode };
  }

  return { ...emptyLocationFields(), cityOrTown: rawCity, stateOrRegion: remainder.toUpperCase() };
};

export const parseStructuredLocation = (location?: StructuredLocation | null): LocationFields => {
  if (!location) {
    return emptyLocationFields();
  }

  return {
    countryCode: location.country_code || 'US',
    cityOrTown: location.city || '',
    stateOrRegion: location.state_or_province || '',
    addressLine: location.address_line || '',
    postalCode: location.postal_code || '',
  };
};

export const formatLocationString = (fields: LocationFields): string => {
  const cityOrTown = fields.cityOrTown.trim();
  const stateOrRegion = fields.stateOrRegion.trim().toUpperCase();
  const postalCode = fields.postalCode.trim().toUpperCase();

  if (!cityOrTown && !stateOrRegion && !postalCode) {
    return '';
  }

  const secondSegment = [stateOrRegion, postalCode].filter(Boolean).join(' ').trim();
  return secondSegment ? `${cityOrTown}, ${secondSegment}` : cityOrTown;
};

export const toStructuredLocation = (fields: LocationFields): StructuredLocation | null => {
  const city = fields.cityOrTown.trim();
  const state = fields.stateOrRegion.trim().toUpperCase();
  const country = fields.countryCode.trim().toUpperCase();
  if (!city || !state || !country) {
    return null;
  }

  return {
    country_code: country,
    state_or_province: state,
    city,
    address_line: fields.addressLine.trim() || null,
    postal_code: fields.postalCode.trim().toUpperCase() || null,
  };
};

export const validateLocationFields = (fields: LocationFields): LocationFieldErrors => {
  const errors: LocationFieldErrors = {};

  if (!fields.countryCode || fields.countryCode.trim().length !== 2) {
    errors.countryCode = 'Country is required';
  }

  if (!fields.cityOrTown || fields.cityOrTown.trim().length < 2) {
    errors.cityOrTown = 'City or town is required';
  }

  if (!fields.stateOrRegion || fields.stateOrRegion.trim().length < 2) {
    errors.stateOrRegion = 'State or province is required';
  }

  if (
    fields.postalCode &&
    fields.postalCode.trim().length > 0 &&
    !POSTAL_CODE_REGEX.test(fields.postalCode.trim())
  ) {
    errors.postalCode = 'Postal code must be 3-10 letters/numbers';
  }

  return errors;
};
