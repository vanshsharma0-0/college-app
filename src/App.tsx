import { useEffect, useState, useCallback } from 'react';
import { AssignmentQuestion, AnswerSubmission, CollegeClass, TeacherAccount, User } from './types';
import { getClasses, getQuestions, getSubmissions, getTeachers, getStudents } from './services/storage';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { TeacherPortal } from './components/TeacherPortal';

type ActiveSession =
  | { type: 'student'; user: User; isRecovery?: boolean }
  | { type: 'teacher'; teacher: TeacherAccount }
  | null;

const SESSION_KEY = 'college_active_session_v1';

export default function App() {
  const [session, setSession] = useState<ActiveSession>(null);
  const [classes, setClasses] = useState<CollegeClass[]>([]);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [submissions, setSubmissions] = useState<AnswerSubmission[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Refresh data from storage
  const loadPortalData = useCallback(async () => {
    try {
      const [cls, q, subs] = await Promise.all([
        getClasses(),
        getQuestions(),
        getSubmissions(),
      ]);
      setClasses(cls);
      setQuestions(q);
      setSubmissions(subs);
    } catch (err) {
      console.error('Error fetching portal data:', err);
    }
  }, []);

  // Initial load + autostart param check
  useEffect(() => {
    const initialize = async () => {
      await loadPortalData();

      // Check URL query parameters for test automation (e.g. ?autostart=student or ?autostart=teacher)
      const urlParams = new URLSearchParams(window.location.search);
      const autostart = urlParams.get('autostart');

      if (autostart === 'student') {
        const students = await getStudents();
        if (students.length > 0) {
          setSession({ type: 'student', user: students[0], isRecovery: false });
          setIsInitializing(false);
          return;
        }
      } else if (autostart === 'teacher') {
        const teachers = await getTeachers();
        const faculty = teachers.find((t) => t.role === 'teacher') || teachers[0];
        if (faculty) {
          setSession({ type: 'teacher', teacher: faculty });
          setIsInitializing(false);
          return;
        }
      } else if (autostart === 'hod') {
        const teachers = await getTeachers();
        const hod = teachers.find((t) => t.role === 'hod') || teachers[0];
        if (hod) {
          setSession({ type: 'teacher', teacher: hod });
          setIsInitializing(false);
          return;
        }
      }

      // Check saved session in localStorage
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          setSession(JSON.parse(savedSession));
        }
      } catch (err) {
        console.warn('Session restoration error:', err);
      }

      setIsInitializing(false);
    };

    initialize();
  }, [loadPortalData]);

  // Login handlers
  const handleStudentLogin = (user: User, isRecovery = false) => {
    const newSession: ActiveSession = { type: 'student', user, isRecovery };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    loadPortalData();
  };

  const handleTeacherLogin = (teacher: TeacherAccount) => {
    const newSession: ActiveSession = { type: 'teacher', teacher };
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    loadPortalData();
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
    // Remove autostart query param from URL if present
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EA580C] text-white flex items-center justify-center font-bold text-lg animate-pulse">
            CA
          </div>
          <div className="text-xs font-semibold text-slate-500">Loading College Portal...</div>
        </div>
      </div>
    );
  }

  // Route: Student Portal
  if (session && session.type === 'student') {
    return (
      <StudentPortal
        student={session.user}
        isRecovery={session.isRecovery}
        classes={classes}
        questions={questions}
        submissions={submissions}
        onLogout={handleLogout}
        onRefreshData={loadPortalData}
      />
    );
  }

  // Route: Teacher Portal
  if (session && session.type === 'teacher') {
    return (
      <TeacherPortal
        teacher={session.teacher}
        classes={classes}
        questions={questions}
        submissions={submissions}
        onLogout={handleLogout}
        onRefreshData={loadPortalData}
      />
    );
  }

  // Route: Login Page
  return (
    <LoginPage
      classes={classes}
      onStudentLogin={handleStudentLogin}
      onTeacherLogin={handleTeacherLogin}
    />
  );
}
