import { getDatabase } from '../../db/connection';
import { CareRequest } from '../../types';

export const careRequestRepository = {
  async create(
    careSeekerProfileId: string,
    careType: string,
    serviceLocation: string,
    schedule: string,
    duration?: string,
    preferences?: string
  ): Promise<CareRequest> {
    const db = getDatabase();
    const result = await db<CareRequest[]>`
      INSERT INTO care_requests 
      (care_seeker_id, care_type, service_location, schedule, duration, preferences)
      VALUES (${careSeekerProfileId}, ${careType}, ${serviceLocation}, ${schedule}, ${duration || null}, ${preferences || null})
      RETURNING *
    `;
    return result[0];
  },

  async findById(id: string): Promise<CareRequest | null> {
    const db = getDatabase();
    const result = await db<CareRequest[]>`
      SELECT * FROM care_requests WHERE id = ${id}
    `;
    return result.length > 0 ? result[0] : null;
  },

  async findByCareSeekerProfileId(careSeekerProfileId: string): Promise<CareRequest[]> {
    const db = getDatabase();
    return db<CareRequest[]>`
      SELECT * FROM care_requests WHERE care_seeker_id = ${careSeekerProfileId}
      ORDER BY created_at DESC
    `;
  },

  async findByLocation(location: string): Promise<CareRequest[]> {
    const db = getDatabase();
    return db<CareRequest[]>`
      SELECT * FROM care_requests WHERE service_location = ${location}
      ORDER BY created_at DESC
    `;
  },

  async findAll(): Promise<CareRequest[]> {
    const db = getDatabase();
    return db<CareRequest[]>`
      SELECT * FROM care_requests
      ORDER BY created_at DESC
    `;
  },
};
