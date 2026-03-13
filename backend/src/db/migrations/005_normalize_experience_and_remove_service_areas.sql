ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS experience_tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

CREATE TABLE IF NOT EXISTS experience_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  normalized_label TEXT NOT NULL UNIQUE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experience_options_label
ON experience_options (label);

INSERT INTO experience_options (label, normalized_label)
SELECT DISTINCT INITCAP(trim(value)), lower(trim(value))
FROM (
  SELECT unnest(required_experiences) AS value FROM care_requests
  UNION ALL
  SELECT unnest(skills) AS value FROM caregiver_profiles
  UNION ALL
  SELECT unnest(experience_tags) AS value FROM caregiver_profiles
  UNION ALL
  SELECT unnest(ARRAY[
    'Elderly care',
    'Childcare',
    'Medication management',
    'Post-surgery support',
    'Mobility assistance',
    'Dementia care',
    'Meal preparation',
    'Companionship'
  ]::TEXT[]) AS value
) options
WHERE value IS NOT NULL AND trim(value) <> ''
ON CONFLICT (normalized_label) DO NOTHING;

UPDATE caregiver_profiles
SET experience_tags = (
  SELECT COALESCE(array_agg(DISTINCT eo.label ORDER BY eo.label), '{}'::TEXT[])
  FROM experience_options eo
  WHERE eo.normalized_label = ANY (
    ARRAY(
      SELECT lower(trim(value))
      FROM unnest(COALESCE(caregiver_profiles.experience_tags, '{}'::TEXT[]) || COALESCE(caregiver_profiles.skills, '{}'::TEXT[])) AS value
      WHERE trim(value) <> ''
    )
  )
);

UPDATE care_requests
SET required_experiences = (
  SELECT COALESCE(array_agg(DISTINCT eo.label ORDER BY eo.label), '{}'::TEXT[])
  FROM experience_options eo
  WHERE eo.normalized_label = ANY (
    ARRAY(
      SELECT lower(trim(value))
      FROM unnest(COALESCE(care_requests.required_experiences, '{}'::TEXT[])) AS value
      WHERE trim(value) <> ''
    )
  )
);

ALTER TABLE caregiver_profiles
DROP COLUMN IF EXISTS service_areas,
DROP COLUMN IF EXISTS service_area_details;
