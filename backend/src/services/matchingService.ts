import { careRequestRepository } from '../db/repositories/careRequestRepository';
import { caregiverProfileRepository } from '../db/repositories/caregiverProfileRepository';
import { jobAcceptRequestRepository } from '../db/repositories/jobAcceptRequestRepository';
import { matchRepository } from '../db/repositories/matchRepository';
import logger from '../config/logger';
import { CareRequest, CaregiverProfile, StructuredLocation } from '../types';
import { locationsMatchByRegion, normalizeStructuredLocation, parseLegacyLocation } from '../utils/location';

type AvailabilityDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type AvailabilitySlot = {
  day: AvailabilityDay;
  start: string;
  end: string;
};

type StructuredAvailability = {
  v: 1;
  timezone: 'local';
  slots: AvailabilitySlot[];
};

const STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'from', 'any', 'all', 'shift']);
const MEANINGFUL_AVAILABILITY_TOKENS = new Set([
  'mon',
  'monday',
  'tue',
  'tuesday',
  'wed',
  'wednesday',
  'thu',
  'thursday',
  'fri',
  'friday',
  'sat',
  'saturday',
  'sun',
  'sunday',
  'weekday',
  'weekdays',
  'weekend',
  'weekends',
  'morning',
  'afternoon',
  'evening',
  'night',
  'overnight',
]);

const AVAILABILITY_DAY_LABELS: Record<AvailabilityDay, string[]> = {
  mon: ['mon', 'monday'],
  tue: ['tue', 'tuesday'],
  wed: ['wed', 'wednesday'],
  thu: ['thu', 'thursday'],
  fri: ['fri', 'friday'],
  sat: ['sat', 'saturday'],
  sun: ['sun', 'sunday'],
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getRequestedLocation(careRequest: CareRequest): StructuredLocation | null {
  return (
    normalizeStructuredLocation(careRequest.service_location_details) ??
    parseLegacyLocation(careRequest.service_location)
  );
}

function getCaregiverLocations(caregiver: CaregiverProfile): StructuredLocation[] {
  const structuredCandidates = [normalizeStructuredLocation(caregiver.location_details)].filter(
    (location): location is StructuredLocation => location !== null
  );

  const legacyCandidates = [caregiver.location]
    .map((location) => parseLegacyLocation(location))
    .filter((location): location is StructuredLocation => location !== null);

  return [...structuredCandidates, ...legacyCandidates];
}

function locationsMatch(careRequest: CareRequest, caregiver: CaregiverProfile): boolean {
  const requestedLocation = getRequestedLocation(careRequest);
  if (!requestedLocation) {
    return false;
  }

  const caregiverLocations = getCaregiverLocations(caregiver);
  return caregiverLocations.some((location) => locationsMatchByRegion(requestedLocation, location));
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
  );
}

function isStructuredAvailability(value: unknown): value is StructuredAvailability {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeValue = value as Partial<StructuredAvailability>;
  if (maybeValue.v !== 1 || maybeValue.timezone !== 'local' || !Array.isArray(maybeValue.slots)) {
    return false;
  }

  return maybeValue.slots.every(
    (slot) =>
      slot &&
      typeof slot === 'object' &&
      typeof slot.day === 'string' &&
      Object.prototype.hasOwnProperty.call(AVAILABILITY_DAY_LABELS, slot.day) &&
      typeof slot.start === 'string' &&
      typeof slot.end === 'string'
  );
}

