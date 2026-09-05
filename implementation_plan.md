# Firebase Migration Implementation Plan
## Creativa Assessment Portal — localStorage → Firebase

**Goal:** Migrate the Creativa Assessment Portal from the monolithic `localStorage` simulation layer ([db.ts](file:///d:/creativa-assessment-portal/src/services/db.ts)) to Firebase (Firestore + Firebase Auth), preserving existing UI flows, components, and scoring mechanics.

---

## Current Status & Credentials Acquired

The Firebase MCP connection is active and authenticated as `prof.yousefehab@gmail.com`.
The active project is **`assessmentcreativa`** on the **Spark plan** (Free tier).

A Web App has been registered and verified via Firebase MCP:
- **Project ID:** `assessmentcreativa`
- **App ID:** `1:351789862878:web:573b29815f8fcac4e2974f`
- **Auth Domain:** `assessmentcreativa.firebaseapp.com`
- **Storage Bucket:** `assessmentcreativa.firebasestorage.app`
- **Messaging Sender ID:** `351789862878`
- **Measurement ID:** `G-HEFPQ9DHHB`

---

## Architectural Decisions & Strategy

1. **Spark Plan Compatibility:**
   - Client-side countdown backed by Firestore `startedAt` and server timestamps (`serverTimestamp()`), avoiding the need for Blaze-tier Cloud Functions.
2. **Coordinator Authentication:**
   - Firebase Authentication with Email & Password.
   - Built-in session state via `onAuthStateChanged` to replace polling.
3. **Student Access:**
   - Unauthenticated student test sessions using unique `publicToken` and `studentId` validation.
   - 45s heartbeat in Firestore to detect multi-tab/device collisions.
4. **Service Modularization:**
   - Replace 1,419-line `db.ts` with dedicated service modules:
     - `categoryService.ts`
     - `courseService.ts`
     - `assessmentService.ts`
     - `studentService.ts`
     - `attemptService.ts`
     - `gradingService.ts`
     - `analyticsService.ts`
     - `auditService.ts`
     - `auth.ts`
5. **Seed Data:**
   - A one-time idempotency-guaranteed script (`seedFirestore.ts`) will populate Firestore with existing seed courses, assessments, and sample questions.

---

## Proposed Changes

### Phase 1 — Environment & SDK Setup
#### [MODIFY] [package.json](file:///d:/creativa-assessment-portal/package.json)
- Add `firebase` (^10.x / ^11.x) to dependencies.
- Run package installation.

#### [NEW] [.env](file:///d:/creativa-assessment-portal/.env) & [.env.local](file:///d:/creativa-assessment-portal/.env.local)
- Populate Vite environment variables with acquired Firebase credentials:
  ```env
  VITE_FIREBASE_API_KEY=AIzaSyDNpaCx0RBWmoL0qEjZIlBr-31VtzcfLkc
  VITE_FIREBASE_AUTH_DOMAIN=assessmentcreativa.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=assessmentcreativa
  VITE_FIREBASE_STORAGE_BUCKET=assessmentcreativa.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID=351789862878
  VITE_FIREBASE_APP_ID=1:351789862878:web:573b29815f8fcac4e2974f
  VITE_FIREBASE_MEASUREMENT_ID=G-HEFPQ9DHHB
  ```

#### [NEW] [src/services/firebase.ts](file:///d:/creativa-assessment-portal/src/services/firebase.ts)
- Initialize Firebase App, Firestore instance (`db`), and Auth instance (`auth`).

---

### Phase 2 — Security Rules & Indexes
#### [NEW] [firestore.rules](file:///d:/creativa-assessment-portal/firestore.rules)
- Implement access rules for:
  - `courses`, `assessments`, `assessmentVersions`, `categories`, `auditLogs`: Authenticated coordinator read/write.
  - `students`: Public write (registration), coordinator read.
  - `attempts`: Read/write allowed for active student session and coordinators.
  - `publishedResults`: Public read, coordinator write.

#### [NEW] [firestore.indexes.json](file:///d:/creativa-assessment-portal/firestore.indexes.json)
- Composite indexes for:
  - `assessments`: `courseId ASC, type ASC`
  - `attempts`: `studentId ASC, assessmentId ASC, attemptNumber DESC`
  - `attempts`: `courseId ASC, assessmentType ASC`

#### [NEW] [firebase.json](file:///d:/creativa-assessment-portal/firebase.json)
- Link Firestore rules, indexes, and Vite hosting configuration (`dist` directory).

---

### Phase 3 — Coordinator Authentication
#### [NEW] [src/services/auth.ts](file:///d:/creativa-assessment-portal/src/services/auth.ts)
- Implement `signInWithEmailAndPassword`, `signOut`, and `onAuthStateChanged` wrapper.
- Provide initial coordinator setup helper or fallback login check.

#### [MODIFY] [src/App.tsx](file:///d:/creativa-assessment-portal/src/App.tsx)
- Replace localStorage polling with `onAuthStateChanged` listener.

---

### Phase 4 — Modularized Service Layer
Refactor and split `db.ts` into individual typed modules in `src/services/`:
- [NEW] `src/services/categoryService.ts`
- [NEW] `src/services/courseService.ts`
- [NEW] `src/services/assessmentService.ts`
- [NEW] `src/services/studentService.ts`
- [NEW] `src/services/attemptService.ts`
- [NEW] `src/services/gradingService.ts`
- [NEW] `src/services/analyticsService.ts`
- [NEW] `src/services/auditService.ts`
- [MODIFY] `src/services/db.ts` (re-export functions for backward compatibility where needed).

---

### Phase 5 — Real-time Subscriptions & Reactive Hooks
#### [NEW] [src/hooks/useFirestoreQuery.ts](file:///d:/creativa-assessment-portal/src/hooks/useFirestoreQuery.ts)
- Generic subscription hook with loading and error states.

#### [NEW] [src/hooks/useFirestoreDoc.ts](file:///d:/creativa-assessment-portal/src/hooks/useFirestoreDoc.ts)
- Document subscription hook for real-time single attempt/assessment sync.

#### [MODIFY] Coordinator & Student Views
- Connect `DashboardView.tsx`, `CoursesView.tsx`, `CourseDetailView.tsx`, and `TestRunner.tsx` to async Firebase services with optimistic UI updates.

---

### Phase 6 — Seed Data Migration
#### [NEW] [src/scripts/seedFirestore.ts](file:///d:/creativa-assessment-portal/src/scripts/seedFirestore.ts)
- Automated idempotent seed script reading [seedData.ts](file:///d:/creativa-assessment-portal/src/data/seedData.ts) and batch-writing to Firestore.

---

## Verification Plan

### Automated Tests & Quality Checks
- `npm run lint` (`tsc --noEmit`) to verify strict TypeScript type integrity after every phase.
- `npm run build` to ensure clean bundle compilation without errors.

### Runtime Verification
- Coordinator login/logout via Firebase Auth.
- Course creation and assessment publishing synced with Firestore.
- Student test initiation, auto-save heartbeat, and result submission.
- Firestore console inspection of real-time writes.
