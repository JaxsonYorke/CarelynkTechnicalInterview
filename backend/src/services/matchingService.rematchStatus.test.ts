import assert from 'node:assert/strict';
import { afterEach, before, describe, it, mock } from 'node:test';
import { CaregiverProfile, MatchingStatus, StructuredLocation } from '../types';

type StatusUpdate = {
  status: MatchingStatus;
  error: string | null;
};

const TEST_LOCATION: StructuredLocation = {
  country_code: 'US',
  state_or_province: 'TX',
  city: 'austin',
  address_line: null,
  postal_code: '73301',
};

function createProfile(overrides: Partial<CaregiverProfile> = {}): CaregiverProfile {
  return {
    id: overrides.id ?? 'profile-1',
    user_id: overrides.user_id ?? 'user-1',
    name: overrides.name ?? 'Alex Caregiver',
    contact_info: overrides.contact_info ?? 'alex@example.com',
    location: overrides.location ?? 'Austin, TX 73301',
    location_details: overrides.location_details ?? TEST_LOCATION,
    skills: overrides.skills ?? ['Mobility support'],
    experience_tags: overrides.experience_tags ?? ['Dementia care'],
    experience: overrides.experience ?? '5 years',
    availability: overrides.availability ?? 'Weekdays mornings',
    qualifications: overrides.qualifications ?? 'CNA',
    matching_status: overrides.matching_status ?? 'succeeded',
    matching_error: overrides.matching_error ?? null,
    matching_updated_at: overrides.matching_updated_at ?? new Date('2024-01-01T00:00:00.000Z'),
    created_at: overrides.created_at ?? new Date('2024-01-01T00:00:00.000Z'),
  };
}

async function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Timed out waiting for background rematch to finish');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

before(() => {
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
  process.env.PORT = process.env.PORT ?? '0';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ?? 'postgresql://localhost:5432/carelynk_test';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET ?? 'test-secret-with-at-least-32-characters';
  process.env.JWT_EXPIRE = process.env.JWT_EXPIRE ?? '7d';
  process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS ?? '10';
  process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'error';
});

afterEach(() => {
  mock.restoreAll();
});

describe('matchingService.triggerCaregiverRematchInBackground', () => {
  it('updates caregiver matching status from running to succeeded on successful refresh', async () => {
    const [{ matchingService }, { caregiverProfileRepository }] = await Promise.all([
      import('./matchingService'),
      import('../db/repositories/caregiverProfileRepository'),
    ]);

    const statusUpdates: StatusUpdate[] = [];
    const caregiverId = 'caregiver-100';
    const queuedStatusUpdatedAt = new Date('2024-01-01T00:00:00.000Z');
    const runningStatusUpdatedAt = new Date('2024-01-01T00:01:00.000Z');
    const succeededStatusUpdatedAt = new Date('2024-01-01T00:02:00.000Z');

    const updateStatusMock = mock.method(
      caregiverProfileRepository,
      'updateMatchingStatusByProfileId',
      async (
        profileId: string,
        status: MatchingStatus,
        error: string | null,
        _options?: unknown
      ) => {
        statusUpdates.push({ status, error });
        return createProfile({
          id: profileId,
          user_id: caregiverId,
          matching_status: status,
          matching_error: error,
          matching_updated_at:
            status === 'running' ? runningStatusUpdatedAt : succeededStatusUpdatedAt,
        });
      }
    );

    const refreshMock = mock.method(matchingService, 'refreshMatchesForCaregiver', async () => {});

    matchingService.triggerCaregiverRematchInBackground(caregiverId, queuedStatusUpdatedAt);

    await waitFor(() => statusUpdates.length === 2);

    assert.deepEqual(statusUpdates, [
      { status: 'running', error: null },
      { status: 'succeeded', error: null },
    ]);
    assert.equal(updateStatusMock.mock.calls.length, 2);
    assert.deepEqual(updateStatusMock.mock.calls[0].arguments, [
      caregiverId,
      'running',
      null,
      {
        expectedCurrentStatus: 'queued',
        expectedMatchingUpdatedAt: queuedStatusUpdatedAt,
      },
    ]);
    assert.deepEqual(updateStatusMock.mock.calls[1].arguments, [
      caregiverId,
      'succeeded',
      null,
      {
        expectedCurrentStatus: 'running',
        expectedMatchingUpdatedAt: runningStatusUpdatedAt,
      },
    ]);
    assert.equal(refreshMock.mock.calls.length, 1);
    assert.deepEqual(refreshMock.mock.calls[0].arguments, [caregiverId]);
  });

  it('updates caregiver matching status to failed when refresh throws', async () => {
    const [{ matchingService }, { caregiverProfileRepository }] = await Promise.all([
      import('./matchingService'),
      import('../db/repositories/caregiverProfileRepository'),
    ]);

    const statusUpdates: StatusUpdate[] = [];
    const caregiverId = 'caregiver-200';
    const queuedStatusUpdatedAt = new Date('2024-01-01T00:00:00.000Z');
    const runningStatusUpdatedAt = new Date('2024-01-01T00:01:00.000Z');
    const failedStatusUpdatedAt = new Date('2024-01-01T00:02:00.000Z');

    const updateStatusMock = mock.method(
      caregiverProfileRepository,
      'updateMatchingStatusByProfileId',
      async (
        profileId: string,
        status: MatchingStatus,
        error: string | null,
        _options?: unknown
      ) => {
        statusUpdates.push({ status, error });
        return createProfile({
          id: profileId,
          user_id: caregiverId,
          matching_status: status,
          matching_error: error,
          matching_updated_at: status === 'running' ? runningStatusUpdatedAt : failedStatusUpdatedAt,
        });
      }
    );

    mock.method(matchingService, 'refreshMatchesForCaregiver', async () => {
      throw new Error('refresh failed');
    });

    matchingService.triggerCaregiverRematchInBackground(caregiverId, queuedStatusUpdatedAt);

    await waitFor(() => statusUpdates.length === 2);

    assert.deepEqual(statusUpdates, [
      { status: 'running', error: null },
      { status: 'failed', error: 'refresh failed' },
    ]);
    assert.equal(updateStatusMock.mock.calls.length, 2);
    assert.deepEqual(updateStatusMock.mock.calls[0].arguments, [
      caregiverId,
      'running',
      null,
      {
        expectedCurrentStatus: 'queued',
        expectedMatchingUpdatedAt: queuedStatusUpdatedAt,
      },
    ]);
    assert.deepEqual(updateStatusMock.mock.calls[1].arguments, [
      caregiverId,
      'failed',
      'refresh failed',
      {
        expectedCurrentStatus: 'running',
        expectedMatchingUpdatedAt: runningStatusUpdatedAt,
      },
    ]);
  });
});
