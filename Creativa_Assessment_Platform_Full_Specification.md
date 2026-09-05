# Creativa Innovation Hub Aswan
## Assessment & Training Impact Platform

*Complete Product & Technical Specification — MVP*

**Version:** 1.0 | **Date:** 3 September 2026

**Purpose:** This document consolidates the requirements agreed during the product discussion for an independent online pre/post assessment platform for short Creativa courses.

# 1. Executive Summary

The platform is a standalone assessment website connected conceptually
to the wider Creativa ecosystem, but it does not depend on an existing
Creativa registration system in the MVP. A Coordinator creates courses,
builds exactly one Pre-Test and one Post-Test per course,
publishes/unpublishes assessments, and displays a persistent QR code.
Students scan the QR, enter their personal information, pass identity
matching, complete the assessment, and submit it. Scores are not shown
to students immediately; the Coordinator reviews essay answers and
decides when results can be published. The platform stores detailed
attempts and answers so it can produce course-level and question-level
impact analytics and export student-level results.

**A. New Section — Language & Direction (insert after §8, before §9)**

**Platform UI:** entirely English, always LTR. Dashboard, navigation,
buttons, timer, question counter, Previous/Next, Submit, confirmation
dialogs, status messages, error messages, Coordinator dashboard — none
of it changes with content language. No platform-wide language switcher
is needed.

**Assessment content:** questions, choices, and essay text may be
Arabic, English, or mixed within the same string, and must render RTL
where appropriate without flipping the surrounding UI.

Implementation requirements:

- Set direction: ltr at the document root. Apply direction per content
  block, not per page.

- Use the HTML dir="auto" attribute on question/choice/essay text
  containers, not just a CSS direction rule — dir also governs default
  text-align, list marker position, and accessibility-tree reading
  order.

- dir="auto" detects direction from the first strong-directional
  character only. A question opening with a Latin acronym or brand name
  before Arabic text (e.g. "SEO <span dir="rtl">ما هو</span>...") will
  mis-detect as LTR for the whole block. Mitigate with one of:

  - unicode-bidi: plaintext in CSS, which applies the Unicode Bidi
    Algorithm across the full paragraph rather than just the first
    character.

  - A per-question direction override stored on the question record
    (Auto / Force RTL / Force LTR), settable by the Coordinator in the
    builder. Cheap to add at schema time, costly to retrofit once
    content exists.

- Radio/checkbox position for choice rows should follow from dir="rtl"
  on the row container plus CSS logical properties (margin-inline-start,
  not margin-left), letting the browser reorder the marker automatically
  — not manual DOM reordering per language.

- Numbers in UI chrome (question counter, timer) stay Western digits
  regardless of content language, matching the English/LTR UI.

- Data model: no schema change beyond the optional per-question
  content_direction override field above. Question/choice/essay text is
  stored as UTF-8 either way; direction is a rendering concern.

# 2. Product Goals

- Measure learner baseline knowledge on the first day of a short course.

- Measure learner knowledge after the course on the final day.

- Compare Pre-Test and Post-Test performance at student and course
  levels.

- Give Coordinators a simple operational workflow suitable for live
  training rooms and QR-based access.

- Support manual review of essay questions while automatically grading
  choice questions.

- Preserve historical attempts and results for reporting and
  auditability.

- Provide Excel/CSV export for deeper offline analysis.

# 3. Non-Goals for MVP

- No student authentication account.

- No instructor account or instructor-side question management.

- No Admin/User Management dashboard for Coordinators; coordinator
  accounts are provisioned directly in the database.

- No Pass/Fail logic.

- No assessment scheduling; availability is controlled only by
  Publish/Unpublish.

- No file uploads for essay answers.

- No manual question ordering; questions and choices are randomized.

- No course cloning/duplication.

- No advanced result filtering/search in the Coordinator dashboard.

- No dependency on the existing Creativa course-registration system.

# 4. Roles & Permissions

| Role | Permissions |
|----|----|
| Coordinator | Create/edit/archive courses; create/edit Pre/Post assessments; add/edit/delete questions and choices while Draft; define points and duration; preview; publish/unpublish; view QR; view attempts and student answers; grade essays; reset student attempts; publish student results; export results. |
| Student | Open assessment from QR; submit identity data; complete active attempt; navigate questions; auto-save answers; submit; receive submission/result-review message. No score shown by default. |

