import { getDatabase } from '../../db/connection';
import { ExperienceOption } from '../../types';

export const experienceOptionRepository = {
  async findAll(): Promise<ExperienceOption[]> {
    const db = getDatabase();
    return db<ExperienceOption[]>`
      SELECT *
      FROM experience_options
      ORDER BY label ASC
    `;
  },

  async findByLabels(labels: string[]): Promise<ExperienceOption[]> {
    if (labels.length === 0) {
      return [];
    }

    const normalizedLabels = labels
      .map((label) => label.trim().toLowerCase())
      .filter((label) => label.length > 0);

    if (normalizedLabels.length === 0) {
      return [];
    }

    const db = getDatabase();
    return db<ExperienceOption[]>`
      SELECT *
      FROM experience_options
      WHERE normalized_label = ANY(${db.array(normalizedLabels)}::TEXT[])
      ORDER BY label ASC
    `;
  },

  async create(label: string, createdByUserId: string): Promise<ExperienceOption> {
    const normalizedLabel = label.trim().toLowerCase();
    const canonicalLabel = label.trim();
    const db = getDatabase();

    const rows = await db<ExperienceOption[]>`
      INSERT INTO experience_options (label, normalized_label, created_by_user_id)
      VALUES (${canonicalLabel}, ${normalizedLabel}, ${createdByUserId})
      ON CONFLICT (normalized_label)
      DO UPDATE SET label = experience_options.label
      RETURNING *
    `;

    return rows[0];
  },
};
