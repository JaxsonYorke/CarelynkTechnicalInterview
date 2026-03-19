-- Allow multiple accept requests per care request (one per caregiver)
-- Previously: one accept request per care request (UNIQUE on care_request_id)
-- Now: multiple accept requests per care request (UNIQUE on care_request_id, caregiver_id)

-- Drop the old UNIQUE constraint on care_request_id
ALTER TABLE job_accept_requests
DROP CONSTRAINT IF EXISTS job_accept_requests_care_request_id_key;

-- Add new composite UNIQUE constraint to prevent duplicate requests to same caregiver
-- but allow multiple requests to different caregivers for the same job
-- Using a conditional approach to avoid errors if constraint already exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'job_accept_requests_unique_per_caregiver'
      AND table_name = 'job_accept_requests'
  ) THEN
    ALTER TABLE job_accept_requests
    ADD CONSTRAINT job_accept_requests_unique_per_caregiver
    UNIQUE (care_request_id, caregiver_id);
  END IF;
END $$;

-- Add index for faster lookups by care_request_id (now that it's not unique)
CREATE INDEX IF NOT EXISTS idx_job_accept_requests_care_request_id
ON job_accept_requests (care_request_id);