# 5. Course Management

Each course is created directly inside the assessment platform.

| Field           | Required | Notes                                   |
|-----------------|----------|-----------------------------------------|
| Course Name     | Yes      | Displayed to students and Coordinators. |
| Instructor Name | Yes      | Displayed on assessment intro.          |
| Start Date      | Yes      | Course metadata.                        |
| End Date        | Yes      | Course metadata.                        |
| Course Category | Yes      | Selected from dynamic categories.       |

Category management: Categories are dynamic and can be added by a
Coordinator.

Course status: There is no operational course status. A course can be
archived using soft delete.

Archive behavior: Archived courses disappear from the normal active
list, but students, attempts, answers, scores, and audit data remain
stored.

# 6. Assessment Rules

- Every course has exactly one Pre-Test and one Post-Test.

- The system must prevent creation of a second Pre-Test or second
  Post-Test for the same course.

- Each assessment has its own configurable duration.

- Each assessment contains a flexible number of questions and points.

- All questions are required.

- Assessment availability is controlled by Publish/Unpublish only.

- Published assessments are read-only. To edit, the Coordinator must
  Unpublish first.

- Unpublishing does not interrupt already-started attempts; existing
  attempts may continue, but new attempts cannot start.

- Each assessment has a persistent QR code that does not change across
  Publish/Unpublish cycles.

- Pre and Post use separate QR codes.

- The QR opens the specific assessment directly.

- If an assessment is not published, its QR shows an unavailable message
  and cannot start a new attempt.

# 7. Assessment Builder

The Coordinator creates and configures the assessment.

| Capability | Requirement |
|----|----|
| Assessment Type | Pre-Test or Post-Test; one of each per course. |
| Duration | Coordinator-defined timer per assessment. |
| Questions | Unlimited practical count; builder should not hard-code a fixed count. |
| Question Points | Coordinator defines points per question. |
| Required | All questions required. |
| Preview | Coordinator can preview the assessment before publishing. |
| Manual Ordering | Not required; randomization is used. |
| Publish | Makes assessment available to new attempts. |
| Unpublish | Stops new attempts but does not stop existing attempts. |

# 8. Supported Question Types

| Type | Behavior | Scoring |
|----|----|----|
| Single Choice | One answer can be selected. | Automatic; correct answer receives full question points, incorrect receives 0. |
| Multiple Choice | Any number of choices can be configured; more than one correct answer is supported. | Automatic partial credit with wrong-answer penalty; floor result to whole number and never below 0. |
| Essay | Text-only answer in a textarea; no file upload. | Coordinator manually assigns a score up to the question's maximum points. |

# 9. Multiple Choice Scoring Formula

For a multiple-choice question, the agreed rule is proportional partial
credit with a penalty for wrong selections.

Recommended implementation:

Raw score = ((number of selected correct options) − (number of selected
incorrect options)) / (total number of correct options) × question
points

Final score = floor(max(0, raw score))

Example: 10-point question, 3 correct choices, student selects 2
correct + 1 wrong: (2−1)/3×10 = 3.33 → stored score = 3.

Example: 10-point question, 3 correct choices, student selects 2 correct
and no wrong choices: 2/3×10 = 6.67 → stored score = 6.

# 10. Student Identity & Registration

The platform uses a global student identity across all courses.

| Field        | Rule                                                    |
|--------------|---------------------------------------------------------|
| Full Name    | Entered on every assessment entry.                      |
| Phone Number | Entered on every assessment entry.                      |
| Email        | Entered on every assessment entry.                      |
| National ID  | Entered on every assessment entry; unique identity key. |

- National ID is unique across the whole platform.

- If the National ID is new, create a Student record using the submitted
  details.

- If the National ID already exists, compare Full Name, Phone, and Email
  with the stored student record.

- If matching, allow the student to continue.

- If mismatched, block the attempt and show a clear verification error;
  do not silently overwrite identity data.

- The same Student record is reused across different courses.

# 11. Student Journey

1.  Student scans the assessment-specific QR.

