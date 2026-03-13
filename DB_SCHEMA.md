# Carelynk Homecare MVP Database Schema
This was the oriiginal schema, then it was amended to as the project went on.


## Users
| Column         | Type         | Constraints                | Description                  |
|---------------|--------------|----------------------------|------------------------------|
| id            | UUID         | PK, auto-generated         | Unique user ID               |
| email         | VARCHAR(255) | UNIQUE, NOT NULL           | User email                   |
| password_hash | VARCHAR(255) | NOT NULL                   | Hashed password              |
| role          | VARCHAR(20)  | NOT NULL                   | 'caregiver' or 'care_seeker' |
| created_at    | TIMESTAMP    | DEFAULT now()              | Account creation time        |

## CaregiverProfiles
| Column           | Type         | Constraints                | Description                  |
|------------------|--------------|----------------------------|------------------------------|
| id               | UUID         | PK, auto-generated         | Unique profile ID            |
| user_id          | UUID         | FK -> Users(id), NOT NULL  | Linked user                  |
| name             | VARCHAR(100) | NOT NULL                   | Caregiver name               |
| contact_info     | VARCHAR(255) | NOT NULL                   | Phone/email                  |
| location         | VARCHAR(100) | NOT NULL                   | City/region                  |
| location_details | JSONB        |                            | Structured location (country/state/city/address/postal) |
| skills           | TEXT[]       | NOT NULL                   | Array of skills              |
| experience_tags  | TEXT[]       | NOT NULL, DEFAULT '{}'     | Selected experience options for seeker filtering |
| experience       | TEXT         |                            | Relevant experience          |
| availability     | TEXT         | NOT NULL                   | Availability description      |
| qualifications   | TEXT         |                            | Certifications (optional)     |
| matching_status  | TEXT         | NOT NULL, DEFAULT 'succeeded' | Latest caregiver rematch status (`queued`, `running`, `succeeded`, `failed`) |
| matching_error   | TEXT         |                            | Last rematch failure message (if any) |
| matching_updated_at | TIMESTAMP |                            | Timestamp for latest rematch status update |
| created_at       | TIMESTAMP    | DEFAULT now()              | Profile creation time        |

## CareSeekerProfiles
| Column           | Type         | Constraints                | Description                  |
|------------------|--------------|----------------------------|------------------------------|
| id               | UUID         | PK, auto-generated         | Unique profile ID            |
| user_id          | UUID         | FK -> Users(id), NOT NULL  | Linked user                  |
| name             | VARCHAR(100) | NOT NULL                   | Care seeker name             |
| contact_info     | VARCHAR(255) | NOT NULL                   | Phone/email                  |
| location         | VARCHAR(100) | NOT NULL                   | City/region                  |
| created_at       | TIMESTAMP    | DEFAULT now()              | Profile creation time        |

## CareRequests
| Column           | Type         | Constraints                | Description                  |
|------------------|--------------|----------------------------|------------------------------|
| id               | UUID         | PK, auto-generated         | Unique request ID            |
| care_seeker_id   | UUID         | FK -> CareSeekerProfiles(id), NOT NULL | Linked care seeker |
| care_type        | VARCHAR(100) | NOT NULL                   | Type of care needed          |
| service_location | VARCHAR(100) | NOT NULL                   | Location for service         |
| service_location_details | JSONB |                            | Structured service location (country/state/city/address/postal) |
| schedule         | TEXT         | NOT NULL                   | Preferred schedule           |
| duration         | VARCHAR(50)  |                            | Duration/frequency           |
| preferences      | TEXT         |                            | Special preferences/notes    |
| required_experiences | TEXT[]   | NOT NULL, DEFAULT '{}'     | Selectable experiences required by seeker |
| created_at       | TIMESTAMP    | DEFAULT now()              | Request creation time        |

## Matches
| Column           | Type         | Constraints                | Description                  |
|------------------|--------------|----------------------------|------------------------------|
| id               | UUID         | PK, auto-generated         | Unique match ID              |
| care_request_id  | UUID         | FK -> CareRequests(id), NOT NULL | Linked care request   |
| caregiver_id     | UUID         | FK -> CaregiverProfiles(id), NOT NULL | Matched caregiver |
| matched_at       | TIMESTAMP    | DEFAULT now()              | Match creation time          |

## ExperienceOptions
| Column             | Type      | Constraints                              | Description                              |
|--------------------|-----------|-------------------------------------------|------------------------------------------|
| id                 | UUID      | PK, auto-generated                        | Unique option ID                         |
| label              | TEXT      | NOT NULL                                  | Display label for experience option      |
| normalized_label   | TEXT      | UNIQUE, NOT NULL                          | Lowercased trimmed value for dedupe      |
| created_by_user_id | UUID      | FK -> Users(id), nullable                 | Caregiver user that added the option     |
| created_at         | TIMESTAMP | DEFAULT now()                             | Option creation time                     |

---
