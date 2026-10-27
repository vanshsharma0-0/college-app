import React, { useState } from 'react';
import { CollegeClass, TeacherAccount, User } from '../types';
import { authenticateTeacher, findStudentByUsername } from '../services/storage';
import { DeveloperCard } from './DeveloperCard';
import { GoogleSignInModal } from './GoogleSignInModal';
import { RDECLogo } from './RDECLogo';
import { GraduationCap, BookOpen, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  classes: CollegeClass[];
  onStudentLogin: (user: User, isRecovery?: boolean) => void;
  onTeacherLogin: (teacher: TeacherAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  classes,
  onStudentLogin,
  onTeacherLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');

  // Student form state
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Teacher form state
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Student username/password sign in
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = studentUsername.trim().toLowerCase();
    if (!trimmedUsername || !studentPassword) {
      setErrorMessage('Please enter your Custom Username and Password');
      return;
    }

    setIsLoading(true);
    try {
      const student = await findStudentByUsername(trimmedUsername);
      if (!student) {
        setErrorMessage('Student not found. If this is your first time, click "Sign in with Google" below.');
        setIsLoading(false);
        return;
      }

      if (student.password && student.password !== studentPassword) {
        setErrorMessage('Incorrect password. Click "Sign in with Google" below to recover your account.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onStudentLogin(student, false);
    } catch {
      setErrorMessage('Error logging in. Please try again.');
      setIsLoading(false);
    }
  };

  // Teacher username/password sign in (Strictly only username and password, NO Google sign-in)
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUsername = teacherUsername.trim();
    if (!trimmedUsername || !teacherPassword) {
      setErrorMessage('Please enter Teacher Username and Password');
      return;
    }

    setIsLoading(true);
    try {
      const teacher = await authenticateTeacher(trimmedUsername, teacherPassword);
      if (!teacher) {
        setErrorMessage('Invalid teacher username or password.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onTeacherLogin(teacher);
    } catch {
      setErrorMessage('Error signing in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-4 sm:p-6 relative">
      {/* Top Brand Banner */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <RDECLogo size={46} showBorder />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">College work Portal</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                RDEC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">R.D. Engineering College, Ghaziabad</p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-xs font-semibold text-slate-700">Academic Year 2026–27</div>
          <div className="text-[11px] text-slate-400">Institutional Homework &amp; Evaluation Platform</div>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="w-full max-w-md mx-auto my-6 sm:my-8">
        {/* Centered RDEC Crest Logo (~64px) & Institutional Headline */}
        <div className="flex flex-col items-center justify-center text-center mb-4">
          <RDECLogo size={64} showBorder className="mb-2 shadow-sm" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">R.D. Engineering College, Ghaziabad</h2>
          <p className="text-xs text-slate-500">College work Portal &bull; Official Student &amp; Faculty Access</p>
        </div>

        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
          {/* Two-tab Switcher at the top */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#EA580C]" />
              Student Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'teacher'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#EA580C]" />
              Teacher Sign In
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Option A: Student Sign In */}
          {activeTab === 'student' && (
            <div className="space-y-4">
              <form onSubmit={handleStudentSubmit} className="space-y-3">
                <div>
                  <label htmlFor="student-username" className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Username
                  </label>
                  <input
                    id="student-username"
                    type="text"
                    value={studentUsername}
                    onChange={(e) => setStudentUsername(e.target.value)}
                    required
                    placeholder="e.g. vansh_842"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="student-password" className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="student-password"
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#EA580C] text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 mt-1"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              {/* Single button directly below as strictly requested */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-300 text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google (First Time / Forgot Username or Password)</span>
                </button>
              </div>
            </div>
          )}

          {/* Option B: Teacher Sign In (Strictly ONLY two fields, NO Google Sign-In) */}
          {activeTab === 'teacher' && (
            <div className="space-y-4">
              <form onSubmit={handleTeacherSubmit} className="space-y-3">
                <div>
                  <label htmlFor="teacher-username" className="block text-xs font-semibold text-slate-700 mb-1">
                    Teacher Username
                  </label>
                  <input
                    id="teacher-username"
                    type="text"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    required
                    placeholder="Enter teacher username"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="teacher-password" className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="teacher-password"
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#EA580C] text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 mt-1"
                >
                  {isLoading ? 'Verifying...' : 'Teacher Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Area: Developer card on bottom-left */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
        <div className="w-full sm:w-auto">
          <DeveloperCard />
        </div>
        <div className="text-xs text-slate-400 text-center sm:text-right">
          R.D. Engineering College, Ghaziabad &bull; College work Portal
        </div>
      </footer>

      {/* Google Sign In / Registration Modal */}
      <GoogleSignInModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        classes={classes}
        onSuccess={(user, isRecovery) => onStudentLogin(user, isRecovery)}
      />
    </div>
  );
};
