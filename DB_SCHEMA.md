# Carelynk Homecare MVP Database Schema

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
| skills           | TEXT[]       | NOT NULL                   | Array of skills              |
| experience       | TEXT         |                            | Relevant experience          |
| availability     | TEXT         | NOT NULL                   | Availability description      |
| qualifications   | TEXT         |                            | Certifications (optional)     |
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
| schedule         | TEXT         | NOT NULL                   | Preferred schedule           |
| duration         | VARCHAR(50)  |                            | Duration/frequency           |
| preferences      | TEXT         |                            | Special preferences/notes    |
| created_at       | TIMESTAMP    | DEFAULT now()              | Request creation time        |

## Matches
| Column           | Type         | Constraints                | Description                  |
|------------------|--------------|----------------------------|------------------------------|
| id               | UUID         | PK, auto-generated         | Unique match ID              |
| care_request_id  | UUID         | FK -> CareRequests(id), NOT NULL | Linked care request   |
| caregiver_id     | UUID         | FK -> CaregiverProfiles(id), NOT NULL | Matched caregiver |
| matched_at       | TIMESTAMP    | DEFAULT now()              | Match creation time          |

---

- All UUIDs can be generated with gen_random_uuid() or similar.
- Use TEXT[] for skills if using Postgres, or a join table for more normalization.
- Passwords should be securely hashed.
- Add indexes to email, user_id, and foreign keys for performance.
