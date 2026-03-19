import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { afterEach, before, describe, it, mock } from 'node:test';
import jwt from 'jsonwebtoken';
import { CaregiverProfile, StructuredLocation } from '../../types';

type JsonResponse = {
  statusCode: number;
  body: unknown;
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

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function sendJsonRequest(
  port: number,
  path: string,
  method: 'PUT' | 'POST',
  token: string,
  body: Record<string, unknown>
): Promise<JsonResponse> {
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer | string) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        res.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf8');
          try {
            resolve({
              statusCode: res.statusCode ?? 0,
              body: rawBody.length > 0 ? JSON.parse(rawBody) : null,
            });
          } catch (error: unknown) {
            reject(error);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
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

describe('caregiver profile rematch queueing', () => {
  it('queues rematch and returns queued status for caregiver profile updates', async () => {
    const [{ createApp }, { caregiverProfileRepository }, { matchingService }] = await Promise.all([
      import('../../app'),
      import('../../db/repositories/caregiverProfileRepository'),
      import('../../services/matchingService'),
    ]);

    const existingProfile = createProfile({
      id: 'profile-123',
      user_id: 'caregiver-user-123',
      matching_status: 'succeeded',
    });
    const updatedProfile = createProfile({
      id: existingProfile.id,
      user_id: existingProfile.user_id,
      name: 'Updated Name',
      skills: ['Mobility support', 'Companionship'],
      availability: 'Weekends only',
      matching_status: 'succeeded',
    });
    const queuedProfile = createProfile({
      id: existingProfile.id,
      user_id: existingProfile.user_id,
      matching_status: 'queued',
      matching_error: null,
    });

    const findByUserIdMock = mock.method(
      caregiverProfileRepository,
      'findByUserId',
      async () => existingProfile
    );
    const updateMock = mock.method(caregiverProfileRepository, 'update', async () => updatedProfile);
    const updateMatchingStatusMock = mock.method(
      caregiverProfileRepository,
      'updateMatchingStatusByProfileId',
      async () => queuedProfile
    );
    const triggerRematchMock = mock.method(
      matchingService,
      'triggerCaregiverRematchInBackground',
      () => {}
    );

    const app = createApp();
    const server = app.listen(0);
    await once(server, 'listening');

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected server to listen on a TCP port');
    }

    const token = jwt.sign(
      {
        userId: existingProfile.user_id,
        email: 'caregiver@example.com',
        role: 'caregiver',
      },
      process.env.JWT_SECRET as string
    );

    try {
      const response = await sendJsonRequest(address.port, '/api/caregiver/profile', 'PUT', token, {
        name: ' Updated Name ',
        contact_info: ' caregiver@example.com ',
        location: 'Austin, TX 73301',
        location_details: TEST_LOCATION,
        skills: ['Mobility support', 'Companionship'],
        availability: 'Weekends only',
      });

      assert.equal(response.statusCode, 200);

      const responseBody = response.body as {
        success: boolean;
        data: {
          id: string;
          matching_status: string;
        };
      };
      assert.equal(responseBody.success, true);
      assert.equal(responseBody.data.id, existingProfile.id);
      assert.equal(responseBody.data.matching_status, 'queued');

      assert.equal(findByUserIdMock.mock.calls.length, 1);
      assert.equal(updateMock.mock.calls.length, 1);
      assert.equal(updateMatchingStatusMock.mock.calls.length, 1);
      assert.deepEqual(updateMatchingStatusMock.mock.calls[0].arguments, [
        existingProfile.id,
        'queued',
        null,
      ]);
      assert.equal(triggerRematchMock.mock.calls.length, 1);
      assert.deepEqual(triggerRematchMock.mock.calls[0].arguments, [
        existingProfile.id,
        queuedProfile.matching_updated_at,
      ]);
    } finally {
      await closeServer(server);
    }
  });
});
