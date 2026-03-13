import { getDatabase } from '../../db/connection';
import { User } from '../../types';

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
    return result.length > 0 ? result[0] : null;
  },

  async findById(id: string): Promise<User | null> {
    const db = getDatabase();
    const result = await db<User[]>`
      SELECT * FROM users WHERE id = ${id}
    `;
    return result.length > 0 ? result[0] : null;
  },

  async findByIdAndRole(id: string, role: string): Promise<User | null> {
    const db = getDatabase();
    const result = await db<User[]>`
      SELECT * FROM users WHERE id = ${id} AND role = ${role}
    `;
    return result.length > 0 ? result[0] : null;
  },
};
