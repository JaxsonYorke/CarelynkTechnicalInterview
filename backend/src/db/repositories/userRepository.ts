import { getDatabase } from '../../db/connection';
import { User } from '../../types';
import { firstRowOrNull } from './helpers';

export const userRepository = {
  async create(email: string, passwordHash: string, role: 'caregiver' | 'care_seeker'): Promise<User> {
    const db = getDatabase();
    const result = await db<User[]>`
      INSERT INTO users (email, password_hash, role)
      VALUES (${email}, ${passwordHash}, ${role})
      RETURNING *
    `;
    return result[0];
  },

  async findByEmail(email: string): Promise<User | null> {
    const db = getDatabase();
    const result = await db<User[]>`
      SELECT * FROM users WHERE email = ${email}
    `;
    return firstRowOrNull(result);
  },

  async findById(id: string): Promise<User | null> {
    const db = getDatabase();
    const result = await db<User[]>`
      SELECT * FROM users WHERE id = ${id}
    `;
    return firstRowOrNull(result);
  },
};
