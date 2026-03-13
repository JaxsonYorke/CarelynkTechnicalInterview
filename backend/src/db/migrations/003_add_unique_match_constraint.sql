CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_request_caregiver_unique
ON matches (care_request_id, caregiver_id);
