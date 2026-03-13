import { getDatabase } from '../../db/connection';
import { CaregiverProfile, StructuredLocation } from '../../types';
import { firstRowOrNull } from './helpers';

export const caregiverProfileRepository = {
  async create(
    userId: string,
    name: string,
    contactInfo: string,
    location: string,
    skills: string[],
    availability: string,
    experience?: string,
    qualifications?: string,
    experienceTags: string[] = [],
    locationDetails?: StructuredLocation | null,
  ): Promise<CaregiverProfile> {
    const db = getDatabase();
    const result = await db<CaregiverProfile[]>`
      INSERT INTO caregiver_profiles 
      (user_id, name, contact_info, location, skills, experience_tags, experience, availability, qualifications, location_details)
      VALUES (${userId}, ${name}, ${contactInfo}, ${location}, ${db.array(skills)}, ${db.array(experienceTags)}, ${experience || null}, ${availability}, ${qualifications || null}, ${locationDetails ? JSON.stringify(locationDetails) : null}::jsonb)
      RETURNING *
    `;
    return result[0];
  },

  async findByUserId(userId: string): Promise<CaregiverProfile | null> {
    const db = getDatabase();
    const result = await db<CaregiverProfile[]>`
      SELECT * FROM caregiver_profiles WHERE user_id = ${userId}
    `;
    return firstRowOrNull(result);
  },

  async findById(id: string): Promise<CaregiverProfile | null> {
    const db = getDatabase();
    const result = await db<CaregiverProfile[]>`
      SELECT * FROM caregiver_profiles WHERE id = ${id}
    `;
    return firstRowOrNull(result);
  },

  async update(
    userId: string,
    data: Partial<Omit<CaregiverProfile, 'id' | 'user_id' | 'created_at'>>
  ): Promise<CaregiverProfile | null> {
    const db = getDatabase();
    const currentProfile = await this.findByUserId(userId);
    if (!currentProfile) {
      return null;
    }

    const nextName = data.name !== undefined ? data.name : currentProfile.name;
    const nextContactInfo =
      data.contact_info !== undefined ? data.contact_info : currentProfile.contact_info;
    const nextLocation = data.location !== undefined ? data.location : currentProfile.location;
    const nextSkills = data.skills !== undefined ? data.skills : currentProfile.skills;
    const nextExperienceTags =
      data.experience_tags !== undefined ? data.experience_tags : currentProfile.experience_tags;
    const nextExperience =
      data.experience !== undefined ? data.experience : currentProfile.experience;
    const nextAvailability =
      data.availability !== undefined ? data.availability : currentProfile.availability;
    const nextQualifications =
      data.qualifications !== undefined ? data.qualifications : currentProfile.qualifications;
    const nextLocationDetails =
      data.location_details !== undefined ? data.location_details : currentProfile.location_details;

    const result = await db<CaregiverProfile[]>`
      UPDATE caregiver_profiles 
      SET
        name = ${nextName},
        contact_info = ${nextContactInfo},
        location = ${nextLocation},
        skills = ${db.array(nextSkills)},
        experience_tags = ${db.array(nextExperienceTags)},
        experience = ${nextExperience},
        availability = ${nextAvailability},
        qualifications = ${nextQualifications},
        location_details = ${nextLocationDetails ? JSON.stringify(nextLocationDetails) : null}::jsonb
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return firstRowOrNull(result);
  },

  async findByLocation(location: string): Promise<CaregiverProfile[]> {
    const db = getDatabase();
    return db<CaregiverProfile[]>`
      SELECT * FROM caregiver_profiles WHERE location = ${location}
    `;
  },

  async findAll(): Promise<CaregiverProfile[]> {
    const db = getDatabase();
    return db<CaregiverProfile[]>`
      SELECT * FROM caregiver_profiles
      ORDER BY created_at ASC
    `;
  },

  async findAllByNameOrSkillsQuery(query: string): Promise<CaregiverProfile[]> {
    const db = getDatabase();
    const searchTerm = `%${query}%`;
    return db<CaregiverProfile[]>`
      SELECT *
      FROM caregiver_profiles
      WHERE name ILIKE ${searchTerm}
        OR EXISTS (
          SELECT 1
          FROM unnest(skills) AS skill
          WHERE skill ILIKE ${searchTerm}
        )
      ORDER BY created_at ASC
    `;
  },
};
