import { StructuredLocation } from '../types';

const STATE_ALIASES: Record<string, string> = {
  alabama: 'al',
  alaska: 'ak',
  arizona: 'az',
  arkansas: 'ar',
  california: 'ca',
  colorado: 'co',
  connecticut: 'ct',
  delaware: 'de',
  florida: 'fl',
  georgia: 'ga',
  hawaii: 'hi',
  idaho: 'id',
  illinois: 'il',
  indiana: 'in',
  iowa: 'ia',
  kansas: 'ks',
  kentucky: 'ky',
  louisiana: 'la',
  maine: 'me',
  maryland: 'md',
  massachusetts: 'ma',
  michigan: 'mi',
  minnesota: 'mn',
  mississippi: 'ms',
  missouri: 'mo',
  montana: 'mt',
  nebraska: 'ne',
  nevada: 'nv',
  'new hampshire': 'nh',
  'new jersey': 'nj',
  'new mexico': 'nm',
  'new york': 'ny',
  'north carolina': 'nc',
  'north dakota': 'nd',
  ohio: 'oh',
  oklahoma: 'ok',
  oregon: 'or',
  pennsylvania: 'pa',
  'rhode island': 'ri',
  'south carolina': 'sc',
  'south dakota': 'sd',
  tennessee: 'tn',
  texas: 'tx',
  utah: 'ut',
  vermont: 'vt',
  virginia: 'va',
  washington: 'wa',
  'west virginia': 'wv',
  wisconsin: 'wi',
  wyoming: 'wy',
  'district of columbia': 'dc',
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeCountryCode(value: string): string {
  const normalized = normalizeText(value);
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }
  if (normalized === 'united states' || normalized === 'usa' || normalized === 'us') {
    return 'US';
  }
  if (normalized === 'canada' || normalized === 'ca') {
    return 'CA';
  }
  return normalized.toUpperCase();
}

function normalizeStateOrProvince(value: string, countryCode: string): string {
  const normalized = normalizeText(value).replace(/\./g, '');
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }
  if (countryCode === 'US') {
    return (STATE_ALIASES[normalized] ?? normalized).toUpperCase();
  }
  return normalized.toUpperCase();
}

export function formatLocationString(location: StructuredLocation): string {
  const secondSegment = [location.state_or_province, location.postal_code]
    .filter((part) => part && part.trim().length > 0)
    .join(' ')
    .trim();
  return secondSegment ? `${location.city}, ${secondSegment}` : location.city;
}

export function normalizeStructuredLocation(value: unknown): StructuredLocation | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const maybeLocation = value as Record<string, unknown>;
  const countryRaw =
    typeof maybeLocation.country_code === 'string' ? maybeLocation.country_code : '';
  const stateRaw =
    typeof maybeLocation.state_or_province === 'string' ? maybeLocation.state_or_province : '';
  const cityRaw = typeof maybeLocation.city === 'string' ? maybeLocation.city : '';
  const addressRaw =
    typeof maybeLocation.address_line === 'string' ? maybeLocation.address_line : '';
  const postalRaw = typeof maybeLocation.postal_code === 'string' ? maybeLocation.postal_code : '';

  if (countryRaw.trim().length === 0 || stateRaw.trim().length === 0 || cityRaw.trim().length === 0) {
    return null;
  }

  const countryCode = normalizeCountryCode(countryRaw);
  const stateOrProvince = normalizeStateOrProvince(stateRaw, countryCode);

  return {
    country_code: countryCode,
    state_or_province: stateOrProvince,
    city: normalizeText(cityRaw),
    address_line: addressRaw.trim().length > 0 ? addressRaw.trim() : null,
    postal_code: postalRaw.trim().length > 0 ? postalRaw.trim().toUpperCase() : null,
  };
}

export function parseLegacyLocation(location: string): StructuredLocation | null {
  const normalized = normalizeText(location);
  if (!normalized) {
    return null;
  }

  const [cityPart = '', remainder = ''] = normalized.split(',').map((part) => part.trim());
  if (!cityPart || !remainder) {
    return null;
  }

  const remainderParts = remainder.split(/\s+/).filter(Boolean);
  const statePart = remainderParts[0];
  const postalCode = remainderParts.length > 1 ? remainderParts.slice(1).join(' ').toUpperCase() : null;
  if (!statePart) {
    return null;
  }

  return {
    country_code: 'US',
    state_or_province: normalizeStateOrProvince(statePart, 'US'),
    city: cityPart,
    address_line: null,
    postal_code: postalCode,
  };
}

export function normalizeStructuredLocations(value: unknown): StructuredLocation[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => normalizeStructuredLocation(item))
    .filter((item): item is StructuredLocation => item !== null);
}

export function buildLocationPayload(
  legacyLocation: string | undefined,
  locationDetails: unknown
): { legacy: string; details: StructuredLocation | null } {
  const normalizedLegacy = (legacyLocation ?? '').trim();
  const normalizedDetails =
    normalizeStructuredLocation(locationDetails) ??
    (normalizedLegacy.length > 0 ? parseLegacyLocation(normalizedLegacy) : null);

  return {
    legacy: normalizedLegacy || (normalizedDetails ? formatLocationString(normalizedDetails) : ''),
    details: normalizedDetails,
  };
}

export function buildServiceAreasPayload(
  legacyServiceAreas: string[] | undefined,
  serviceAreaDetails: unknown
): { legacy: string[]; details: StructuredLocation[] } {
  const normalizedLegacy = Array.isArray(legacyServiceAreas)
    ? legacyServiceAreas.map((area) => area.trim()).filter((area) => area.length > 0)
    : [];

  const normalizedDetails = normalizeStructuredLocations(serviceAreaDetails);
  const detailsFromLegacy = normalizedLegacy
    .map((area) => parseLegacyLocation(area))
    .filter((location): location is StructuredLocation => location !== null);

  const details = normalizedDetails.length > 0 ? normalizedDetails : detailsFromLegacy;
  const legacy = normalizedLegacy.length > 0 ? normalizedLegacy : details.map(formatLocationString);

  return { legacy, details };
}

export function locationsMatchByRegion(
  requestedLocation: StructuredLocation,
  candidateLocation: StructuredLocation
): boolean {
  return (
    requestedLocation.country_code === candidateLocation.country_code &&
    requestedLocation.state_or_province === candidateLocation.state_or_province
  );
}
