# Labradoor — UCLA Undergraduate Lab Openings Platform (MVP Spec)

## 1) Problem & Goals

* **Problem:** Undergrad–lab matching is fragmented (lab sites, cold emails, word of mouth). Labs rarely update openings; students waste time searching and waiting on replies.
* **Goal:** A centralized platform where labs post standardized openings and students discover, filter, and apply in one place. Reduce email churn and make review workflows simple.

## 2) Users & Roles

* **Student (UCLA undergrad):** browse/search, save, apply, track status (UI confirmations only for MVP).
* **Lab Admin (PI/manager/grad):** create & manage postings, review applicants, communicate with candidates.
* **Platform Admin:** verify labs, moderate abuse, manage configuration.
* **(Later) Department Admin:** curate department page, analytics.

## 3) Core User Stories (with acceptance criteria)

### 3.1 Student Discovery & Application

1. **S1: Sign-in with UCLA identity** (MVP: domain-restricted magic link).
   *AC:* `@ucla.edu` required; name + email captured on first login.
2. **S2: Search & filter openings** by keyword, department, techniques/skills, time commitment, compensation, start term.
   *AC:* Combined filters; URL reflects filters; P95 < 500 ms for < 5k postings.
3. **S3: View standardized posting page** (title, summary, description, dept, techniques, time commitment, compensation, eligibility, questions, deadline/timeline).
   *AC:* Required fields enforced; preview matches student view.
4. **S4: Apply** with resume (PDF) + short answers.
   *AC:* Client/server validation; PDF only; status set to **Submitted**; success confirmation shown.
5. **S5: Track applications** in a dashboard.
   *AC:* List shows posting, status, last updated. Statuses: Submitted, In Review, Interview, Offer, Rejected, Withdrawn.

### 3.2 Lab Admin Posting & Review

6. **L1: Create/edit/publish/close postings.**
   *AC:* Draft → Published → Closed; clone; required fields validated.
7. **L2: Review applications** in a sortable table (name, major*, answers, created date).
   *AC:* Filter by status; bulk shortlist/reject; notes; CSV export.
8. **L3: Change application status & log actions.**
   *AC:* Status transitions update applicant timeline; RBAC enforces permissions.
9. **L4: Manage lab collaborators.**
   *AC:* Owner/Editor/Viewer roles; audit logged.

*Major optional; be mindful of privacy.

### 3.3 Platform Admin & Safety

10. **A1: Verify labs before publishing.**
    *AC:* Verification flag toggled by Admin; unverified labs can only draft.
11. **A2: Moderate reports.**
    *AC:* Report queue with reason; soft delete/restore.

---

## 4) Information Architecture & Data Model (MVP)

**Entities (key fields only):**

* **User** `{ id, email(unique), name, role[STUDENT|LAB_ADMIN|PLATFORM_ADMIN], createdAt }`
* **Lab** `{ id, name, department, website?, verified, owners:[User], createdAt }`
* **Posting** `{ id, labId, title, summary, description, dept, techniques[], compType[PAID|CREDIT|VOLUNTEER], timeHrsWeek?, minMonths?, status[DRAFT|PUBLISHED|CLOSED], deadlineAt?, maxHires?, createdAt, updatedAt }`
* **Application** `{ id, postingId, studentId, status[SUBMITTED|IN_REVIEW|SHORTLIST|INTERVIEW|OFFER|REJECTED|WITHDRAWN], resumeUrl, answers(JSON), createdAt, updatedAt }`
* **AuditLog** `{ id, actorUserId, entityType, entityId, action, metaJSON, at }`
* **SavedSearch (v2)** `{ id, studentId, name, queryJSON, cadence, active }`

**Indexes:**

* Postings: `(status, dept, deadlineAt)`, full-text on `(title, summary, description)`, GIN on `techniques[]`.
* Applications: `(postingId, status, createdAt)`.

---

## 5) Non-Functional Requirements

* **Performance:** P95 < 500 ms for primary read/search; pagination everywhere.
* **Availability:** Target 99.9% (MVP can tolerate restarts).
* **Security & Privacy:** RBAC; least-privilege queries; PDF-only uploads; minimize PII; user data deletion/export.
* **Accessibility:** WCAG 2.1 AA (labels, keyboard nav, contrast).
* **Compliance/Brand:** Avoid UCLA marks unless approved.

---

## 6) Tech Stack (MVP)