2.  Platform resolves the QR to the exact Course + Assessment.

3.  If assessment is unpublished/invalid/archived, show unavailable
    state.

4.  Student enters Full Name, Phone, Email, and National ID.

5.  Platform performs identity lookup/matching.

6.  Show assessment intro: Course Name, Instructor Name, Assessment
    Type, Duration.

7.  Student clicks Start Assessment.

8.  Show start confirmation; final confirmation begins the timer and
    creates the active attempt.

9.  Student completes questions with free navigation and auto-save.

10. Student can return to previous questions and change answers.

11. Student clicks Final Submit.

12. Show submit confirmation; warn if any unanswered question remains.

13. On confirmation, submit the attempt.

14. Do not show score.

15. Show submission success and explain that the result will be
    available after Coordinator review/publication.

# 12. Attempt & Session Rules

- Default: one attempt per student per assessment.

- Coordinator can Reset a student's attempt when necessary.

- A Reset creates a new attempt; previous attempt history is preserved.

- Each new attempt receives a new randomized question order and
  randomized choice order.

- Only one active attempt/session is allowed at a time per student
  assessment.

- Opening the same assessment in another tab/device must be blocked
  while an active attempt exists.

- Refresh, browser close/reopen, or temporary network loss must not
  destroy an active attempt if time remains.

- Timer must be server-authoritative, based on started_at and duration,
  not trusted from the browser.

- When time expires, the attempt is auto-submitted.

- Answers are auto-saved during the attempt.

# 13. Randomization

- Question order is randomized per attempt.

- Choice order is randomized per attempt for Single/Multiple Choice.

- Randomization changes when a Coordinator resets an attempt.

- The stored attempt must preserve the actual randomized order presented
  to that student so historical review remains exact.

# 14. Assessment Version Integrity

When an attempt starts, it must be tied to an immutable snapshot/version
of the assessment questions, choices, correct-answer configuration, and
points. If the Coordinator later unpublishes and edits the assessment,
existing attempts continue against the version they started with. New
attempts after republishing use the new version.

# 15. Timer & Auto-Submit

- Coordinator sets duration per assessment.

- Timer starts only after the final Start Confirmation.

- Server stores started_at and computes expires_at.

- Client displays remaining time but cannot extend it.

- Server rejects/auto-submits submissions after expiration.

- If the student reconnects, the server returns the authoritative
  remaining time and saved state.

# 16. Auto-Save & Network Resilience

- Choice changes should be persisted immediately or with a very short
  debounce.

- Essay text should auto-save frequently with debounce to avoid
  excessive requests.

- Each save should be associated with the attempt and question.

- Client should show a subtle save state such as Saved / Saving /
  Offline.

- If offline temporarily, queue unsent changes locally and synchronize
  when connection returns, while resolving conflicts conservatively.

- Final submit must send/confirm the latest local state before closing
  the attempt where possible.

# 17. Submit Confirmation

- Before final submission, always show a confirmation dialog.

- If unanswered questions exist, explicitly state their count.

- Example: 'You have 3 unanswered questions. Are you sure you want to
  submit?'

- After confirmation, attempt becomes submitted and cannot be edited
  unless Coordinator resets it into a new attempt.

# 18. Result Visibility

- Students do not see scores immediately after submission.

- Coordinator reviews essay answers when present.

- A result can be marked reviewed/ready after required manual grading is
  complete.

- Coordinator decides when to publish the result to the student.

- Result publication should be explicit, not automatic.

- If a student has no essay questions, the result can be calculated
  automatically but still remains hidden until the Coordinator publishes
  it.

# 19. Coordinator Dashboard

Recommended top-level navigation:

- Dashboard

- Courses

- Categories

- Pending Essay Reviews

- Archived Courses

Dashboard summary cards:

- Total Courses

- Total Students

- Total Assessments

- Completed Pre-Tests

- Completed Post-Tests

- Pending Essay Reviews

Keep the global dashboard operational and lightweight. Detailed
analytics belong inside Course Details.

# 20. Course Details

Suggested course detail structure:

- Course information

- Pre-Test card with status, QR, question count/points summary,
  duration, and actions

- Post-Test card with the same information

- Student/Results table

- Analytics

