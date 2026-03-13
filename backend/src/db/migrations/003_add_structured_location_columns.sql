ALTER TABLE caregiver_profiles
ADD COLUMN IF NOT EXISTS location_details JSONB,
ADD COLUMN IF NOT EXISTS service_area_details JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE care_requests
ADD COLUMN IF NOT EXISTS service_location_details JSONB;

UPDATE caregiver_profiles
SET location_details = jsonb_build_object(
  'country_code', 'US',
  'state_or_province', UPPER(split_part(split_part(location, ',', 2), ' ', 1)),
  'city', LOWER(split_part(location, ',', 1)),
  'address_line', NULL,
  'postal_code', NULLIF(trim(substring(split_part(location, ',', 2) from '^[^ ]+\\s+(.*)$')), '')
)
WHERE location_details IS NULL
  AND position(',' in location) > 0
  AND length(trim(split_part(location, ',', 1))) > 0
  AND length(trim(split_part(location, ',', 2))) > 0;

UPDATE care_requests
SET service_location_details = jsonb_build_object(
  'country_code', 'US',
  'state_or_province', UPPER(split_part(split_part(service_location, ',', 2), ' ', 1)),
  'city', LOWER(split_part(service_location, ',', 1)),
  'address_line', NULL,
  'postal_code', NULLIF(trim(substring(split_part(service_location, ',', 2) from '^[^ ]+\\s+(.*)$')), '')
)
WHERE service_location_details IS NULL
  AND position(',' in service_location) > 0
  AND length(trim(split_part(service_location, ',', 1))) > 0
  AND length(trim(split_part(service_location, ',', 2))) > 0;

WITH caregiver_service_areas AS (
  SELECT
    cp.id AS caregiver_id,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'country_code', 'US',
          'state_or_province', UPPER(split_part(split_part(area, ',', 2), ' ', 1)),
          'city', LOWER(split_part(area, ',', 1)),
          'address_line', NULL,
          'postal_code', NULLIF(trim(substring(split_part(area, ',', 2) from '^[^ ]+\\s+(.*)$')), '')
        )
      ) FILTER (WHERE position(',' in area) > 0),
      '[]'::JSONB
    ) AS details
  FROM caregiver_profiles cp
  LEFT JOIN LATERAL unnest(cp.service_areas) AS area ON true
  GROUP BY cp.id
)
UPDATE caregiver_profiles cp
SET service_area_details = csa.details
FROM caregiver_service_areas csa
WHERE cp.id = csa.caregiver_id
  AND (cp.service_area_details IS NULL OR cp.service_area_details = '[]'::JSONB);

CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_location_details_state
  ON caregiver_profiles ((location_details->>'country_code'), (location_details->>'state_or_province'));

CREATE INDEX IF NOT EXISTS idx_care_requests_service_location_details_state
  ON care_requests ((service_location_details->>'country_code'), (service_location_details->>'state_or_province'));
