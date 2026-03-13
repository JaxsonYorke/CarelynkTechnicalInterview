export const firstRowOrNull = <T>(rows: T[]): T | null => {
  return rows.length > 0 ? rows[0] : null;
};
