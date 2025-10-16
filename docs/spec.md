# Labradoor — UCLA Undergraduate Lab Openings Platform

## 1) Problem & Goals

**Problem:** Undergrad–lab matching is fragmented (lab sites, cold emails, word of mouth). Labs rarely update openings; students waste time searching and waiting on replies.

**Goal:** A centralized platform where labs post standardized openings and students discover, filter, and apply in one place. Reduce email churn and make review workflows simple.

## 2) Users & Roles

- **Student** (UCLA undergrad): browse/search, save, apply, track status, receive notifications. 

- **Lab Admin** (PI, lab manager, grad/PhD delegate): create and manage postings, review applicants, communicate with candidates.

## 3) Core User Stories (with acceptance criteria)

### 3.1 Student Discovery & Application

**S1. Sign-in with UCLA identity** 

- **AC:** @ucla.edu required to create a Student profile; name + email captured on first login.

**S2. Search and filter openings** by keyword, department, techniques/skills, time commitment, compensation (paid/credit/volunteer), start term.

- **AC:** Combined filters supported; URL reflects filters; result latency P95 < 500 ms for <5k postings.

- **AC:** Required fields enforced; preview matches student view.

**S4. Apply with a lightweight, consistent application** (resume PDF + short questions).

- **AC:** Client/server validation; upload PDF only; application stored with status "Submitted"; success confirmation in UI.

**S5. Track applications in a dashboard.**

- **AC:** List shows posting title, status, last updated; statuses include Submitted, In Review, Interview, Offer, Rejected, Withdrawn.

### 3.2 Lab Admin Posting & Review

**L1. Create, edit, publish, close postings.**

- **AC:** Draft → Published → Closed; clone posting; validation for required fields.

**L2. Review applications in a sortable table** (name, major if provided, skills tags/answers, created date).

- **AC:** Filter by status; bulk shortlist/reject; per-applicant notes; CSV export.

**L3. Change application status and log actions.**

- **AC:** Status transitions update applicant timeline; RBAC ensures only lab owners/editors can modify.

**L4. Manage lab collaborators.**

- **AC:** Add/remove lab members with roles (Owner, Editor, Viewer); audit logged.

### 3.3 Platform Admin & Safety

**A1. Verify labs before they can publish.**

- **AC:** Verification flag toggled by Admin; unverified labs can draft only.

**A2. Moderate reported content.**

- **AC:** Report queue with reason, link to entity, soft delete/restore actions.

## 4) Information Architecture & Data Model 

**Entities (key fields only):**

- **User** `{ id, email (unique), name, role: [STUDENT|LAB_ADMIN|PLATFORM_ADMIN], createdAt }`
- **Lab** `{ id, name, department, website?, verified, owners: [User], createdAt }`
- **Posting** `{ id, labId, title, summary, description, dept, techniques[], compType [PAID|CREDIT|VOLUNTEER], timeHrsWeek?, minMonths?, status [DRAFT|PUBLISHED|CLOSED], deadlineAt?, maxHires?, createdAt, updatedAt }`
- **Application** `{ id, postingId, studentId, status [SUBMITTED|IN_REVIEW|SHORTLIST|INTERVIEW|OFFER|REJECTED|WITHDRAWN], resumeUrl, answers (JSON), createdAt, updatedAt }`
- **AuditLog** `{ id, actorUserId, entityType, entityId, action, metaJSON, at }`
- **SavedSearch** (v2): `{ id, studentId, name, queryJSON, cadence, active }`

**Indexes:**

- **Postings:** `(status, dept, deadlineAt)`, full-text on `(title, summary, description)`, GIN on `techniques[]`.
- **Applications:** `(postingId, status, createdAt)`.

## 5) Non-Functional Requirements

- **Performance:** P95 < 500 ms for primary read/search flows; pagination everywhere.
- **Availability:** Target 99.9% 
- **Security & Privacy:** RBAC enforcement, least-privilege queries; PDF-only uploads; minimize PII; support user data deletion/export.
- **Accessibility:** WCAG 2.1 AA (labels, keyboard nav, color contrast).
- **Compliance/Brand:** UCLA marks not used unless approved.

## 6) Tech Stack 

- **Frontend:** Next.js (TypeScript), Tailwind + shadcn/ui, React Hook Form + Zod, TanStack Query.
- **Backend:** Node.js (NestJS or Express), Prisma ORM.
- **Database:** PostgreSQL (local Docker; Neon/Supabase in staging/prod).
- **Storage:** Local folder for resumes in dev; S3 or R2 in prod (signed URL upload flow).
- **Auth:** domain-restricted magic link; later swap to SAML via WorkOS/Auth0.
- **Observability:** Sentry (FE/BE).
- **Email/Queues:** Deferred to later; MVP uses on-screen confirmations.

## 7) API Design (selected endpoints)

### Auth

- `POST /auth/magic-link` (send)
- `POST /auth/magic-link/callback` (verify → session/JWT)

