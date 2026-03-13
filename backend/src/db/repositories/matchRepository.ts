import { getDatabase } from '../../db/connection';
import { Match } from '../../types';

export const matchRepository = {
  async create(careRequestId: string, caregiverId: string): Promise<Match> {
    const db = getDatabase();
    const result = await db<Match[]>`
      INSERT INTO matches (care_request_id, caregiver_id)
      VALUES (${careRequestId}, ${caregiverId})
      RETURNING *
    `;
    return result[0];
  },

  async findByRequestId(careRequestId: string): Promise<Match[]> {
    const db = getDatabase();
    return db<Match[]>`
      SELECT * FROM matches WHERE care_request_id = ${careRequestId}
      ORDER BY matched_at DESC
    `;
  },

  async findByCaregiverId(caregiverId: string): Promise<Match[]> {
    const db = getDatabase();
    return db<Match[]>`
      SELECT * FROM matches WHERE caregiver_id = ${caregiverId}
      ORDER BY matched_at DESC
    `;
  },

  async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db`
      DELETE FROM matches WHERE id = ${id}
    `;
    return result.count > 0;
  },
};
