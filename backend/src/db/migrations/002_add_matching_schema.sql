ALTER TABLE care_requests
ADD COLUMN IF NOT EXISTS required_experiences TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS service_areas TEXT[] NOT NULL DEFAULT '{}'::TEXT[];
