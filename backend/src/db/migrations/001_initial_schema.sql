-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('caregiver', 'care_seeker')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Caregiver Profiles
CREATE TABLE IF NOT EXISTS caregiver_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  contact_info VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL,
  skills TEXT[] NOT NULL,
  experience TEXT,
  availability TEXT NOT NULL,
  qualifications TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Care Seeker Profiles
CREATE TABLE IF NOT EXISTS care_seeker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  contact_info VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Care Requests/Jobs
CREATE TABLE IF NOT EXISTS care_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  care_seeker_id UUID NOT NULL REFERENCES care_seeker_profiles(id) ON DELETE CASCADE,
  care_type VARCHAR(100) NOT NULL,
  service_location VARCHAR(100) NOT NULL,
  schedule TEXT NOT NULL,
  duration VARCHAR(50),
  preferences TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  care_request_id UUID NOT NULL REFERENCES care_requests(id) ON DELETE CASCADE,
  caregiver_id UUID NOT NULL REFERENCES caregiver_profiles(id) ON DELETE CASCADE,
  matched_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_user_id ON caregiver_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_profiles_location ON caregiver_profiles(location);
CREATE INDEX IF NOT EXISTS idx_care_seeker_profiles_user_id ON care_seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_care_seeker_profiles_location ON care_seeker_profiles(location);
CREATE INDEX IF NOT EXISTS idx_care_requests_care_seeker_id ON care_requests(care_seeker_id);
CREATE INDEX IF NOT EXISTS idx_care_requests_service_location ON care_requests(service_location);
CREATE INDEX IF NOT EXISTS idx_matches_care_request_id ON matches(care_request_id);
CREATE INDEX IF NOT EXISTS idx_matches_caregiver_id ON matches(caregiver_id);