- Export

- Archive action

Core assessment actions: Edit (only Draft/Unpublished), Preview,
Publish, Unpublish, View QR, View Results.

# 21. Results Table

The main result table is intentionally simple; advanced filtering is
deferred.

| Column | Purpose |
|----|----|
| Student Name | Global student name. |
| Phone | Student contact data. |
| Email | Student contact data. |
| National ID | Student identity. |
| Pre Score | Overall Pre-Test score. |
| Post Score | Overall Post-Test score. |
| Improvement | Post − Pre percentage-point improvement; N/A when Pre is missing. |
| Pre Status | Completed / Not Completed. |
| Post Status | Completed / Not Completed. |
| Result Status | Pending Review / Reviewed / Published as applicable. |

# 22. Student Attempt Detail

Coordinator can open an individual attempt and inspect:

- Student identity.

- Course and assessment.

- Attempt number/history.

- Start and submission timestamps.

- Completion status.

- Question-by-question response.

- Correct answer for choice questions.

- Correct/incorrect status for choice questions.

- Question maximum points.

- Awarded points.

- Essay answer text.

- Coordinator-entered essay score.

- Final total.

The system must preserve enough information to reconstruct exactly what
the student saw and answered.

# 23. Essay Review

- Coordinator sees a queue of pending essay reviews.

- For each essay, show question text, maximum points, and student's text
  response.

- Coordinator enters awarded points manually.

- Awarded points must be between 0 and the question's maximum points.

- Saving the score updates the attempt's calculated result.

- Essay review actions should be auditable with reviewer and timestamp.

# 24. Analytics & Training Impact

Course-level analytics required:

- Average Pre-Test score.

- Average Post-Test score.

- Percentage-point improvement.

- Highest score.

- Lowest score.

- Number of students who completed Pre-Test.

- Number of students who completed Post-Test.

- Comparison of Pre vs Post for each student.

- Question-level performance.

- Correct-answer percentage per question.

- Hardest questions.

Primary improvement metric: Percentage-point improvement = Post Score
(%) − Pre Score (%). If Pre is missing, improvement is N/A. Relative
improvement may be calculated later, but is not the primary KPI.

Important: Course averages should clearly distinguish between students
who completed both assessments and students who completed only one, so
missing Pre or Post scores do not create misleading comparisons.

# 25. Question Analytics

- For Single Choice: percent correct per question.

- For Multiple Choice: recommended metric is percent of attempts
  achieving full question score, plus average awarded points as a
  secondary metric.

- For Essay: average awarded points and review completion rate can be
  shown after manual grading.

- Hardest questions can be ranked by lowest average score percentage /
  lowest full-credit rate.

- Analytics should be based on the assessment version used by the
  attempts.

# 26. Excel / CSV Export

Primary export is course-level, one row per student.

| Column        | Definition                             |
|---------------|----------------------------------------|
| Name          | Student full name.                     |
| Phone         | Student phone.                         |
| Email         | Student email.                         |
| National ID   | Global student identity.               |
| Pre Score     | Pre-Test total percentage.             |
| Post Score    | Post-Test total percentage.            |
| Improvement   | Post − Pre percentage points or N/A.   |
| Pre Status    | Completed / Not Completed.             |
| Post Status   | Completed / Not Completed.             |
| Result Status | Pending Review / Reviewed / Published. |

Detailed question-by-question export is not required for MVP.

# 27. QR Code Architecture

- Each assessment has its own persistent QR.

- Pre and Post QR codes are different.

- The QR resolves directly to the assessment, not to a course landing
  page.

- QR should contain only a non-sensitive assessment identifier/token;
  never embed National ID or personal data.

- The identifier should be unguessable (e.g., UUID/random public token).

- QR remains stable across Publish/Unpublish cycles.

- Archived courses and unpublished assessments cannot create new
  attempts through the QR.

# 28. Authentication

- Only Coordinators authenticate.

- Login: email + password.

- Coordinator accounts are provisioned directly in the database during
  deployment.

- No user-management UI in MVP.

- All Coordinators have the same permissions.

- Passwords must be securely hashed (e.g., Argon2id or bcrypt), never
  stored as plaintext.

