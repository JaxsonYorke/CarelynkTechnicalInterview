import { initializeDatabase, closeDatabase } from './connection';
import { getDatabase } from './connection';
import { runMigrations } from './migrate';
import { authService } from '../services/authService';
import logger from '../config/logger';

type SeedUser = {
  id: string;
  email: string;
  role: 'caregiver' | 'care_seeker';
  password: string;
};

const seedUsers: SeedUser[] = [
  { id: '11111111-1111-4111-8111-111111111111', email: 'caregiver.alex@demo.carelynk', role: 'caregiver', password: 'Caregiver123!' },
  { id: '22222222-2222-4222-8222-222222222222', email: 'caregiver.blair@demo.carelynk', role: 'caregiver', password: 'Caregiver123!' },
  { id: '33333333-3333-4333-8333-333333333333', email: 'caregiver.casey@demo.carelynk', role: 'caregiver', password: 'Caregiver123!' },
  { id: '44444444-4444-4444-8444-444444444444', email: 'caregiver.devon@demo.carelynk', role: 'caregiver', password: 'Caregiver123!' },
  { id: '55555555-5555-4555-8555-555555555555', email: 'caregiver.elliot@demo.carelynk', role: 'caregiver', password: 'Caregiver123!' },
  { id: '66666666-6666-4666-8666-666666666666', email: 'seeker.fiona@demo.carelynk', role: 'care_seeker', password: 'Seeker123!' },
  { id: '77777777-7777-4777-8777-777777777777', email: 'seeker.gabriel@demo.carelynk', role: 'care_seeker', password: 'Seeker123!' },
  { id: '88888888-8888-4888-8888-888888888888', email: 'seeker.harper@demo.carelynk', role: 'care_seeker', password: 'Seeker123!' },
];

const now = new Date();

