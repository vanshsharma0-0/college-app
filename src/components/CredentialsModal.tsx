import React, { useState } from 'react';
import { User } from '../types';
import { STRICT_CLASSES, canChangeStudentClass, changeStudentClassOnce, updateStudentPassword } from '../services/storage';
import { validatePassword } from '../utils/usernameGenerator';
import { X, Check, KeyRound, User as UserIcon, Mail, GraduationCap, Lock, AlertCircle } from 'lucide-react';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isDarkMode?: boolean;
  onPasswordUpdated: (newPass: string) => void;
  onClassUpdated?: (newClass: string) => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  user,
  isDarkMode = false,
  onPasswordUpdated,
  onClassUpdated,
}) => {
  const [selectedClass, setSelectedClass] = useState(user.className || 'P1');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const canChangeClass = canChangeStudentClass(user);

  if (!isOpen) return null;

  const handleLockClassChange = async () => {
    if (!canChangeClass) return;
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await changeStudentClassOnce(user.uid, selectedClass);
      if (result.success && result.user) {
        if (onClassUpdated) onClassUpdated(selectedClass);
        setSuccess(`Class permanently assigned to ${selectedClass}. Selection is now locked.`);
      } else {
        setError(result.error || 'Failed to update class.');
      }
    } catch {
      setError('Failed to update class section');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const check = validatePassword(newPassword);
    if (!check.isValid) {
      setError(check.error || 'Password too short');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsUpdating(true);
    try {
      const ok = await updateStudentPassword(user.uid, newPassword);
      if (ok) {
        setSuccess('Password updated successfully!');
        onPasswordUpdated(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError('Failed to update password');
      }
    } catch {
      setError('Error updating password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div
        className={`rounded-xl border shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isDarkMode
            ? 'bg-[#0F172A] border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'border-slate-800 bg-[#141C2E]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#EA580C]" />
            <h3 className="font-semibold text-sm">My Student Credentials</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
            }`}
            aria-label="Close credentials dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 text-xs rounded-lg flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 bg-green-500/10 border border-green-500/30 text-green-600 text-xs rounded-lg flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Student details card */}
          <div
            className={`border rounded-lg p-3 space-y-2.5 text-xs ${
              isDarkMode ? 'bg-[#141C2E] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                Custom Username:
              </span>
              <span
                className={`font-mono font-semibold px-2 py-0.5 border rounded ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-orange-400'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                @{user.customUsername}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Registered Email:
              </span>
              <span className="font-medium">{user.email}</span>
            </div>

            {/* Requirement 1: One-time class change or permanently locked badge */}
            <div
              className={`pt-2 border-t flex flex-col gap-1.5 ${
                isDarkMode ? 'border-slate-800' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Class / Section:
                </span>
                {canChangeClass ? (
                  <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    1-Time Setup Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200/50 border border-slate-300/60 text-slate-700 dark:text-slate-300 font-bold rounded text-[11px]">
                    <Lock className="w-3 h-3 text-[#EA580C]" />
                    Class {user.className || 'P1'} (Locked)
                  </span>
                )}
              </div>

              {canChangeClass ? (
                <div className="mt-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <select id="class-select-input"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className={`flex-1 px-2.5 py-1.5 border rounded font-semibold text-xs focus:ring-1 focus:ring-[#EA580C] ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {STRICT_CLASSES.map((c) => (
                        <option key={c} value={c}>
                          Class {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleLockClassChange}
                      disabled={isUpdating}
                      className="px-3 py-1.5 bg-[#EA580C] text-white text-xs font-semibold rounded hover:bg-orange-700 shadow-xs"
                    >
                      Lock Class
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-600 leading-tight">
                    Notice: You can only select or change your class section exactly ONCE. Once saved, it will be permanently locked to your profile.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  Your class cohort is permanently locked and registered in the institutional database.
                </p>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div>
            <h4 className="text-xs font-semibold mb-2">Change Password</h4>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-type new password"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA580C] ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-[#EA580C] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
