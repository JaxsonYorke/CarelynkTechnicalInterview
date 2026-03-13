import { getDatabase } from '../../db/connection';
import { Match } from '../../types';
import { firstRowOrNull } from './helpers';

export const matchRepository = {
  async create(careRequestId: string, caregiverId: string): Promise<Match | null> {
    const db = getDatabase();
    const result = await db<Match[]>`
      INSERT INTO matches (care_request_id, caregiver_id)
      VALUES (${careRequestId}, ${caregiverId})
      ON CONFLICT (care_request_id, caregiver_id) DO NOTHING
      RETURNING *
    `;
    return firstRowOrNull(result);
  },

  async createMany(careRequestId: string, caregiverIds: string[]): Promise<Match[]> {
    const createdMatches: Match[] = [];

    for (const caregiverId of caregiverIds) {
      const createdMatch = await this.create(careRequestId, caregiverId);
      if (createdMatch) {
        createdMatches.push(createdMatch);
      }
    }

    return createdMatches;
  },

  async findByRequestId(careRequestId: string): Promise<Match[]> {
    const db = getDatabase();
    return db<Match[]>`
      SELECT * FROM matches WHERE care_request_id = ${careRequestId}
      ORDER BY matched_at DESC
    `;
  },

  async findByRequestAndCaregiver(
    careRequestId: string,
    caregiverId: string
  ): Promise<Match | null> {
    const db = getDatabase();
    const result = await db<Match[]>`
      SELECT * FROM matches
      WHERE care_request_id = ${careRequestId}
        AND caregiver_id = ${caregiverId}
      LIMIT 1
    `;
    return firstRowOrNull(result);
  },

  async findByCaregiverId(caregiverId: string): Promise<Match[]> {
    const db = getDatabase();
    return db<Match[]>`
      SELECT * FROM matches WHERE caregiver_id = ${caregiverId}
      ORDER BY matched_at DESC
    `;
  },

  async deleteByRequestId(careRequestId: string): Promise<number> {
    const db = getDatabase();
    const result = await db`
      DELETE FROM matches
      WHERE care_request_id = ${careRequestId}
    `;
    return result.count;
  },
};