- Use secure server-side sessions or secure HTTP-only cookies; avoid
  storing raw passwords/tokens in client-accessible storage.

# 29. Recommended Data Model

| Entity | Key Fields |
|----|----|
| coordinator_users | id, email, password_hash, created_at, updated_at |
| categories | id, name, created_at, updated_at |
| courses | id, name, instructor_name, start_date, end_date, category_id, archived_at, created_at, updated_at |
| students | id, national_id UNIQUE, full_name, phone, email, created_at, updated_at |
| assessments | id, course_id, type PRE/POST, status DRAFT/PUBLISHED, duration_seconds, public_token UNIQUE, current_version_id, created_at, updated_at |
| assessment_versions | id, assessment_id, version_number, created_at, created_by |
| questions | id, assessment_version_id, type, prompt, points, position_snapshot, created_at |
| choices | id, question_id, text, is_correct, snapshot_position, created_at |
| attempts | id, assessment_id, assessment_version_id, student_id, attempt_number, status, started_at, expires_at, submitted_at, score_points, max_points, score_percent, result_status |
| attempt_question_order | attempt_id, question_id, display_position |
| attempt_choice_order | attempt_id, question_id, choice_id, display_position |
| answers | id, attempt_id, question_id, text_answer, saved_at, submitted_at |
| answer_choices | answer_id, choice_id |
| question_scores | id, attempt_id, question_id, awarded_points, grading_status, graded_by, graded_at |
| result_publications | id, attempt_id, published_by, published_at |
| audit_logs | id, coordinator_id, action, entity_type, entity_id, metadata_json, created_at |

# 30. Important Database Constraints

- students.national_id must be unique globally.

- assessments unique on (course_id, type), so only one PRE and one POST
  exist per course.

- assessment public_token must be unique.

- A submitted attempt cannot be edited directly.

- A reset creates a new attempt rather than deleting history.

- question scores cannot exceed question points.

- Archived courses retain all child data.

- Foreign keys should use appropriate cascading behavior carefully;
  historical attempts should never be accidentally deleted by course
  archive.

# 31. Attempt State Machine

| State | Meaning |
|----|----|
| NOT_STARTED | No attempt exists. |
| IN_PROGRESS | Student has started and timer is active. |
| SUBMITTED | Student submitted or timer expired. |
| UNDER_REVIEW | Essay grading is pending. |
| REVIEWED | Required grading completed. |
| PUBLISHED | Coordinator has made result visible to student. |
| RESET/VOIDED | Prior attempt retained as history and no longer active; a new attempt may be created. |

# 32. Assessment State Machine

| State       | Allowed Actions                                         |
|-------------|---------------------------------------------------------|
| DRAFT       | Edit, Preview, Publish.                                 |
| PUBLISHED   | Preview, Unpublish, View QR, View results; no editing.  |
| UNPUBLISHED | Edit, Preview, Publish; existing attempts may continue. |

# 33. Security Requirements

- Use HTTPS in production.

- Validate and sanitize all student and Coordinator inputs.

- Use parameterized queries/ORM to prevent SQL injection.

- Protect Coordinator endpoints with authenticated sessions.

- Rate-limit login attempts and assessment identity verification.

- Do not expose correct answers in client payloads before/after
  submission unless required for Coordinator-only endpoints.

- Never trust client-provided score, timer, attempt status, or
  correctness.

- Compute scoring on the server.

- Server controls attempt ownership and active-session rules.

- Use secure, HttpOnly, SameSite cookies for Coordinator sessions.

- Avoid logging National IDs, passwords, or full essay answers
  unnecessarily in application logs.

- Use authorization checks on every Coordinator mutation endpoint.

- Audit sensitive actions: publish, unpublish, reset, grade essay,
  publish result, archive course.

# 34. Active Session Design

Use an active session/lease record or equivalent server-side mechanism
tied to the attempt. A student may have only one active session for a
given assessment attempt. The implementation should tolerate refresh and
short disconnects without creating a second active session.

- Issue a secure session identifier after starting an attempt.

- Bind the session to the attempt.

- Reject a second active session for the same attempt.

- Allow controlled re-acquisition after a short disconnect/heartbeat
  timeout so legitimate recovery works.

