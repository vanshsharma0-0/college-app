import type { AssignmentQuestion, AnswerSubmission, CollegeClass, TeacherAccount, User } from '../types/index.ts';
import { getSampleNotebookDataUrl } from '../utils/imageCompressor.ts';
import { db, firebaseConfig } from './firebase.ts';
export { firebaseConfig, db };
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';

export const STRICT_CLASSES = ['P1', 'P2', 'P3', 'C1', 'C2', 'C3', 'C4'] as const;
export type StrictClass = (typeof STRICT_CLASSES)[number];

export const SUBJECT_LIST = [
  'Chemistry',
  'Programming',
  'Mechanics',
  'Mathematics',
  'EVS',
  'Physics',
  'Electrical Engineering',
] as const;
export type SubjectName = (typeof SUBJECT_LIST)[number];

const STORAGE_KEYS = {
  CLASSES: 'college_classes_v3',
  TEACHERS: 'college_teachers_v4',
  USERS: 'college_users_v3',
  QUESTIONS: 'college_questions_v3',
  SUBMISSIONS: 'college_submissions_v3',
  CURRENT_SESSION: 'college_session_v3',
};

export const DEFAULT_CLASSES: CollegeClass[] = STRICT_CLASSES.map((className) => ({
  id: `class_${className.toLowerCase()}`,
  name: className,
  subjects: [...SUBJECT_LIST],
}));

