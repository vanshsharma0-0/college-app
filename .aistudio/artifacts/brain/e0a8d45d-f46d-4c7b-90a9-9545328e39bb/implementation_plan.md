# Implementation Plan: Live Firebase Integration (`homeworks-b03f8`)

Connect the institutional homework application to live **Firebase Authentication** (Google Sign-In for students) and **Cloud Firestore** for real-time synchronization of users, classes (P1–C4), subject teachers, assignments, and student handwritten notebook submissions.

---

## 1. Objectives & Scope

1. **Live Firebase Configuration**: Initialize Firebase SDK using the provided configuration (`homeworks-b03f8`).
2. **Student Authentication**: Use Firebase Authentication with `signInWithPopup` and `GoogleAuthProvider`.
   - First-time student: auto-generate custom username, set password, assign class (P1–C4), and save profile to Firestore `/users`.
   - Returning student: detect existing email in Firestore, provide account recovery banner, and sign into student portal.
3. **Firestore Persistent Collections**:
   - `/classes`: Institutional class list `['P1', 'P2', 'P3', 'C1', 'C2', 'C3', 'C4']` and associated subjects.
   - `/teachers`: Subject-based faculty accounts (`hod_admin`, `teacher_chem`, `teacher_prog`, `teacher_mech`, `teacher_math`, `teacher_evs`, `teacher_phys`, `teacher_elec`).
   - `/users`: Registered student profiles with one-time class change protection.
   - `/questions`: Teacher-posted homework questions with class/subject targeting.
   - `/submissions`: Student handwritten notebook submissions containing compressed image data strings, grading status, and feedback.
4. **Auto-Seeding**: When the app initializes, check if `/classes` and `/teachers` collections are empty. If empty, auto-populate the default institutional classes and subject teacher accounts.
5. **Storage Management & Clean-Up Integration**: Connect the Developer Admin Panel (`DeveloperAdminModal.tsx`) directly to Firestore to calculate submission storage and permanently delete records and photo strings.
6. **Security Rules & Blueprint**: Define `firebase-blueprint.json` and generate `firestore.rules` adhering to the required 8 security pillars.

---

## 2. Architecture & Data Flow

```
                      +-----------------------------+
                      |       Web Application       |
                      |   (Vite + React + Tailwind) |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
    +----------------------+                    +----------------------+
    | Firebase Auth        |                    | Cloud Firestore      |
    | - Google Sign-In     |                    | - /classes           |
    | - Popup Flow         |                    | - /teachers          |
    +----------------------+                    | - /users             |
                                                | - /questions         |
                                                | - /submissions       |
                                                +----------------------+
                                                           ^
                                                           |
                                                +----------------------+
                                                | Developer Clean-Up   |
                                                | - Storage Tracking   |
                                                | - Batch Delete Docs  |
                                                +----------------------+
```

### Firestore Schema Details

1. **`users/{userId}`**
   - `uid`: string (matches Auth UID or custom ID)
   - `email`: string
   - `fullName`: string
   - `customUsername`: string (e.g. `vansh_842`)
   - `password`: string
   - `className`: 'P1' | 'P2' | 'P3' | 'C1' | 'C2' | 'C3' | 'C4'
   - `classLocked`: boolean
   - `changesRemaining`: number (1 on first login, 0 once changed)
   - `role`: 'student'
   - `createdAt`: ISO timestamp

2. **`teachers/{teacherId}`**
   - `id`: string
   - `username`: string
   - `password`: string
   - `name`: string (e.g. "Chemistry Teacher", "Programming Teacher", "HOD Admin")
   - `subject`: string (e.g. "Chemistry", "All / HOD")
   - `role`: 'teacher' | 'hod'

3. **`classes/{classId}`**
   - `id`: string (e.g. "P1", "C1")
   - `name`: string
   - `subjects`: string[]

4. **`questions/{questionId}`**
   - `id`: string
   - `title`: string
   - `description`: string
   - `subject`: string
   - `className`: string
   - `authorId`: string
   - `authorName`: string
   - `dueDate`: string
   - `createdAt`: ISO timestamp

5. **`submissions/{submissionId}`**
   - `id`: string
   - `questionId`: string
   - `studentId`: string
   - `studentName`: string
   - `customUsername`: string
   - `className`: string
   - `subject`: string
   - `photoUrl`: string (compressed base64 data string ~80–150KB)
   - `marks`: number | null
   - `feedback`: string | null
   - `status`: 'submitted' | 'graded'
   - `submittedAt`: ISO timestamp

---

## 3. Step-by-Step Implementation Tasks

### Phase 1: Firebase Configuration & SDK Initialization
- Create `/src/services/firebase.ts` exporting:
  - `app`: `initializeApp(firebaseConfig)` with the provided credentials.
  - `auth`: `getAuth(app)` with browser persistence.
  - `db`: `getFirestore(app)`.
  - `googleProvider`: `GoogleAuthProvider` configured with standard scopes.

### Phase 2: Updating `dbService` in `/src/services/storage.ts`
- Replace local-only storage mechanisms with live Firestore operations using `collection`, `doc`, `getDoc`, `getDocs`, `setDoc`, `updateDoc`, `deleteDoc`, and `query`.
- Implement automated check on startup: if `/classes` or `/teachers` has 0 documents, populate default classes (`P1`–`C4`) and institutional subject teachers.
- Keep fallback caching active in memory/localStorage so temporary offline hiccups do not break UI rendering.

### Phase 3: Updating Authentication in `/src/components/LoginPage.tsx`
- Replace simulated Google login with live `signInWithPopup(auth, googleProvider)`.
- Extract email and displayName from `userCredential.user`.
- Query Firestore `/users` by email:
  - If existing user found: automatically load custom username, log into Student Portal, and show the Account Recovery banner.
  - If new user: trigger the First-Time Student Setup modal, generate unique custom username, allow class selection [P1–C4], and commit profile to Firestore.

### Phase 4: Teacher & Student Portals Live Data Sync
- Ensure questions posted by teachers immediately write to Firestore `/questions`.
- Ensure student notebook submissions immediately write to Firestore `/submissions`.
- Ensure grading and marks awarded by teachers update the respective Firestore submission document.
- Ensure the Developer Storage Clean-Up panel lists live Firestore submissions and permanently removes deleted documents.

### Phase 5: Security Rules & Blueprint
- Create `firebase-blueprint.json` describing the schema.
- Create `firestore.rules` enforcing:
  - Student read/write access to their own user documents and question lists.
  - Submissions readable by author student and teachers, writable by student.
  - Developer/Admin deletions permitted for storage reclamation.

---

## 4. Verification & Testing Plan

1. **Compilation & Type Safety**:
   - Run `npm run build` to verify clean TypeScript compilation and bundle creation.
   - Run `npm run lint` (`tsc --noEmit`) to verify 0 syntax or type errors.
2. **Automated Unit Tests**:
   - Run existing unit test suite (`npm run test`) to ensure all data validation rules and storage calculations continue to pass.
3. **Manual / End-to-End Verification**:
   - Test Teacher login (`teacher_chem` / `teach@123`) and verify subject teacher role.
   - Test posting a new assignment to class `P1` and confirm it persists to Firestore.
   - Test student class selection constraint (one-time edit limit).
   - Test notebook submission upload and aspect ratio preservation.
   - Test Developer Storage & Clean-Up panel with PIN `2026` to verify submission storage tracking and deletion.
