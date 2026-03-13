# Carelynk Homecare MVP  
**Candidate Take-Home Test**

---

## Role Focus
**Full-stack Web Development**

## Stack
- **Backend:** Node.js + TypeScript  
- **Database:** PostgreSQL  
- **Frontend:** React.js + TypeScript  

---

## Goal
Build a small two-portal homecare onboarding and matching MVP.

---

## Overview
Build a simple Homecare platform MVP with two separate web portals:
- One for the **Care Seeker**
- One for the **Caregiver**

The application should support:
- Caregiver onboarding
- Care seeker onboarding
- Care request / job creation
- Basic caregiver matching  

Messaging, payments, and advanced workflow features are **not required** for this assignment. :contentReference[oaicite:0]{index=0}

---

## Functional Scope

### 1. Caregiver Portal
A caregiver should be able to:
- Sign up and log in
- Complete an onboarding flow

The onboarding flow should capture:
- Name
- Contact information
- Location
- Skills
- Relevant care experience
- Availability
- Qualifications or certifications (optional)

Once completed, the caregiver profile should become available for matching.

---

### 2. Care Seeker Portal
A care seeker should be able to:
- Sign up and log in
- Complete a basic profile
- Create a care request / job

A care request should include:
- Type of care needed
- Service location
- Preferred schedule
- Duration or frequency
- Special preferences or notes

---

### 3. Matching
After a care request is created, the system should identify and display suitable caregivers.

At a minimum, matching should consider:
- Location
- Availability
- Relevant skills or experience

The care seeker should be able to view a list of matched caregivers for a given request.

---

## Core Requirements

| Module | Required Capability | Notes |
|------|-------------------|-------|
| Auth | Separate login/registration flows for care seekers and caregivers | Single codebase is fine; portals must be clearly separated in the UI |
| Caregiver Profile | Create, edit, and save caregiver onboarding details | Use sensible validation and form handling |
| Care Seeker Profile | Create and save care seeker details | Keep the profile simple but usable |
| Job Creation | Care seeker can create a care request/job | Include care type, location, schedule, notes/preferences |
| Matching | Show matched caregivers for a job | Simple rule-based matching is acceptable |
| Data Storage | Persist users, jobs, and matchable caregiver info in PostgreSQL | Schema design is part of the evaluation |
| UI/UX | Readable, organized, and easy to navigate | Clean, practical UI is more important than heavy styling |

---

## Technical Expectations
- Node.js with TypeScript (backend)
- PostgreSQL (database)
- React.js with TypeScript (frontend)
- Clear API structure and reasonable code organization
- Basic validation and error handling
- Clean, well-designed database schema
- Readable README with setup steps and assumptions

---

## Submission Deliverables
- Source code for frontend and backend
- Database schema or migration files
- Short README with setup instructions
- Brief explanation of matching logic and major assumptions
- Sample data or demo credentials (if applicable)

---

## Evaluation Criteria

| Area | What We Will Look For |
|-----|------------------------|
| Completeness | Coverage of onboarding, job creation, and matching |
| Code Quality | Organized, readable, maintainable code |
| Backend Design | Sensible APIs, data models, and persistence |
| Frontend Quality | Clear, usable, well-structured portals |
| Problem Solving | Practical assumptions with clear explanations |