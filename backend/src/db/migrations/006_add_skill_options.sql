CREATE TABLE IF NOT EXISTS skill_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  normalized_label TEXT NOT NULL UNIQUE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_options_label
ON skill_options (label);

INSERT INTO skill_options (label, normalized_label)
SELECT DISTINCT INITCAP(trim(value)), lower(trim(value))
FROM (
  SELECT unnest(skills) AS value
  FROM caregiver_profiles
) options
WHERE value IS NOT NULL AND trim(value) <> ''
ON CONFLICT (normalized_label) DO NOTHING;
