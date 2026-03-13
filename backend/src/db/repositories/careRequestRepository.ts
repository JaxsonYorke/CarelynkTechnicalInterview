import { getDatabase } from '../../db/connection';
import { CareRequest, StructuredLocation } from '../../types';
import { firstRowOrNull } from './helpers';

export const careRequestRepository = {
  async create(
    careSeekerProfileId: string,
    careType: string,
    serviceLocation: string,
    serviceLocationDetails: StructuredLocation | null,
    schedule: string,
    duration?: string,
    preferences?: string,
    requiredExperiences: string[] = []
  ): Promise<CareRequest> {
    const db = getDatabase();
    const result = await db<CareRequest[]>`
      INSERT INTO care_requests 
      (care_seeker_id, care_type, service_location, service_location_details, schedule, duration, preferences, required_experiences)
      VALUES (${careSeekerProfileId}, ${careType}, ${serviceLocation}, ${serviceLocationDetails ? JSON.stringify(serviceLocationDetails) : null}::jsonb, ${schedule}, ${duration || null}, ${preferences || null}, ${db.array(requiredExperiences)})
      RETURNING *
    `;
    return result[0];
  },

  async findById(id: string): Promise<CareRequest | null> {
    const db = getDatabase();
    const result = await db<CareRequest[]>`
      SELECT * FROM care_requests WHERE id = ${id}
    `;
    return firstRowOrNull(result);
  },

  async findByCareSeekerProfileId(careSeekerProfileId: string): Promise<CareRequest[]> {
    const db = getDatabase();
    return db<CareRequest[]>`
      SELECT * FROM care_requests WHERE care_seeker_id = ${careSeekerProfileId}
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

  async updateById(
    id: string,
    careType: string,
    serviceLocation: string,
    serviceLocationDetails: StructuredLocation | null,
    schedule: string,
    duration?: string,
    preferences?: string,
    requiredExperiences: string[] = []
  ): Promise<CareRequest | null> {
    const db = getDatabase();
    const result = await db<CareRequest[]>`
      UPDATE care_requests
      SET
        care_type = ${careType},
        service_location = ${serviceLocation},
        service_location_details = ${serviceLocationDetails ? JSON.stringify(serviceLocationDetails) : null}::jsonb,
        schedule = ${schedule},
        duration = ${duration || null},
        preferences = ${preferences || null},
        required_experiences = ${db.array(requiredExperiences)}
      WHERE id = ${id}
      RETURNING *
    `;
    return firstRowOrNull(result);
  },

  async deleteById(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db`
      DELETE FROM care_requests
      WHERE id = ${id}
    `;
    return result.count > 0;
  },
};
