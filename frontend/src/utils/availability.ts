export const AVAILABILITY_DAY_OPTIONS = [
  { key: 'mon', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tue', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wed', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thu', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'fri', label: 'Friday', shortLabel: 'Fri' },
  { key: 'sat', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sun', label: 'Sunday', shortLabel: 'Sun' },
] as const;

export type AvailabilityDay = (typeof AVAILABILITY_DAY_OPTIONS)[number]['key'];

export interface AvailabilitySlot {
  day: AvailabilityDay;
  start: string;
  end: string;
}

interface StructuredAvailability {
  v: 1;
  timezone: 'local';
  slots: AvailabilitySlot[];
}

const DAY_ORDER: Record<AvailabilityDay, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

const DAY_LABEL_BY_KEY = AVAILABILITY_DAY_OPTIONS.reduce<Record<AvailabilityDay, string>>(
  (acc, day) => {
    acc[day.key] = day.shortLabel;
    return acc;
  },
  {} as Record<AvailabilityDay, string>
);

const isAvailabilityDay = (day: string): day is AvailabilityDay =>
  Object.prototype.hasOwnProperty.call(DAY_ORDER, day);

const normalizeSlots = (slots: AvailabilitySlot[]): AvailabilitySlot[] =>
  [...slots]
    .filter((slot) => isAvailabilityDay(slot.day))
    .map((slot) => ({
      day: slot.day,
      start: slot.start,
      end: slot.end,
    }))
    .sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day]);

const isStructuredAvailability = (
  value: unknown
): value is StructuredAvailability => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeValue = value as Partial<StructuredAvailability>;
  if (maybeValue.v !== 1 || maybeValue.timezone !== 'local') {
    return false;
  }

  if (!Array.isArray(maybeValue.slots)) {
    return false;
  }

  return maybeValue.slots.every(
    (slot) =>
      slot &&
      typeof slot === 'object' &&
      typeof slot.day === 'string' &&
      isAvailabilityDay(slot.day) &&
      typeof slot.start === 'string' &&
      typeof slot.end === 'string'
  );
};

export const serializeAvailabilitySlots = (slots: AvailabilitySlot[]): string => {
  const payload: StructuredAvailability = {
    v: 1,
    timezone: 'local',
    slots: normalizeSlots(slots),
  };

  return JSON.stringify(payload);
};

export const parseAvailabilitySlots = (
  availability: string | undefined | null
): AvailabilitySlot[] | null => {
  if (!availability || availability.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(availability);
    if (!isStructuredAvailability(parsed)) {
      return null;
    }

    return normalizeSlots(parsed.slots);
  } catch {
    return null;
  }
};

export const validateAvailabilitySlots = (
  slots: AvailabilitySlot[]
): string | null => {
  if (slots.length === 0) {
    return 'Please select at least one availability day';
  }

  for (const slot of slots) {
    if (!slot.start || !slot.end) {
      return `Please set both start and end time for ${DAY_LABEL_BY_KEY[slot.day]}`;
    }

    if (slot.start >= slot.end) {
      return `End time must be after start time for ${DAY_LABEL_BY_KEY[slot.day]}`;
    }
  }

  return null;
};

export const formatAvailabilitySummary = (availability: string): string => {
  const slots = parseAvailabilitySlots(availability);
  if (slots === null) {
    return availability;
  }

  if (slots.length === 0) {
    return 'Not provided';
  }

  return slots
    .map((slot) => `${DAY_LABEL_BY_KEY[slot.day]} ${slot.start}-${slot.end}`)
    .join(', ');
};