* **Frontend:** Next.js (TypeScript), Tailwind + shadcn/ui, React Hook Form + Zod, TanStack Query.
* **Backend:** Node.js (NestJS or Express), Prisma ORM.
* **Database:** PostgreSQL (Docker locally; Neon/Supabase in staging/prod).
* **Storage:** Local folder for resumes in dev; S3/R2 in prod (signed URL flow).
* **Auth (MVP):** Domain-restricted magic link; later swap to SAML via WorkOS/Auth0.
* **Observability:** Sentry (FE/BE).
* **Email/Queues:** Deferred (UI confirmations only).

---

## 7) API Design (selected endpoints)

**Auth**

* `POST /auth/magic-link` — send link
* `POST /auth/magic-link/callback` — verify → session/JWT

**Students**

* `GET /postings?query=&dept=&techniques=&compType=&page=`
* `GET /postings/:id`
* `POST /applications` (multipart: resume + JSON answers)
* `GET /me/applications`

**Labs**

* `GET /labs/:labId/postings`
* `POST /labs/:labId/postings` (create draft)
* `PATCH /postings/:id` (publish/close/update)
* `GET /postings/:id/applications`
* `PATCH /applications/:id` (status, notes)
* `GET /labs/:labId/members` · `POST/DELETE` members

**Admin**

* `POST /labs/:id/verify`
* `GET /reports` · `POST /reports/:id/resolve`

**Error Model:**
`{ "error": { "code": "string", "message": "string", "details": {} } }` with 400/401/403/404/409/422/500.

---

## 8) Standardized Posting Schema

**Title; Summary (≤300); Description (rich text); Department; Research Areas (tags); Techniques/Skills (tags); Time Commitment (hrs/week); Minimum Duration (months); Start Term; Compensation (Paid/Credit/Volunteer; optional pay range); Eligibility (optional major/class year); Screening Questions (0–3); Application Materials (Resume required; optional statement); Deadline (date) or Rolling (boolean); Expected Timeline (“review weekly; reply in 14 days”).**

---

## 9) Search & Ranking (MVP)

* Postgres **full-text search** + **trigram** for fuzzy title/summary/description.
* Default sort: **soonest deadline**, then **newest posting**.
* Exact tag/technique filters via array columns + GIN index.

---

## 10) Security Model

* **RBAC:** Student / LabAdmin / PlatformAdmin, enforced at route and row level (scope by `labId`).
* **Validation:** Zod/DTOs on all endpoints.
* **Uploads:** PDF only, size limit (e.g., 5 MB); MIME/extension checks; store signed URLs.
* **Audit:** Log sensitive changes (publish/close posting, status changes, membership changes).

---

## 11) Analytics & KPIs (lightweight MVP)

* Views per posting; applications per posting; view→apply conversion.
* Time to first application; time to fill (first Offer or Closed with hires).
* Weekly active labs and students.
  *Implement as simple DB queries + basic admin dashboard; expand later.*

---

## 12) Rollout Plan (8–10 Weeks)

**Weeks 1–2 — Foundation**

* DB schema & migrations; seed data.
* Public browse: search + filters + posting detail.
* Lab console: create/edit/publish posting (RBAC).
* Styling components; accessibility pass.

**Weeks 3–4 — Apply & Review**

* Application submit (resume upload, questions).
* Student dashboard (my applications).
* Lab applications table (filter/sort; status changes; CSV export).
* Audit logging.

**Weeks 5–6 — Polish & Pilot**

* Admin verification & moderation.
* Error/empty/loading states.
* Department landing pages (static verified labs).
* Pilot with 3–5 labs; collect feedback.

**Weeks 7–8 — Stabilize**

* Performance tuning (indexes, N+1).
* Backups/recovery docs; incident playbook.
* (Optional) Saved searches (digest email later).

---

## 13) Growth & Onboarding

* Concierge onboarding for first labs (import one posting each).
* Student outreach via departmental listservs & clubs.
* “Refer your lab” CTA with pre-filled PI email.
* Department pages + simple analytics to win champions.

---

## 14) Risks & Mitigations

* **SSO complexity:** Start with magic link; plan SAML switchover.
* **Low lab adoption:** Standardized editor + import from Google Doc; hands-on onboarding.
* **Data quality:** Required fields, real-time validation, posting preview.
* **PII concerns:** Minimal collection; retention policy (e.g., purge rejected apps after 12 months).

---

## 15) Definition of Done (MVP)

* Endpoints validated; RBAC enforced; happy-path tests pass.
* FTS + trigram search working with indexes.
* Secure PDF resume upload flow.
* Student can apply; lab can review & change status; admin can verify labs.
* Basic analytics available; core pages accessible; README/runbook updated.
