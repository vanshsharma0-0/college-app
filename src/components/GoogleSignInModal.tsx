import React, { useState } from 'react';
import { CollegeClass, User } from '../types';
import { generateCustomUsername, validatePassword, validateUsername } from '../utils/usernameGenerator';
import { findStudentByEmail, getStudents, registerStudent, STRICT_CLASSES } from '../services/storage';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { X, CheckCircle, ArrowRight, LogIn } from 'lucide-react';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: CollegeClass[];
  onSuccess: (user: User, isRecovery: boolean) => void;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  classes,
  onSuccess,
}) => {
  const [step, setStep] = useState<'pick_account' | 'first_time_setup'>('pick_account');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [fullName, setFullName] = useState('');

  // Registration form state for first time student
  const [customUsername, setCustomUsername] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('P1');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Handle live Firebase Google Popup Sign-In
  const handleFirebaseGooglePopup = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user && user.email) {
        await handleProceedWithEmail(user.email, user.displayName || '');
      } else {
        setError('No email returned from Google account.');
      }
    } catch (popupErr: any) {
      console.warn('Google Popup Error:', popupErr);
      if (popupErr.code === 'auth/popup-blocked') {
        setError('The Google sign-in popup was blocked by your browser. Please allow popups or use the direct Gmail sign-in below.');
      } else if (popupErr.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (popupErr.code === 'auth/unauthorized-domain') {
        setError(`Domain not authorized in Firebase Console yet. You can sign in using your Gmail directly below.`);
      } else {
        setError(popupErr.message || 'Google Sign-In failed. You can sign in using your Gmail below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting or submitting a Google Account email
  const handleProceedWithEmail = async (emailToUse: string, nameToUse: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const existingUser = await findStudentByEmail(emailToUse);

      if (existingUser) {
        // Returning student - Account Recovery flow!
        setIsLoading(false);
        onSuccess(existingUser, true);
        onClose();
      } else {
        // First-Time Student flow!
        const allStudents = await getStudents();
        const existingUsernames = allStudents.map((s) => s.customUsername);
        const resolvedName = nameToUse.trim() || emailToUse.split('@')[0];
        const generated = generateCustomUsername(resolvedName, existingUsernames);

        setSelectedEmail(emailToUse.trim());
        setFullName(resolvedName);
        setCustomUsername(generated);
        setSelectedClass('P1');
        setStep('first_time_setup');
        setIsLoading(false);
      }
    } catch {
      setError('Unable to verify Google Account. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRegisterFirstTime = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setError('Full Name is required');
      return;
    }

    if (!selectedClass || !STRICT_CLASSES.includes(selectedClass as any)) {
      setError('Please select a valid class from the list: [P1, P2, P3, C1, C2, C3, C4]');
      return;
    }

    const usernameCheck = validateUsername(customUsername);
    if (!usernameCheck.isValid) {
      setError(usernameCheck.error || 'Invalid username');
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.error || 'Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await registerStudent({
        email: selectedEmail,
        fullName: trimmedFullName,
        customUsername: customUsername.trim().toLowerCase(),
        password,
        className: selectedClass,
        role: 'student',
      });

      setIsLoading(false);
      onSuccess(newUser, false);
      onClose();
    } catch {
      setError('Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span className="font-semibold text-slate-900 text-sm">
              {step === 'pick_account' ? 'Google Account Verification' : 'First-Time Student Registration'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {step === 'pick_account' ? (
          <div className="p-6">
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Sign in with your registered college or personal Gmail ID. First-time students will receive an auto-generated username, while returning students can recover their login credentials.
            </p>

            {/* Live Firebase Google Popup Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleFirebaseGooglePopup}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs"
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
                <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google Account'}</span>
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">Or select registered account</span>
              </div>
            </div>

            {/* Quick 1-click registered student presets */}
            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={() => handleProceedWithEmail('collegegolu@gmail.com', 'Vansh Sharma')}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-[#EA580C] hover:bg-orange-50/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-semibold text-sm flex items-center justify-center">
                    VS
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 group-hover:text-[#EA580C]">
                      Vansh Sharma
                    </div>
                    <div className="text-xs text-slate-500">collegegolu@gmail.com (Registered Student • Class P1)</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#EA580C]" />
              </button>

              <button
                type="button"
                onClick={() => handleProceedWithEmail('rohit.kumar@college.edu', 'Rohit Kumar')}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-[#EA580C] hover:bg-orange-50/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center">
                    RK
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 group-hover:text-[#EA580C]">
                      Rohit Kumar
                    </div>
                    <div className="text-xs text-slate-500">rohit.kumar@college.edu (Registered Student • Class C2)</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#EA580C]" />
              </button>
            </div>

            {/* Custom Gmail Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.elements.namedItem('customGmail') as HTMLInputElement;
                const nameInput = form.elements.namedItem('customName') as HTMLInputElement;
                if (emailInput && emailInput.value) {
                  handleProceedWithEmail(emailInput.value.trim(), nameInput?.value.trim() || '');
                }
              }}
              className="space-y-3 pt-1 border-t border-slate-100"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name (Required for first-time registration)
                </label>
                <input
                  type="text"
                  name="customName"
                  placeholder="e.g. Priyanshu Singh"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Gmail Address
                </label>
                <input
                  type="email"
                  name="customGmail"
                  required
                  placeholder="your.name@gmail.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#EA580C] text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Continue with this Account'}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: First-time student completes Full Name, Class [P1..P3, C1..C4], and password */
          <form onSubmit={handleRegisterFirstTime} className="p-6 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">New Student Account Detected</div>
                <div>Please enter your full name and select your designated class section from the list.</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFullName(val);
                }}
                required
                placeholder="Enter your official student name"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class / Section <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                required
                aria-label="Select Class or Section"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent bg-white text-slate-900 font-medium"
              >
                {STRICT_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Designated institutional cohort: P1, P2, P3, C1, C2, C3, or C4.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Auto-Generated Custom Username
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateCustomUsername(fullName || selectedEmail);
                    setCustomUsername(generated);
                  }}
                  className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 shrink-0"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                You will use this username to sign in directly next time.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Set Portal Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Choose a password (min 4 characters)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep('pick_account')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 bg-[#EA580C] text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Complete & Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