### Students

- `GET /postings?query=&dept=&techniques=&compType=&page=`
- `GET /postings/:id`
- `POST /applications` (multipart form: resume + JSON answers)
- `GET /me/applications`

### Labs

- `GET /labs/:labId/postings`
- `POST /labs/:labId/postings` (create draft)
- `PATCH /postings/:id` (publish/close/update)
- `GET /postings/:id/applications`
- `PATCH /applications/:id` (status, notes)
- `GET /labs/:labId/members`; `POST/DELETE members`

### Admin

- `POST /labs/:id/verify`
- `GET /reports`; `POST /reports/:id/resolve`

### Error Model

Consistent JSON: `{ error: { code, message, details? } }` with `400/401/403/404/409/422/500`.

## 8) Posting Schema (standardized fields)

Title; Summary (≤300 chars); Description (rich text); Department; Research Areas (tags); Techniques/Skills (tags); Time Commitment (hrs/week); Minimum Duration (months); Start Term; Compensation (Paid/Credit/Volunteer; pay range optional); Eligibility (major/class year optional in MVP); Screening Questions (0–3 short answers); Application Materials (Resume required; optional statement); Deadline (date) or Rolling (boolean); Expected Timeline ("review weekly; reply in 14 days").

## 9) Search & Ranking 

- Use Postgres full-text search + trigram for fuzzy title/summary/description.
- Default sort: soonest deadline, then newest posting.
- Exact tag/technique filters via array columns and GIN index.

## 10) Security Model

- **RBAC:** Student vs LabAdmin vs PlatformAdmin enforced at route and row level (labId scoping).
- **Input validation** on all endpoints (Zod/DTOs).
- **PDF-only uploads:** size limit (e.g., 5 MB); mime-type and extension checks; store signed URLs.
8) Posting Schema (standardized fields)
Title; Summary (≤300 chars); Description (rich text); Department; Research Areas (tags); Techniques/Skills (tags); Time Commitment (hrs/week); Minimum Duration (months); Start Term; Compensation (Paid/Credit/Volunteer; pay range optional); Eligibility (major/class year optional in MVP); Screening Questions (0–3 short answers); Application Materials (Resume required; optional statement); Deadline (date) or Rolling (boolean); Expected Timeline (“review weekly; reply in 14 days”).
9) Search & Ranking 
Use Postgres full-text search + trigram for fuzzy title/summary/description.
Default sort: soonest deadline, then newest posting.
Exact tag/technique filters via array columns and GIN index.
10) Security Model
RBAC: Student vs LabAdmin vs PlatformAdmin enforced at route and row level (labId scoping).
Input validation on all endpoints (Zod/DTOs).
PDF-only uploads; size limit (e.g., 5 MB); mime-type and extension checks; store signed URLs.

## 11) Analytics & KPIs (lightweight in MVP)

11) Analytics & KPIs (lightweight in MVP)
Views per posting; applications per posting; view→apply conversion.
Time to first application; time to fill (first Offer or Closed with hires).
Active labs and active students weekly. (Implement as simple DB queries and a basic admin dashboard; full analytics later.)
12) Rollout Plan (8–10 weeks, MVP first)
Week 1–2 (Foundation)
DB schema and migrations; seed data.
Public browse: search + filters + posting detail.
Lab console: create/edit/publish posting (RBAC).
Basic styling and components; accessibility pass.
Week 3–4 (Apply + Review)
Application submission (resume upload, questions).
Student dashboard (my applications).
Lab applications table (filter/sort; status changes; CSV export).
Audit logging.
Week 5–6 (Polish & Pilot)
Admin verification and basic moderation.
Error states, empty states, loading skeletons.
Department landing pages (static list of verified labs).
Pilot with 3–5 labs; gather feedback.
Week 7–8 (Stabilize)
Performance tuning (indexes, N+1 checks).
Backups and recovery docs; basic incident playbook.
Optional: saved searches (digest email deferred).
13) Growth & Onboarding
Concierge onboarding for first labs (import one existing posting per lab).
Student outreach via departmental listservs and relevant clubs.
“Refer your lab” CTA that generates a pre-filled email to the PI/lab manager.
Department pages and simple analytics to win departmental champions.
14) Risks & Mitigations
SSO complexity: ship MVP with domain-restricted magic link; plan SAML switch when approved.
Low lab adoption: standardized posting editor + import from Google Doc; hands-on onboarding.
Data quality inconsistency: strong required fields, real-time validation, posting preview.
PII concerns: keep data minimal; clear retention policy (e.g., purge rejected apps after 12 months).
15) Definition of Done 
All endpoints validated; RBAC enforced; tests for happy paths.
FTS + trigram search working with indexes.
Resume upload flow secured and limited (PDF only).
Student can apply; lab can review and change status; admin can verify labs.
Basic analytics available; core pages accessible; docs updated (README + runbook).