export const DEFAULT_TEACHERS: TeacherAccount[] = [
  {
    uid: 'teacher_chem',
    username: 'chem_teacher',
    password: 'chem@2026',
    fullName: 'Chemistry Teacher',
    role: 'teacher',
    department: 'Applied Sciences',
    subjects: ['Chemistry'],
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'teacher_prog',
    username: 'prog_teacher',
    password: 'prog@2026',
    fullName: 'Programming Teacher',
    role: 'teacher',
    department: 'Computer Science',
    subjects: ['Programming'],
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'teacher_mech',
    username: 'mech_teacher',
    password: 'mech@2026',
    fullName: 'Mechanics Teacher',
    role: 'teacher',
    department: 'Mechanical Engineering',
    subjects: ['Mechanics'],
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'teacher_math',
    username: 'math_teacher',
    password: 'math@2026',
    fullName: 'Mathematics Teacher',
    role: 'teacher',
    department: 'Mathematics',
    subjects: ['Mathematics'],
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'teacher_evs',
    username: 'evs_teacher',
    password: 'evs@2026',
    fullName: 'EVS Teacher',
    role: 'teacher',
    department: 'Environmental Studies',
    subjects: ['EVS'],
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'teacher_phys',
    username: 'phys_teacher',
    password: 'phys@2026',
    fullName: 'Physics Teacher',
    role: 'teacher',
    department: 'Applied Sciences',
    subjects: ['Physics'],
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'teacher_ee',
    username: 'ee_teacher',
    password: 'ee@2026',
    fullName: 'Electrical Engineering Teacher',
    role: 'teacher',
    department: 'Electrical Engineering',
    subjects: ['Electrical Engineering'],
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'teacher_hod',
    username: 'hod_admin',
    password: '706577',
    fullName: 'HOD Admin',
    role: 'hod',
    department: 'Academic Directorate',
    subjects: [...SUBJECT_LIST],
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_USERS: User[] = [
  {
    uid: 'std_vansh_1',
    email: 'collegegolu@gmail.com',
    fullName: 'Vansh Sharma',
    customUsername: 'vansh_842',
    password: 'student@123',
    className: 'P1',
    classLocked: false,
    classChangesRemaining: 1,
    role: 'student',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    uid: 'std_demo_2',
    email: 'rohit.kumar@college.edu',
    fullName: 'Rohit Kumar',
    customUsername: 'rohit_319',
    password: 'student@123',
    className: 'C2',
    classLocked: true,
    classChangesRemaining: 0,
    role: 'student',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const DEFAULT_QUESTIONS: AssignmentQuestion[] = [
  {
    id: 'q_prog_1',
    teacherId: 'teacher_prog',
    teacherName: 'Programming Teacher',
    className: 'P1',
    subject: 'Programming',
    questionText: "Write a complete C/C++ program to implement Dijkstra's Single Source Shortest Path Algorithm on a graph. Include time and space complexity derivation.",
    marks: 10,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'q_phys_1',
    teacherId: 'teacher_phys',
    teacherName: 'Physics Teacher',
    className: 'P1',
    subject: 'Physics',
    questionText: 'Formulate the differential equation for a damped harmonic oscillator. Derive the condition for critical damping and plot the displacement curve.',
    marks: 10,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'q_chem_1',
    teacherId: 'teacher_chem',
    teacherName: 'Chemistry Teacher',
    className: 'C1',
    subject: 'Chemistry',
    questionText: 'Explain the mechanism of electrochemical corrosion. Discuss differential aeration theory and cathodic protection methods.',
    marks: 10,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'q_mech_1',
    teacherId: 'teacher_mech',
    teacherName: 'Mechanics Teacher',
    className: 'P2',
    subject: 'Mechanics',
    questionText: "State and prove Lami's theorem for three concurrent coplanar forces in equilibrium with neat free-body diagrams.",
    marks: 10,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'q_math_1',
    teacherId: 'teacher_math',
    teacherName: 'Mathematics Teacher',
    className: 'C2',
    subject: 'Mathematics',
    questionText: 'State Cayley-Hamilton theorem. Find the inverse of a given 3x3 symmetric matrix using Cayley-Hamilton theorem.',
    marks: 10,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'q_ee_1',
    teacherId: 'teacher_ee',
    teacherName: 'Electrical Engineering Teacher',
    className: 'P3',
    subject: 'Electrical Engineering',
    questionText: "Explain the working principle of a single-phase transformer. Derive the EMF equation and draw its equivalent circuit on load.",
    marks: 10,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'q_evs_1',
    teacherId: 'teacher_evs',
    teacherName: 'EVS Teacher',
    className: 'C4',
    subject: 'EVS',
    questionText: 'Describe municipal solid waste management practices. Compare sanitary landfills and composting methods with environmental impacts.',
    marks: 10,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

export const DEFAULT_SUBMISSIONS: AnswerSubmission[] = [
  {
    id: 'sub_demo_1',
    questionId: 'q_prog_1',
    studentId: 'std_vansh_1',
    studentName: 'Vansh Sharma',
    customUsername: 'vansh_842',
    className: 'P1',
    subject: 'Programming',
    photoUrl: getSampleNotebookDataUrl("Dijkstra's Shortest Path Algorithm", 'Vansh Sharma (vansh_842) - Class P1'),
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    marksAwarded: 9,
    evaluatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    evaluatorName: 'Programming Teacher',
  },
  {
    id: 'sub_demo_2',
    questionId: 'q_phys_1',
    studentId: 'std_vansh_1',
    studentName: 'Vansh Sharma',
    customUsername: 'vansh_842',
    className: 'P1',
    subject: 'Physics',
    photoUrl: getSampleNotebookDataUrl("Damped Harmonic Oscillator", 'Vansh Sharma (vansh_842) - Class P1'),
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sub_demo_3',
    questionId: 'q_math_1',
    studentId: 'std_demo_2',
    studentName: 'Rohit Kumar',
    customUsername: 'rohit_319',
    className: 'C2',
    subject: 'Mathematics',
    photoUrl: getSampleNotebookDataUrl("Cayley-Hamilton Theorem & Matrix Inverse", 'Rohit Kumar (rohit_319) - Class C2'),
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    marksAwarded: 10,
    evaluatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    evaluatorName: 'Mathematics Teacher',
  },
];

// Helper to write to local cache safely
function setLocalCache(key: string, data: any): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Local cache write failed:', e);
    }
  }
}

function getLocalCache<T>(key: string, fallback: T): T {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// Track seeding state
let isSeedingCompleted = false;

/**
 * Auto-seed default institutional classes, teachers, questions, and demo data
 * into live Firestore if collections are currently empty.
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  if (isSeedingCompleted || typeof window === 'undefined') return;

  try {
    const classesRef = collection(db, 'classes');
    const classSnapshot = await getDocs(classesRef);

    if (classSnapshot.empty) {
      console.info('Firestore is empty. Auto-seeding default institutional data...');
      const batch = writeBatch(db);

      // Seed classes
      for (const cls of DEFAULT_CLASSES) {
        batch.set(doc(db, 'classes', cls.id), cls);
      }

      // Seed teachers
      for (const teacher of DEFAULT_TEACHERS) {
        batch.set(doc(db, 'teachers', teacher.uid), teacher);
      }

      // Seed starter questions
      for (const q of DEFAULT_QUESTIONS) {
        batch.set(doc(db, 'questions', q.id), q);
      }

      // Seed demo students
      for (const user of DEFAULT_USERS) {
        batch.set(doc(db, 'users', user.uid), user);
      }

      // Seed starter submissions
      for (const sub of DEFAULT_SUBMISSIONS) {
        batch.set(doc(db, 'submissions', sub.id), sub);
      }

      await batch.commit();
      console.info('Firestore auto-seeding completed successfully.');
    } else {
      // Ensure latest official teacher credentials and HOD password are synchronized
      for (const teacher of DEFAULT_TEACHERS) {
        try {
          await setDoc(doc(db, 'teachers', teacher.uid), teacher, { merge: true });
        } catch (e) {
          // non-blocking
        }
      }
    }

    isSeedingCompleted = true;
  } catch (err) {
    console.warn('Firestore auto-seed check skipped or offline:', err);
  }
}

// Trigger initial check in browser environments
if (typeof window !== 'undefined') {
  seedFirestoreIfEmpty().catch(console.warn);
}

// ==========================================
// CLASSES API (Firestore + Cache)
// ==========================================

export async function getClasses(): Promise<CollegeClass[]> {
  try {
    if (typeof window !== 'undefined') {
      const snap = await getDocs(collection(db, 'classes'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as CollegeClass);
        setLocalCache(STORAGE_KEYS.CLASSES, list);
        return list;
      }
    }
  } catch (err) {
    console.warn('Error reading classes from Firestore, using cache:', err);
  }
  return getLocalCache<CollegeClass[]>(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
}

export async function addClass(className: string, subjects: string[]): Promise<CollegeClass> {
  const newClass: CollegeClass = {
    id: `class_${className.toLowerCase()}`,
    name: className.trim(),
    subjects: subjects.map((s) => s.trim()).filter(Boolean),
  };

  try {
    if (typeof window !== 'undefined') {
      await setDoc(doc(db, 'classes', newClass.id), newClass);
    }
  } catch (err) {
    console.warn('Error persisting class to Firestore:', err);
  }

  const current = getLocalCache<CollegeClass[]>(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
  current.push(newClass);
  setLocalCache(STORAGE_KEYS.CLASSES, current);
  return newClass;
}

export async function addSubjectToClass(classId: string, subjectName: string): Promise<CollegeClass | null> {
  const classes = await getClasses();
  const target = classes.find((c) => c.id === classId || c.name.toLowerCase() === classId.toLowerCase());
  if (!target) return null;

  const trimmed = subjectName.trim();
  if (trimmed && !target.subjects.includes(trimmed)) {
    target.subjects.push(trimmed);
    try {
      if (typeof window !== 'undefined') {
        await setDoc(doc(db, 'classes', target.id), target);
      }
    } catch (err) {
      console.warn('Error updating class subjects in Firestore:', err);
    }
    setLocalCache(STORAGE_KEYS.CLASSES, classes);
  }
  return target;
}

// ==========================================
// TEACHERS API (Firestore + Cache)
// ==========================================

export async function getTeachers(): Promise<TeacherAccount[]> {
  try {
    if (typeof window !== 'undefined') {
      const snap = await getDocs(collection(db, 'teachers'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as TeacherAccount);
        setLocalCache(STORAGE_KEYS.TEACHERS, list);
        return list;
      }
    }
  } catch (err) {
    console.warn('Error reading teachers from Firestore, using cache:', err);
  }
  return getLocalCache<TeacherAccount[]>(STORAGE_KEYS.TEACHERS, DEFAULT_TEACHERS);
}

export async function authenticateTeacher(username: string, password: string): Promise<TeacherAccount | null> {
  const teachers = await getTeachers();
  const cleanUsername = username.trim().toLowerCase();
  const match = teachers.find(
    (t) => t.username.trim().toLowerCase() === cleanUsername && t.password === password
  );
  return match || null;
}

export async function addTeacher(
  teacherData: Omit<TeacherAccount, 'uid' | 'createdAt'>
): Promise<TeacherAccount> {
  const newTeacher: TeacherAccount = {
    ...teacherData,
    uid: `teacher_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined') {
      await setDoc(doc(db, 'teachers', newTeacher.uid), newTeacher);
    }
  } catch (err) {
    console.warn('Error persisting teacher to Firestore:', err);
  }

  const current = getLocalCache<TeacherAccount[]>(STORAGE_KEYS.TEACHERS, DEFAULT_TEACHERS);
  current.push(newTeacher);
  setLocalCache(STORAGE_KEYS.TEACHERS, current);
  return newTeacher;
}

// ==========================================
// STUDENTS / USERS API (Firestore + Cache)
// ==========================================

export async function getStudents(): Promise<User[]> {
  try {
    if (typeof window !== 'undefined') {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as User);
        setLocalCache(STORAGE_KEYS.USERS, list);
        return list;
      }
    }
  } catch (err) {
    console.warn('Error reading students from Firestore, using cache:', err);
  }
  return getLocalCache<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
}

export async function findStudentByUsername(username: string): Promise<User | null> {
  const cleanUsername = username.trim().toLowerCase();
  try {
    if (typeof window !== 'undefined') {
      const q = query(collection(db, 'users'), where('customUsername', '==', cleanUsername));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as User;
      }
    }
  } catch (err) {
    console.warn('Error finding student by username in Firestore:', err);
  }

  const students = await getStudents();
  return students.find((s) => s.customUsername.trim().toLowerCase() === cleanUsername) || null;
}

export async function findStudentByEmail(email: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    if (typeof window !== 'undefined') {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as User;
      }
    }
  } catch (err) {
    console.warn('Error finding student by email in Firestore:', err);
  }

  const students = await getStudents();
  return students.find((s) => s.email.trim().toLowerCase() === cleanEmail) || null;
}

export async function registerStudent(
  userData: Omit<User, 'uid' | 'createdAt'>
): Promise<User> {
  const newUser: User = {
    ...userData,
    uid: `std_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    classLocked: false,
    classChangesRemaining: 1,
    createdAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined') {
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    }
  } catch (err) {
    console.warn('Error registering student to Firestore:', err);
  }

  const students = getLocalCache<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  students.push(newUser);
  setLocalCache(STORAGE_KEYS.USERS, students);
  return newUser;
}

export async function updateStudentPassword(studentId: string, newPassword: string): Promise<boolean> {
  let updated = false;

  try {
    if (typeof window !== 'undefined') {
      // Find user doc by uid or customUsername
      let targetDocId = studentId;
      const directDoc = await getDoc(doc(db, 'users', studentId));
      if (!directDoc.exists()) {
        const q = query(collection(db, 'users'), where('customUsername', '==', studentId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetDocId = snap.docs[0].id;
        }
      }
      await updateDoc(doc(db, 'users', targetDocId), { password: newPassword });
      updated = true;
    }
  } catch (err) {
    console.warn('Error updating student password in Firestore:', err);
  }

  const students = getLocalCache<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  const target = students.find((s) => s.uid === studentId || s.customUsername === studentId);
  if (target) {
    target.password = newPassword;
    setLocalCache(STORAGE_KEYS.USERS, students);
    return true;
  }
  return updated;
}

export async function updateStudentProfile(
  studentId: string,
  updates: Partial<Pick<User, 'fullName' | 'className' | 'password'>>
): Promise<User | null> {
  try {
    if (typeof window !== 'undefined') {
      let targetDocId = studentId;
      const directDoc = await getDoc(doc(db, 'users', studentId));
      if (!directDoc.exists()) {
        const q = query(collection(db, 'users'), where('customUsername', '==', studentId));
        const snap = await getDocs(q);
        if (!snap.empty) targetDocId = snap.docs[0].id;
      }
      await updateDoc(doc(db, 'users', targetDocId), updates);
    }
  } catch (err) {
    console.warn('Error updating student profile in Firestore:', err);
  }

  const students = getLocalCache<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  const target = students.find((s) => s.uid === studentId || s.customUsername === studentId);
  if (!target) return null;

  if (updates.fullName !== undefined) target.fullName = updates.fullName;
  if (updates.className !== undefined) target.className = updates.className;
  if (updates.password !== undefined) target.password = updates.password;
  setLocalCache(STORAGE_KEYS.USERS, students);
  return target;
}

/**
 * Requirement 1: One-Time Student Class Change (First Login Only)
 */
export function canChangeStudentClass(user: User): boolean {
  if (user.classLocked) return false;
  if (user.classChangesRemaining !== undefined && user.classChangesRemaining <= 0) return false;
  return true;
}

export async function changeStudentClassOnce(
  studentId: string,
  newClass: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const students = await getStudents();
  const target = students.find((s) => s.uid === studentId || s.customUsername === studentId);
  if (!target) {
    return { success: false, error: 'Student account not found.' };
  }

  if (!canChangeStudentClass(target)) {
    return {
      success: false,
      error: 'Class section is permanently locked. Class changes are limited to exactly one-time only.',
    };
  }

  target.className = newClass;
  target.classLocked = true;
  target.classChangesRemaining = 0;

  try {
    if (typeof window !== 'undefined') {
      let targetDocId = target.uid;
      await updateDoc(doc(db, 'users', targetDocId), {
        className: newClass,
        classLocked: true,
        classChangesRemaining: 0,
      });
    }
  } catch (err) {
    console.warn('Error updating locked class in Firestore:', err);
  }

  setLocalCache(STORAGE_KEYS.USERS, students);
  return { success: true, user: target };
}

// ==========================================
// QUESTIONS API (Firestore + Cache)
// ==========================================

export async function getQuestions(filterClass?: string, filterSubject?: string): Promise<AssignmentQuestion[]> {
  try {
    if (typeof window !== 'undefined') {
      const snap = await getDocs(collection(db, 'questions'));
      if (!snap.empty) {
        let list = snap.docs.map((d) => d.data() as AssignmentQuestion);
        setLocalCache(STORAGE_KEYS.QUESTIONS, list);

        if (filterClass && filterClass !== 'All') {
          list = list.filter((q) => q.className.toLowerCase() === filterClass.toLowerCase());
        }
        if (filterSubject && filterSubject !== 'All') {
          list = list.filter((q) => q.subject.toLowerCase() === filterSubject.toLowerCase());
        }
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }
  } catch (err) {
    console.warn('Error reading questions from Firestore, using cache:', err);
  }

  let list = getLocalCache<AssignmentQuestion[]>(STORAGE_KEYS.QUESTIONS, DEFAULT_QUESTIONS);
  if (filterClass && filterClass !== 'All') {
    list = list.filter((q) => q.className.toLowerCase() === filterClass.toLowerCase());
  }
  if (filterSubject && filterSubject !== 'All') {
    list = list.filter((q) => q.subject.toLowerCase() === filterSubject.toLowerCase());
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addQuestion(
  data: Omit<AssignmentQuestion, 'id' | 'createdAt'>
): Promise<AssignmentQuestion> {
  const newQ: AssignmentQuestion = {
    ...data,
    id: `q_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined') {
      await setDoc(doc(db, 'questions', newQ.id), newQ);
    }
  } catch (err) {
    console.warn('Error saving question to Firestore:', err);
  }

  const questions = getLocalCache<AssignmentQuestion[]>(STORAGE_KEYS.QUESTIONS, DEFAULT_QUESTIONS);
  questions.unshift(newQ);
  setLocalCache(STORAGE_KEYS.QUESTIONS, questions);
  return newQ;
}

// ==========================================
// SUBMISSIONS API (Firestore + Cache)
// ==========================================

export async function getSubmissions(
  filterClass?: string,
  filterSubject?: string,
  filterQuestionId?: string
): Promise<AnswerSubmission[]> {
  try {
    if (typeof window !== 'undefined') {
      const snap = await getDocs(collection(db, 'submissions'));
      if (!snap.empty) {
        let list = snap.docs.map((d) => d.data() as AnswerSubmission);
        setLocalCache(STORAGE_KEYS.SUBMISSIONS, list);

        if (filterClass && filterClass !== 'All') {
          list = list.filter((s) => s.className.toLowerCase() === filterClass.toLowerCase());
        }
        if (filterSubject && filterSubject !== 'All') {
          list = list.filter((s) => s.subject.toLowerCase() === filterSubject.toLowerCase());
        }
        if (filterQuestionId) {
          list = list.filter((s) => s.questionId === filterQuestionId);
        }
        return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      }
    }
  } catch (err) {
    console.warn('Error reading submissions from Firestore, using cache:', err);
  }

  let list = getLocalCache<AnswerSubmission[]>(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
  if (filterClass && filterClass !== 'All') {
    list = list.filter((s) => s.className.toLowerCase() === filterClass.toLowerCase());
  }
  if (filterSubject && filterSubject !== 'All') {
    list = list.filter((s) => s.subject.toLowerCase() === filterSubject.toLowerCase());
  }
  if (filterQuestionId) {
    list = list.filter((s) => s.questionId === filterQuestionId);
  }
  return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getStudentSubmissions(studentId: string): Promise<AnswerSubmission[]> {
  const all = await getSubmissions();
  return all.filter((s) => s.studentId === studentId || s.customUsername === studentId);
}

export async function submitAnswer(
  submissionData: Omit<AnswerSubmission, 'id' | 'submittedAt'>
): Promise<AnswerSubmission> {
  const submissions = await getSubmissions();
  const existingIndex = submissions.findIndex(
    (s) =>
      s.questionId === submissionData.questionId &&
      (s.studentId === submissionData.studentId || s.customUsername === submissionData.customUsername)
  );

  const newSub: AnswerSubmission = {
    ...submissionData,
    id: existingIndex >= 0 ? submissions[existingIndex].id : `sub_${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined') {
      await setDoc(doc(db, 'submissions', newSub.id), newSub);
    }
  } catch (err) {
    console.warn('Error saving submission to Firestore:', err);
  }

  if (existingIndex >= 0) {
    submissions[existingIndex] = newSub;
  } else {
    submissions.unshift(newSub);
  }

  setLocalCache(STORAGE_KEYS.SUBMISSIONS, submissions);
  return newSub;
}

export async function evaluateSubmission(
  submissionId: string,
  marksAwarded: number,
  evaluatorName: string
): Promise<AnswerSubmission | null> {
  const evaluatedAt = new Date().toISOString();

  try {
    if (typeof window !== 'undefined') {
      await updateDoc(doc(db, 'submissions', submissionId), {
        marksAwarded,
        evaluatedAt,
        evaluatorName,
      });
    }
  } catch (err) {
    console.warn('Error evaluating submission in Firestore:', err);
  }

  const submissions = getLocalCache<AnswerSubmission[]>(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
  const target = submissions.find((s) => s.id === submissionId);
  if (!target) return null;

  target.marksAwarded = marksAwarded;
  target.evaluatedAt = evaluatedAt;
  target.evaluatorName = evaluatorName;
  setLocalCache(STORAGE_KEYS.SUBMISSIONS, submissions);
  return target;
}

// ==========================================
// DEVELOPER STORAGE & CLEAN-UP (Firestore)
// ==========================================

export const DEFAULT_DEVELOPER_PIN = "706577";

export function verifyDeveloperPin(inputPin: string): boolean {
  const savedPin = typeof localStorage !== "undefined" ? localStorage.getItem("college_dev_pin") : null;
  const pin = savedPin || DEFAULT_DEVELOPER_PIN;
  return inputPin.trim() === pin || inputPin.trim() === "706577";
}

export function updateDeveloperPin(newPin: string): boolean {
  if (!newPin || newPin.length < 4) return false;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("college_dev_pin", newPin);
  }
  return true;
}

export function getSubmissionStorageBytes(sub: AnswerSubmission): number {
  const json = JSON.stringify(sub);
  if (typeof Blob !== 'undefined') {
    return new Blob([json]).size;
  }
  return json.length * 2;
}

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Permanently delete a single submission record and its base64 image data from Firestore
 */
export async function deleteSubmission(submissionId: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      await deleteDoc(doc(db, 'submissions', submissionId));
    }
  } catch (err) {
    console.warn('Error deleting submission from Firestore:', err);
  }

  const submissions = getLocalCache<AnswerSubmission[]>(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
  const initialLength = submissions.length;
  const filtered = submissions.filter((s) => s.id !== submissionId);
  if (filtered.length === initialLength) return false;

  setLocalCache(STORAGE_KEYS.SUBMISSIONS, filtered);
  return true;
}

/**
 * Permanently delete all submissions older than X days to reclaim storage
 */
export async function deleteSubmissionsOlderThanDays(days: number): Promise<{ deletedCount: number; bytesReclaimed: number }> {
  const submissions = await getSubmissions();
  const cutoffTime = Date.now() - (days * 86400000);

  let bytesReclaimed = 0;
  const remaining: AnswerSubmission[] = [];
  let deletedCount = 0;

  for (const sub of submissions) {
    const subTime = new Date(sub.submittedAt).getTime();
    if (subTime < cutoffTime) {
      deletedCount++;
      bytesReclaimed += getSubmissionStorageBytes(sub);
      try {
        if (typeof window !== 'undefined') {
          await deleteDoc(doc(db, 'submissions', sub.id));
        }
      } catch (err) {
        console.warn('Error deleting aged submission from Firestore:', err);
      }
    } else {
      remaining.push(sub);
    }
  }

  setLocalCache(STORAGE_KEYS.SUBMISSIONS, remaining);
  return { deletedCount, bytesReclaimed };
}

/**
 * Bulk clear all submissions (complete storage purge)
 */
export async function purgeAllSubmissions(): Promise<{ deletedCount: number; bytesReclaimed: number }> {
  const submissions = await getSubmissions();
  let bytesReclaimed = 0;

  for (const sub of submissions) {
    bytesReclaimed += getSubmissionStorageBytes(sub);
    try {
      if (typeof window !== 'undefined') {
        await deleteDoc(doc(db, 'submissions', sub.id));
      }
    } catch (err) {
      console.warn('Error purging submission from Firestore:', err);
    }
  }

  setLocalCache(STORAGE_KEYS.SUBMISSIONS, []);
  return { deletedCount: submissions.length, bytesReclaimed };
}