async function seedDummyData(): Promise<void> {
  await initializeDatabase();
  await runMigrations();
  const db = getDatabase();

  const passwordHashes = new Map<string, string>();
  for (const user of seedUsers) {
    passwordHashes.set(user.id, await authService.hashPassword(user.password));
  }

  await db.begin(async (tx) => {
    await tx.unsafe(`
      TRUNCATE TABLE
        job_accept_requests,
        matches,
        care_requests,
        caregiver_profiles,
        care_seeker_profiles,
        experience_options,
        users
      RESTART IDENTITY CASCADE;
    `);

    for (const user of seedUsers) {
      await tx`
        INSERT INTO users (id, email, password_hash, role, created_at)
        VALUES (${user.id}, ${user.email}, ${passwordHashes.get(user.id)!}, ${user.role}, ${now})
      `;
    }

    const experienceOptions = [
      'Elderly Care',
      'Childcare',
      'Medication Management',
      'Post-surgery Support',
      'Mobility Assistance',
      'Dementia Care',
      'Meal Preparation',
      'Companionship',
    ];

    for (const label of experienceOptions) {
      await tx`
        INSERT INTO experience_options (label, normalized_label, created_by_user_id, created_at)
        VALUES (${label}, ${label.toLowerCase()}, ${'11111111-1111-4111-8111-111111111111'}, ${now})
      `;
    }

    await tx`
      INSERT INTO caregiver_profiles (
        id, user_id, name, contact_info, location, location_details,
        skills, experience_tags, experience, availability, qualifications, created_at
      ) VALUES
      (
        ${'a1111111-1111-4111-8111-111111111111'},
        ${'11111111-1111-4111-8111-111111111111'},
        ${'Alex Morgan'},
        ${'alex@example.com'},
        ${'Austin, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'austin', address_line: null, postal_code: '78701' }},
        ${['Medication management', 'Mobility assistance', 'Companionship']},
        ${['Medication Management', 'Mobility Assistance', 'Companionship']},
        ${'8 years in homecare and senior wellness support.'},
        ${JSON.stringify({ v: 1, timezone: 'local', slots: [{ day: 'mon', start: '08:00', end: '12:00' }, { day: 'wed', start: '13:00', end: '18:00' }, { day: 'fri', start: '09:00', end: '17:00' }] })},
        ${'CPR Certified'},
        ${now}
      ),
      (
        ${'a2222222-2222-4222-8222-222222222222'},
        ${'22222222-2222-4222-8222-222222222222'},
        ${'Blair Kim'},
        ${'blair@example.com'},
        ${'Dallas, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'dallas', address_line: null, postal_code: '75201' }},
        ${['Childcare', 'Meal preparation', 'Companionship']},
        ${['Childcare', 'Meal Preparation', 'Companionship']},
        ${'Former pediatric care assistant with family support focus.'},
        ${'Weekdays morning and afternoon'},
        ${'First Aid Training'},
        ${now}
      ),
      (
        ${'a3333333-3333-4333-8333-333333333333'},
        ${'33333333-3333-4333-8333-333333333333'},
        ${'Casey Rivera'},
        ${'casey@example.com'},
        ${'Houston, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'houston', address_line: null, postal_code: '77002' }},
        ${['Dementia care', 'Elderly care', 'Medication management']},
        ${['Dementia Care', 'Elderly Care', 'Medication Management']},
        ${'Specialized memory-care support and medication routines.'},
        ${JSON.stringify({ v: 1, timezone: 'local', slots: [{ day: 'tue', start: '10:00', end: '16:00' }, { day: 'thu', start: '10:00', end: '16:00' }, { day: 'sat', start: '09:00', end: '14:00' }] })},
        ${'CNA'},
        ${now}
      ),
      (
        ${'a4444444-4444-4444-8444-444444444444'},
        ${'44444444-4444-4444-8444-444444444444'},
        ${'Devon Patel'},
        ${'devon@example.com'},
        ${'San Antonio, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'san antonio', address_line: null, postal_code: '78205' }},
        ${['Post-surgery support', 'Mobility assistance']},
        ${['Post-surgery Support', 'Mobility Assistance']},
        ${'Post-op recovery caregiver with mobility rehabilitation background.'},
        ${'Evenings and weekends'},
        ${'Physical Therapy Assistant'},
        ${now}
      ),
      (
        ${'a5555555-5555-4555-8555-555555555555'},
        ${'55555555-5555-4555-8555-555555555555'},
        ${'Elliot Chen'},
        ${'elliot@example.com'},
        ${'Austin, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'austin', address_line: null, postal_code: '78704' }},
        ${['Companionship', 'Meal preparation', 'Elderly care']},
        ${['Companionship', 'Meal Preparation', 'Elderly Care']},
        ${'Community caregiver focused on daily living support.'},
        ${'Mon Wed Fri daytime'},
        ${null},
        ${now}
      )
    `;

    await tx`
      INSERT INTO care_seeker_profiles (
        id, user_id, name, contact_info, location, created_at
      ) VALUES
      (${ 'b6666666-6666-4666-8666-666666666666' }, ${ '66666666-6666-4666-8666-666666666666' }, ${ 'Fiona Wright' }, ${ 'fiona@example.com' }, ${ 'Austin, TX' }, ${now}),
      (${ 'b7777777-7777-4777-8777-777777777777' }, ${ '77777777-7777-4777-8777-777777777777' }, ${ 'Gabriel Stone' }, ${ 'gabriel@example.com' }, ${ 'Dallas, TX' }, ${now}),
      (${ 'b8888888-8888-4888-8888-888888888888' }, ${ '88888888-8888-4888-8888-888888888888' }, ${ 'Harper Blake' }, ${ 'harper@example.com' }, ${ 'Houston, TX' }, ${now})
    `;

    await tx`
      INSERT INTO care_requests (
        id, care_seeker_id, care_type, service_location, service_location_details,
        schedule, duration, preferences, required_experiences, created_at
      ) VALUES
      (
        ${'c1010101-1010-4101-8101-101010101010'},
        ${'b6666666-6666-4666-8666-666666666666'},
        ${'In-home elderly support'},
        ${'Austin, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'austin', address_line: null, postal_code: '78702' }},
        ${JSON.stringify({ v: 1, timezone: 'local', slots: [{ day: 'mon', start: '09:00', end: '13:00' }, { day: 'fri', start: '10:00', end: '14:00' }] })},
        ${'12 weeks'},
        ${'Need medication reminders and mobility support'},
        ${['Medication Management', 'Mobility Assistance']},
        ${now}
      ),
      (
        ${'c2020202-2020-4202-8202-202020202020'},
        ${'b7777777-7777-4777-8777-777777777777'},
        ${'After school childcare'},
        ${'Dallas, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'dallas', address_line: null, postal_code: '75202' }},
        ${'Weekdays afternoons'},
        ${'Ongoing'},
        ${'Meal prep and companionship preferred'},
        ${['Childcare', 'Meal Preparation']},
        ${now}
      ),
      (
        ${'c3030303-3030-4303-8303-303030303030'},
        ${'b8888888-8888-4888-8888-888888888888'},
        ${'Memory care assistance'},
        ${'Houston, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'houston', address_line: null, postal_code: '77003' }},
        ${'Tue Thu daytime'},
        ${'8 weeks'},
        ${'Dementia care experience required'},
        ${['Dementia Care', 'Elderly Care']},
        ${now}
      ),
      (
        ${'c4040404-4040-4404-8404-404040404040'},
        ${'b6666666-6666-4666-8666-666666666666'},
        ${'Companionship visits'},
        ${'Austin, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'austin', address_line: null, postal_code: '78758' }},
        ${'Weekend mornings'},
        ${'4 weeks'},
        ${'Friendly and social caregiver preferred'},
        ${['Companionship']},
        ${now}
      ),
      (
        ${'c5050505-5050-4505-8505-505050505050'},
        ${'b7777777-7777-4777-8777-777777777777'},
        ${'Post-surgery home recovery'},
        ${'San Antonio, TX'},
        ${{ country_code: 'US', state_or_province: 'TX', city: 'san antonio', address_line: null, postal_code: '78207' }},
        ${'Evenings'},
        ${'6 weeks'},
        ${'Mobility and post-op support needed'},
        ${['Post-surgery Support', 'Mobility Assistance']},
        ${now}
      )
    `;

    await tx`
      INSERT INTO matches (id, care_request_id, caregiver_id, matched_at) VALUES
      (${ 'd1111111-1111-4111-8111-111111111111' }, ${ 'c1010101-1010-4101-8101-101010101010' }, ${ 'a1111111-1111-4111-8111-111111111111' }, ${now}),
      (${ 'd2222222-2222-4222-8222-222222222222' }, ${ 'c1010101-1010-4101-8101-101010101010' }, ${ 'a5555555-5555-4555-8555-555555555555' }, ${now}),
      (${ 'd3333333-3333-4333-8333-333333333333' }, ${ 'c2020202-2020-4202-8202-202020202020' }, ${ 'a2222222-2222-4222-8222-222222222222' }, ${now}),
      (${ 'd4444444-4444-4444-8444-444444444444' }, ${ 'c3030303-3030-4303-8303-303030303030' }, ${ 'a3333333-3333-4333-8333-333333333333' }, ${now}),
      (${ 'd5555555-5555-4555-8555-555555555555' }, ${ 'c4040404-4040-4404-8404-404040404040' }, ${ 'a5555555-5555-4555-8555-555555555555' }, ${now}),
      (${ 'd6666666-6666-4666-8666-666666666666' }, ${ 'c5050505-5050-4505-8505-505050505050' }, ${ 'a4444444-4444-4444-8444-444444444444' }, ${now})
    `;

    await tx`
      INSERT INTO job_accept_requests (
        id, care_request_id, caregiver_id, status, created_at, responded_at
      ) VALUES
      (${ 'e1111111-1111-4111-8111-111111111111' }, ${ 'c1010101-1010-4101-8101-101010101010' }, ${ 'a1111111-1111-4111-8111-111111111111' }, ${'accepted'}, ${now}, ${now}),
      (${ 'e2222222-2222-4222-8222-222222222222' }, ${ 'c2020202-2020-4202-8202-202020202020' }, ${ 'a2222222-2222-4222-8222-222222222222' }, ${'pending'}, ${now}, ${null}),
      (${ 'e3333333-3333-4333-8333-333333333333' }, ${ 'c3030303-3030-4303-8303-303030303030' }, ${ 'a3333333-3333-4333-8333-333333333333' }, ${'declined'}, ${now}, ${now})
    `;
  });

  logger.info('Dummy seed completed successfully.');
}

async function main(): Promise<void> {
  try {
    await seedDummyData();
  } catch (error) {
    logger.error(`Dummy seed failed: ${error}`);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

void main();