- Do not treat IP address as the sole identity mechanism because mobile
  networks can change IPs.

# 35. Recommended API Surface

| Area | Example Endpoints |
|----|----|
| Coordinator Auth | POST /api/auth/login; POST /api/auth/logout; GET /api/auth/me |
| Courses | GET/POST /api/courses; GET/PATCH /api/courses/:id; POST /api/courses/:id/archive |
| Categories | GET/POST /api/categories; PATCH /api/categories/:id |
| Assessments | GET/POST /api/courses/:id/assessments; GET/PATCH /api/assessments/:id; POST /api/assessments/:id/publish; POST /api/assessments/:id/unpublish |
| Questions | POST/PATCH/DELETE /api/assessments/:id/questions |
| Preview | GET /api/assessments/:id/preview |
| QR | GET /api/assessments/:id/qr |
| Student Entry | GET /api/public/assessments/:token; POST /api/public/assessments/:token/verify-student |
| Attempts | POST /api/public/assessments/:token/start; GET /api/public/attempts/:id; POST /api/public/attempts/:id/answers; POST /api/public/attempts/:id/submit |
| Coordinator Results | GET /api/assessments/:id/results; GET /api/attempts/:id |
| Essay Review | POST/PATCH /api/attempts/:id/questions/:questionId/grade |
| Reset | POST /api/attempts/:id/reset |
| Publication | POST /api/attempts/:id/publish-result |
| Analytics | GET /api/courses/:id/analytics |
| Export | GET /api/courses/:id/export |

# 36. Frontend Screens

Student side:

- Assessment Unavailable

- Student Identity Form

- Identity Verification Error

- Assessment Intro

- Start Confirmation

- Assessment Player

- Submit Confirmation

- Submission Success

Coordinator side:

- Login

- Dashboard

- Courses List

- Create Course

- Course Details

- Create/Edit Assessment

- Question Builder

- Assessment Preview

- QR Display

- Results Table

- Attempt Detail

- Essay Review

- Analytics

- Archived Courses

# 37. Suggested Student Assessment UI

- Header: Course/Assessment context and server-synchronized countdown.

- Main area: one question at a time.

- Question Navigator: numbered questions with current, answered,
  unanswered states.

- Navigation: Previous / Next.

- Choice questions: radio buttons for Single Choice; checkboxes for
  Multiple Choice.

- Essay: large text area with save state.

- Submit button always accessible without hiding the timer.

- Responsive mobile-first layout because QR access will commonly be from
  phones.

# 38. Suggested Coordinator Question Builder UI

- Assessment type and duration at top.

- Add Question button.

- Question type selector: Single Choice / Multiple Choice / Essay.

- Prompt editor.

- Points input.

- For choice questions: dynamic Add Choice control and correct-answer
  selection.

- For multiple choice: allow multiple correct choices.

- Delete/edit controls while assessment is Draft/Unpublished.

- Preview action.

- Publish action.

# 39. Business Rules & Edge Cases

- Student scans a valid QR after Unpublish → cannot start a new attempt.

- Student already in progress when Unpublish occurs → may continue.

- Student has submitted Post but no Pre → Post is stored; improvement is
  N/A.

- Student resets attempt → old attempt remains in history; new attempt
  gets new randomization.

- Student refreshes → same attempt and answers are restored.

- Network disconnects → local unsent answers should synchronize after
  reconnect; server timer continues.

- Timer expires while student is offline → server marks attempt
  submitted when state is reconciled; client must not extend time.

- Coordinator tries to edit Published assessment → blocked until
  Unpublish.

- Coordinator tries to create second Pre/Post → blocked by UI and
  database constraint.

- Course archived → no new attempts; historical data retained.

- Existing attempt uses old assessment version after republish → old
  version remains intact.

- Identity data mismatch on existing National ID → block and require
  Coordinator/manual resolution rather than overwriting.

# 40. Result Calculation

For each attempt, total awarded points are the sum of question scores.
Score percentage = floor((awarded_points / max_points) × 100) if the
product wants whole-number percentages; alternatively preserve decimal
precision internally and round only for display/export. Because the team
explicitly requested whole-number question partial-credit scores,
question scores should be stored as integers.

