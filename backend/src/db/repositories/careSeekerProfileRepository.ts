import { getDatabase } from '../../db/connection';
import { CareSeekerProfile } from '../../types';
import { firstRowOrNull } from './helpers';

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
    return firstRowOrNull(result);
  },

  async findById(id: string): Promise<CareSeekerProfile | null> {
    const db = getDatabase();
    const result = await db<CareSeekerProfile[]>`
      SELECT * FROM care_seeker_profiles WHERE id = ${id}
    `;
    return firstRowOrNull(result);
  },

  async update(
    userId: string,
    data: Partial<Omit<CareSeekerProfile, 'id' | 'user_id' | 'created_at'>>
  ): Promise<CareSeekerProfile | null> {
    const db = getDatabase();
    const currentProfile = await this.findByUserId(userId);
    if (!currentProfile) {
      return null;
    }

    const nextName = data.name ?? currentProfile.name;
    const nextContactInfo = data.contact_info ?? currentProfile.contact_info;
    const nextLocation = data.location ?? currentProfile.location;

    const result = await db<CareSeekerProfile[]>`
      UPDATE care_seeker_profiles 
      SET
        name = ${nextName},
        contact_info = ${nextContactInfo},
        location = ${nextLocation}
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return firstRowOrNull(result);
  },
};