function parseStructuredAvailability(value: string): StructuredAvailability | null {
  try {
    const parsed = JSON.parse(value);
    return isStructuredAvailability(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function slotsOverlap(a: AvailabilitySlot, b: AvailabilitySlot): boolean {
  if (a.day !== b.day) {
    return false;
  }

  return a.start < b.end && b.start < a.end;
}

function slotsToTokenSet(slots: AvailabilitySlot[]): Set<string> {
  return new Set(
    slots.flatMap((slot) => [
      ...AVAILABILITY_DAY_LABELS[slot.day],
      slot.start.startsWith('0') || slot.start.startsWith('1') ? 'morning' : 'afternoon',
    ])
  );
}

function availabilityMatches(schedule: string, caregiverAvailability: string): boolean {
  const structuredSchedule = parseStructuredAvailability(schedule);
  const structuredCaregiver = parseStructuredAvailability(caregiverAvailability);

  if (structuredSchedule && structuredCaregiver) {
    return structuredSchedule.slots.some((requestedSlot) =>
      structuredCaregiver.slots.some((caregiverSlot) => slotsOverlap(requestedSlot, caregiverSlot))
    );
  }

  if (structuredSchedule && !structuredCaregiver) {
    const normalizedAvailability = normalizeText(caregiverAvailability);
    const tokenSet = slotsToTokenSet(structuredSchedule.slots);
    return [...tokenSet].some((token) => normalizedAvailability.includes(token));
  }

  if (!structuredSchedule && structuredCaregiver) {
    const normalizedSchedule = normalizeText(schedule);
    const tokenSet = slotsToTokenSet(structuredCaregiver.slots);
    return [...tokenSet].some((token) => normalizedSchedule.includes(token));
  }

  const normalizedSchedule = normalizeText(schedule);
  const normalizedAvailability = normalizeText(caregiverAvailability);

  if (
    normalizedSchedule.includes(normalizedAvailability) ||
    normalizedAvailability.includes(normalizedSchedule)
  ) {
    return true;
  }

  const scheduleTokens = tokenize(normalizedSchedule);
  const availabilityTokens = tokenize(normalizedAvailability);
  const overlappingTokens = [...scheduleTokens].filter((token) => availabilityTokens.has(token));

  if (overlappingTokens.length >= 2) {
    return true;
  }

  return (
    overlappingTokens.length === 1 &&
    MEANINGFUL_AVAILABILITY_TOKENS.has(overlappingTokens[0])
  );
}

function hasExperienceMatch(requiredExperiences: string[], caregiver: CaregiverProfile): boolean {
  if (!requiredExperiences || requiredExperiences.length === 0) {
    return true;
  }

  const normalizedSkills = caregiver.skills.map((skill) => normalizeText(skill));
  const normalizedExperienceTags = caregiver.experience_tags.map((tag) => normalizeText(tag));
  const normalizedExperience = caregiver.experience ? normalizeText(caregiver.experience) : '';

  return requiredExperiences.every((requiredExperience) => {
    const normalizedRequirement = normalizeText(requiredExperience);

    const skillMatch = normalizedSkills.some(
      (skill) => skill === normalizedRequirement || skill.includes(normalizedRequirement)
    );
    const experienceTagMatch = normalizedExperienceTags.some(
      (tag) => tag === normalizedRequirement || tag.includes(normalizedRequirement)
    );
    const experienceMatch = normalizedExperience.includes(normalizedRequirement);

    return skillMatch || experienceTagMatch || experienceMatch;
  });
}

function caregiverMatchesRequest(careRequest: CareRequest, caregiver: CaregiverProfile): boolean {
  const matchesAvailability = availabilityMatches(careRequest.schedule, caregiver.availability);
  const matchesLocation = locationsMatch(careRequest, caregiver);
  const matchesExperience = hasExperienceMatch(careRequest.required_experiences, caregiver);

  return matchesAvailability && matchesLocation && matchesExperience;
}

export const matchingService = {
  async matchCareRequest(careRequest: CareRequest): Promise<string[]> {
    const caregivers = await caregiverProfileRepository.findAll();

    const matchedCaregiverIds = caregivers
      .filter((caregiver) => caregiverMatchesRequest(careRequest, caregiver))
      .map((caregiver) => caregiver.id);

    await matchRepository.createMany(careRequest.id, matchedCaregiverIds);

    return matchedCaregiverIds;
  },

  async recomputeCareRequestMatches(careRequestId: string): Promise<string[]> {
    const acceptRequest = await jobAcceptRequestRepository.findByCareRequestId(careRequestId);
    if (acceptRequest?.status === 'accepted') {
      await matchRepository.deleteByRequestIdExceptCaregiverId(careRequestId, acceptRequest.caregiver_id);
      await matchRepository.create(careRequestId, acceptRequest.caregiver_id);
      return [acceptRequest.caregiver_id];
    }

    const careRequest = await careRequestRepository.findById(careRequestId);
    if (!careRequest) {
      return [];
    }

    await matchRepository.deleteByRequestId(careRequest.id);
    return this.matchCareRequest(careRequest);
  },

  async refreshMatchesForCaregiver(caregiverId: string): Promise<void> {
    const [caregiver, careRequests] = await Promise.all([
      caregiverProfileRepository.findById(caregiverId),
      careRequestRepository.findAll(),
    ]);

    for (const careRequest of careRequests) {
      const acceptRequest = await jobAcceptRequestRepository.findByCareRequestId(careRequest.id);
      if (acceptRequest?.status === 'accepted') {
        await matchRepository.deleteByRequestIdExceptCaregiverId(
          careRequest.id,
          acceptRequest.caregiver_id
        );
        await matchRepository.create(careRequest.id, acceptRequest.caregiver_id);
        continue;
      }

      if (!caregiver) {
        await matchRepository.deleteByRequestIdAndCaregiverId(careRequest.id, caregiverId);
        continue;
      }

      if (caregiverMatchesRequest(careRequest, caregiver)) {
        await matchRepository.create(careRequest.id, caregiver.id);
      } else {
        await matchRepository.deleteByRequestIdAndCaregiverId(careRequest.id, caregiver.id);
      }
    }
  },

  triggerCaregiverRematchInBackground(caregiverId: string, queuedStatusUpdatedAt: Date): void {
    setImmediate(() => {
      void (async () => {
        let runningStatusUpdatedAt: Date | null = null;

        try {
          const runningProfile = await caregiverProfileRepository.updateMatchingStatusByProfileId(
            caregiverId,
            'running',
            null,
            {
              expectedCurrentStatus: 'queued',
              expectedMatchingUpdatedAt: queuedStatusUpdatedAt,
            }
          );
          if (!runningProfile) {
            logger.info('Skipping stale caregiver rematch job', {
              caregiverId,
              queuedStatusUpdatedAt: String(queuedStatusUpdatedAt),
            });
            return;
          }

          runningStatusUpdatedAt = runningProfile.matching_updated_at;
          if (!runningStatusUpdatedAt) {
            throw new Error('Caregiver rematch running status did not set matching_updated_at');
          }

          await this.refreshMatchesForCaregiver(caregiverId);

          const succeededProfile = await caregiverProfileRepository.updateMatchingStatusByProfileId(
            caregiverId,
            'succeeded',
            null,
            {
              expectedCurrentStatus: 'running',
              expectedMatchingUpdatedAt: runningStatusUpdatedAt,
            }
          );
          if (!succeededProfile) {
            logger.info('Skipped stale caregiver rematch success status update', {
              caregiverId,
            });
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (runningStatusUpdatedAt) {
            try {
              const failedProfile = await caregiverProfileRepository.updateMatchingStatusByProfileId(
                caregiverId,
                'failed',
                errorMessage,
                {
                  expectedCurrentStatus: 'running',
                  expectedMatchingUpdatedAt: runningStatusUpdatedAt,
                }
              );
              if (!failedProfile) {
                logger.info('Skipped stale caregiver rematch failure status update', {
                  caregiverId,
                });
              }
            } catch (statusUpdateError: unknown) {
              logger.error('Failed to persist caregiver rematch failure status', {
                caregiverId,
                error:
                  statusUpdateError instanceof Error
                    ? statusUpdateError.message
                    : String(statusUpdateError),
              });
            }
          }

          logger.error('Background caregiver rematch failed', {
            caregiverId,
            queuedStatusUpdatedAt: String(queuedStatusUpdatedAt),
            error: errorMessage,
          });
        }
      })();
    });
  },

  async matchCareRequestById(careRequestId: string): Promise<string[]> {
    const careRequest = await careRequestRepository.findById(careRequestId);
    if (!careRequest) {
      return [];
    }

    return this.matchCareRequest(careRequest);
  },
};
