CREATE TABLE IF NOT EXISTS job_accept_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  care_request_id UUID NOT NULL UNIQUE REFERENCES care_requests(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES caregiver_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_accept_requests_caregiver_id
ON job_accept_requests (caregiver_id);

CREATE INDEX IF NOT EXISTS idx_job_accept_requests_status
ON job_accept_requests (status);
