ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS matching_status TEXT NOT NULL DEFAULT 'succeeded';

ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS matching_error TEXT;

ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS matching_updated_at TIMESTAMP;

UPDATE caregiver_profiles
SET
  matching_status = COALESCE(matching_status, 'succeeded'),
  matching_error = NULL,
  matching_updated_at = COALESCE(matching_updated_at, NOW())
WHERE matching_status IS NULL OR matching_updated_at IS NULL;