Recommended: store both awarded_points and max_points, and calculate
percentage from those totals. This preserves accuracy when assessments
contain questions with different point values.

# 41. Pre/Post Analytics Calculation

- Student Improvement = Post percentage − Pre percentage.

- Course Pre Average = average of completed Pre attempt percentages for
  the defined reporting population.

- Course Post Average = average of completed Post attempt percentages.

- Course Improvement = Post Average − Pre Average; preferably also show
  a 'paired students' improvement metric using only students with both
  results.

- Do not treat missing results as zero.

- When there are multiple historical attempts due to reset, the
  reporting layer should define one canonical attempt per assessment,
  preferably the latest valid submitted attempt unless a Coordinator
  later chooses another rule.

# 42. Recommended Reporting Clarification

Because Reset creates multiple historical attempts, the analytics layer
must avoid double-counting the same student. For MVP, use the latest
submitted valid attempt per student per assessment as the canonical
result for course-level Pre/Post reporting, while preserving all
attempts for audit/history. This can be changed later if Creativa wants
a different policy.

# 43. Audit Trail

- Log Coordinator login/logout where useful.

- Log course creation/edit/archive.

- Log assessment creation/edit/publish/unpublish.

- Log question changes.

- Log attempt reset.

- Log essay grading.

- Log result publication.

- Each log should include actor, action, target entity, timestamp, and
  relevant non-sensitive metadata.

# 44. MVP Acceptance Criteria

1.  Coordinator can log in using a database-provisioned email/password.

2.  Coordinator can create a dynamic category and course with the five
    agreed course fields.

3.  System automatically creates/permits exactly one Pre and one Post
    assessment per course.

4.  Coordinator can configure duration, questions, types, points, and
    choices.

5.  Coordinator can preview an assessment.

6.  Coordinator can publish/unpublish an assessment.

7.  Published assessment cannot be edited until unpublished.

8.  Each assessment has a persistent QR that opens it directly.

9.  Student can enter the four identity fields and be matched globally
    by National ID.

10. Student gets one default attempt per assessment.

11. Coordinator can reset an attempt.

12. Question and choice order randomize per new attempt.

13. Student can navigate backward/forward.

14. Student answers auto-save.

15. Timer is server-authoritative and auto-submits on expiration.

16. Only one active session is allowed for an attempt.

17. Student can recover after refresh/reopen/temporary disconnect.

18. Choice questions auto-grade, including agreed partial-credit
    behavior.

19. Essay answers are manually graded by Coordinator.

20. Student does not see score after submission.

21. Coordinator can view detailed answers and scores.

22. Coordinator can publish a result to the student.

23. Course analytics show agreed Pre/Post metrics and question analysis.

24. Course results export to Excel/CSV with the agreed columns.

25. Archived courses retain historical data.

# 45. Recommended Implementation Stack

The exact stack can follow the existing Creativa development
environment. A practical MVP architecture is:

- Frontend: React + TypeScript + Vite.

- Styling/UI: Tailwind CSS or the existing Creativa design system.

- Backend: TypeScript-based API (e.g., Node.js with a structured
  framework).

- Database: PostgreSQL.

- ORM: Prisma or equivalent.

- Authentication: secure server-side session + hashed Coordinator
  passwords.

- QR generation: a standard QR library generating a QR from the public
  assessment URL/token.

- Export: server-generated XLSX/CSV.

- Deployment: HTTPS production environment with managed PostgreSQL.

This stack is a recommendation, not a locked requirement.

# 46. Development Phases

| Phase | Scope |
|----|----|
| 1\. Foundation | Database schema, Coordinator login/session, categories, courses. |
| 2\. Assessment Builder | Pre/Post creation, question types, choices, points, draft/publish lifecycle, preview. |
| 3\. Student Flow | QR routing, identity verification, intro, confirmation, attempt creation. |
| 4\. Exam Engine | Timer, randomization, navigation, auto-save, session lock, recovery, submit. |
| 5\. Scoring | Single/Multiple Choice scoring, partial credit, essay review. |
| 6\. Results | Detailed attempts, result publication, course result table. |
| 7\. Analytics | Pre/Post analytics, question analysis, hardest questions. |
| 8\. Export & Audit | Excel/CSV export, audit logs, archive behavior. |
| 9\. QA | Mobile testing, weak-network testing, concurrent users, timer edge cases, security tests. |

