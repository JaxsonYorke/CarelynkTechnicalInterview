import { getDatabase } from '../../db/connection';
import { CareSeekerProfile } from '../../types';

export const careSeekerProfileRepository = {
  async create(
    userId: string,
    name: string,
    contactInfo: string,
    location: string
  ): Promise<CareSeekerProfile> {
    const db = getDatabase();
    const result = await db<CareSeekerProfile[]>`
      INSERT INTO care_seeker_profiles (user_id, name, contact_info, location)
      VALUES (${userId}, ${name}, ${contactInfo}, ${location})
      RETURNING *
    `;
    return result[0];
  },

  async findByUserId(userId: string): Promise<CareSeekerProfile | null> {
    const db = getDatabase();
    const result = await db<CareSeekerProfile[]>`
      SELECT * FROM care_seeker_profiles WHERE user_id = ${userId}
    `;
    return result.length > 0 ? result[0] : null;
  },

  async findById(id: string): Promise<CareSeekerProfile | null> {
    const db = getDatabase();
    const result = await db<CareSeekerProfile[]>`
      SELECT * FROM care_seeker_profiles WHERE id = ${id}
    `;
    return result.length > 0 ? result[0] : null;
  },

  async update(
    userId: string,
    data: Partial<Omit<CareSeekerProfile, 'id' | 'user_id' | 'created_at'>>
  ): Promise<CareSeekerProfile | null> {
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

    if (updates.length === 0) return this.findByUserId(userId);

    const result = await db<CareSeekerProfile[]>`
      UPDATE care_seeker_profiles 
      SET ${db.unsafe(updates.join(', '))}
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return result.length > 0 ? result[0] : null;
  },
};
