import { getDatabase } from '../../db/connection';
import { CaregiverProfile } from '../../types';

export const caregiverProfileRepository = {
  async create(
    userId: string,
    name: string,
    contactInfo: string,
    location: string,
    skills: string[],
    availability: string,
    experience?: string,
    qualifications?: string
  ): Promise<CaregiverProfile> {
    const db = getDatabase();
    const result = await db<CaregiverProfile[]>`
      INSERT INTO caregiver_profiles 
      (user_id, name, contact_info, location, skills, experience, availability, qualifications)
      VALUES (${userId}, ${name}, ${contactInfo}, ${location}, ${db.array(skills)}, ${experience || null}, ${availability}, ${qualifications || null})
      RETURNING *
    `;
    return result[0];
  },

  async findByUserId(userId: string): Promise<CaregiverProfile | null> {
    const db = getDatabase();
    const result = await db<CaregiverProfile[]>`
      SELECT * FROM caregiver_profiles WHERE user_id = ${userId}
    `;
    return result.length > 0 ? result[0] : null;
  },

  async findById(id: string): Promise<CaregiverProfile | null> {
    const db = getDatabase();
    const result = await db<CaregiverProfile[]>`
      SELECT * FROM caregiver_profiles WHERE id = ${id}
    `;
    return result.length > 0 ? result[0] : null;
  },

  async update(
    userId: string,
    data: Partial<Omit<CaregiverProfile, 'id' | 'user_id' | 'created_at'>>
  ): Promise<CaregiverProfile | null> {
    const db = getDatabase();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      updates.push(`name = $${updates.length + 1}`);
      values.push(data.name);
    }
    if (data.contact_info !== undefined) {
      updates.push(`contact_info = $${updates.length + 1}`);
      values.push(data.contact_info);
    }
    if (data.location !== undefined) {
      updates.push(`location = $${updates.length + 1}`);
      values.push(data.location);
    }
    if (data.skills !== undefined) {
      updates.push(`skills = $${updates.length + 1}`);
      values.push(data.skills);
    }
    if (data.experience !== undefined) {
      updates.push(`experience = $${updates.length + 1}`);
      values.push(data.experience);
    }
    if (data.availability !== undefined) {
      updates.push(`availability = $${updates.length + 1}`);
      values.push(data.availability);
    }
    if (data.qualifications !== undefined) {
      updates.push(`qualifications = $${updates.length + 1}`);
      values.push(data.qualifications);
    }

    if (updates.length === 0) return this.findByUserId(userId);

    const result = await db<CaregiverProfile[]>`
      UPDATE caregiver_profiles 
      SET ${db.unsafe(updates.join(', '))}
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return result.length > 0 ? result[0] : null;
  },

  async findByLocation(location: string): Promise<CaregiverProfile[]> {
    const db = getDatabase();
    return db<CaregiverProfile[]>`
      SELECT * FROM caregiver_profiles WHERE location = ${location}
    `;
  },
};