# 47. Critical QA Test Scenarios

- Two students scan the same QR and start simultaneously.

- One student opens the assessment in two tabs.

- One student opens it on a second device.

- Student refreshes during a choice question.

- Student refreshes while typing an essay.

- Internet disconnects for 30–60 seconds.

- Timer reaches zero while the student is online.

- Timer reaches zero while the student is offline.

- Coordinator unpublishes while a student is mid-attempt.

- Coordinator edits and republishes after attempts exist.

- Reset produces a new randomization.

- Multiple-choice partial-credit examples including correct-only, mixed
  correct/wrong, all wrong, and all choices selected.

- Essay score validation prevents values above maximum.

- National ID matches but other data differs.

- Same National ID enters another course.

- Duplicate Pre/Post creation is rejected.

- Archived course QR cannot start new attempts.

- Export does not duplicate a student because of reset history.

# 48. Final Product Flow

Coordinator flow: Login → Dashboard → Create Category/Course → Configure
Pre/Post → Add Questions → Preview → Publish → Display QR → Monitor
Results → Review Essays → Publish Results → Export → Archive when
appropriate.

Student flow: Scan QR → Enter Identity → Verify → Assessment Intro →
Start Confirmation → Timed Assessment → Auto-save + Navigation → Submit
Confirmation → Submit → Success/Review Message.

# 49. Decisions Captured From Product Discussion

The following decisions are explicitly locked for MVP: short courses up
to roughly five days; first-day Pre and final-day Post; Coordinator owns
question entry after discussion with Instructor; independent assessment
website; QR-driven direct entry; four student identity fields; global
National ID identity; one attempt by default with Coordinator reset;
Single Choice, Multiple Choice, Essay; manual essay grading; flexible
builder; timer per assessment; randomized questions and choices;
backward navigation; hidden student scores; manual result publication;
persistent QR; simple Coordinator accounts provisioned in DB; no course
status; dynamic categories; soft archive; no cloning; text-only essays;
dynamic number of choices; partial credit with wrong-answer penalty and
floor-to-integer scoring; all questions required; preview; one active
session; recovery after refresh/network issues; auto-save; detailed
Coordinator result view; simple results table; Excel/CSV student-level
export; no Pass/Fail; Post allowed without Pre.

# 50. Open Items to Decide During Implementation (Not Blocking MVP)

- Exact UI branding/design system for the new assessment website.

- Exact session lease/heartbeat timeout for reconnect handling.

- Exact offline queue/conflict strategy for essay text.

- Whether published results are visible through a future student result
  lookup page or another channel; current requirement only says
  Coordinator decides when to publish.

- Whether categories can be edited/deleted, and what happens if a
  category is in use.

- Exact canonical-attempt policy if a student has multiple resets;
  recommended MVP policy is latest valid submitted attempt.

- Whether to show decimals in overall percentage even though question
  partial-credit scores are whole numbers.

- Future integration APIs with other Creativa platforms.

# Appendix A — Example End-to-End Scenario

Course: Digital Marketing | Instructor: Ahmed Ali | Dates: 10–14 September 2026. Coordinator creates Pre-Test and Post-Test. Pre is 30
minutes and contains 20 questions; Post is independently configured.
Coordinator publishes Pre and displays its persistent QR on day one. A
student scans it, enters the four identity fields, and is registered
globally if new. The student starts, receives a randomized
question/choice order, and answers are auto-saved. On submission the
student sees only a success/review message. On the final day, the Post
QR is displayed. The same National ID is recognized as the same student.
The student may complete Post even if Pre was missed. Coordinator later
reviews essays, views the student's detailed attempt, publishes the
result, and exports course-level results. Analytics calculate Pre/Post
averages and improvement without treating missing scores as zero.

# Appendix B — One-Sentence Product Definition

A QR-first, Coordinator-managed assessment platform for Creativa
Innovation Hub Aswan that measures learner knowledge before and after
short courses, preserves detailed attempts, supports manual essay
grading, and turns results into actionable training-impact analytics.
