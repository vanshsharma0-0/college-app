import React, { useState } from 'react';
import {
  X,
  Database,
  Trash2,
  HardDrive,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Layers,
  Eye,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { AnswerSubmission } from '../types';
import { RDECLogo } from './RDECLogo';
import {
  verifyDeveloperPin,
  updateDeveloperPin,
  deleteSubmission,
  deleteSubmissionsOlderThanDays,
  purgeAllSubmissions,
  getSubmissionStorageBytes,
  formatStorageSize,
  DEFAULT_TEACHERS,
} from '../services/storage';

interface DeveloperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: AnswerSubmission[];
  onRefreshData: () => Promise<void>;
  isDarkMode?: boolean;
}

export const DeveloperAdminModal: React.FC<DeveloperAdminModalProps> = ({
  isOpen,
  onClose,
  submissions,
  onRefreshData,
  isDarkMode = false,
}) => {
  // Authentication PIN state
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Tab state: Submissions Storage vs Teacher Credentials Manager
  const [activeTab, setActiveTab] = useState<'storage' | 'credentials'>('storage');

  // New PIN state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);

  // Storage cleanup states
  const [filterClass, setFilterClass] = useState<string>('All');
  const [daysOlder, setDaysOlder] = useState<number>(7);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);

  // Teacher credentials states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<boolean>(true);

  if (!isOpen) return null;

  // Handle PIN submission
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyDeveloperPin(pinInput)) {
      setIsAuthenticated(true);
      setPinError(null);
    } else {
      setPinError('Invalid Master Password. Access denied.');
    }
  };

  // Handle changing PIN
  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (updateDeveloperPin(newPin.trim())) {
      setPinSuccessMsg('Master Admin / Developer PIN updated successfully!');
      setNewPin('');
      setIsChangingPin(false);
      setTimeout(() => setPinSuccessMsg(null), 4000);
    }
  };

  // Calculate total storage
  const totalBytes = submissions.reduce((sum, sub) => sum + getSubmissionStorageBytes(sub), 0);
  const formattedTotal = formatStorageSize(totalBytes);

  // Filter submissions if needed
  const displaySubmissions = submissions.filter((s) => {
    if (filterClass !== 'All' && s.className.toUpperCase() !== filterClass.toUpperCase()) return false;
    return true;
  });

  // Handle Single Delete
  const handleDeleteSubmission = async (id: string, studentName: string) => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const success = await deleteSubmission(id);
      if (success) {
        await onRefreshData();
        setActionMessage({
          text: `Submission from ${studentName} and its handwritten image data was permanently deleted. Storage reclaimed.`,
          type: 'success',
        });
      } else {
        setActionMessage({ text: 'Failed to delete submission record.', type: 'error' });
      }
    } catch {
      setActionMessage({ text: 'An unexpected error occurred during deletion.', type: 'error' });
    } finally {
      setIsProcessing(false);
      setConfirmDeleteId(null);
    }
  };

  // Handle Bulk Delete Older Than X Days
  const handleDeleteOlderThanDays = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const result = await deleteSubmissionsOlderThanDays(daysOlder);
      await onRefreshData();
      setActionMessage({
        text: `Clean-up complete: ${result.deletedCount} submissions older than ${daysOlder} days were permanently removed. ${formatStorageSize(result.bytesReclaimed)} storage reclaimed!`,
        type: 'success',
      });
    } catch {
      setActionMessage({ text: 'Failed to purge older submissions.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Bulk Purge All
  const handlePurgeAll = async () => {
    if (!window.confirm('Are you sure you want to permanently delete ALL student answer photo submissions? This cannot be undone.')) {
      return;
    }
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const result = await purgeAllSubmissions();
      await onRefreshData();
      setActionMessage({
        text: `Complete Purge: All ${result.deletedCount} submissions deleted. Reclaimed ${formatStorageSize(result.bytesReclaimed)}.`,
        type: 'success',
      });
    } catch {
      setActionMessage({ text: 'Failed to purge submissions.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clipboard copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Copy all teacher credentials sheet
  const handleCopyAllCredentials = () => {
    const header = "COLLEGE ASSIGNMENT PORTAL - FACULTY CREDENTIAL DIRECTORY (2026-27)\n" + "=".repeat(65) + "\n";
    const body = DEFAULT_TEACHERS.map(
      (t) => `${t.fullName.padEnd(32)} | Username: ${t.username.padEnd(16)} | Password: ${t.password}`
    ).join("\n");
    const footer = "\n" + "=".repeat(65);
    copyToClipboard(header + body + footer, "all_credentials");
    setActionMessage({
      text: "All faculty usernames and passwords copied to clipboard ready to share!",
      type: "success",
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div
        className={`rounded-xl border shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isDarkMode
            ? 'bg-[#090D16] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EA580C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  Developer &amp; Admin Panel: Storage &amp; Credentials Console
                </h3>
                {isAuthenticated ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/30">
                    <Unlock className="w-3 h-3" />
                    Master Authenticated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                    <Lock className="w-3 h-3" />
                    Protected by Master Password
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Institutional storage optimization &amp; Teacher credential directory &bull; Restricted Access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!isAuthenticated ? (
            /* PIN Verification Screen */
            <div className="max-w-md mx-auto py-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#EA580C] flex items-center justify-center mx-auto">
                <KeyRound className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-bold">Admin &amp; Developer Verification</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Access to the storage clean-up tool and teacher credentials manager requires the master password.
                </p>
              </div>

              {pinError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600 text-left">
                  {pinError}
                </div>
              )}

              <form onSubmit={handleVerifyPin} className="space-y-3">
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Enter Master Password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className={`w-full px-4 py-2.5 text-center text-lg tracking-widest font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#EA580C] ${
                    isDarkMode
                      ? 'bg-[#0F172A] border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#EA580C] hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  Unlock Admin Console
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Content: Tab Switcher (Storage Clean-Up vs Teacher Credentials Manager) */
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div
                className={`flex items-center gap-2 p-1 rounded-lg border ${
                  isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('storage')}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'storage'
                      ? 'bg-[#EA580C] text-white shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Manage Submissions &amp; Storage</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      activeTab === 'storage' ? 'bg-orange-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {submissions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('credentials')}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'credentials'
                      ? 'bg-[#EA580C] text-white shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Teacher Credentials Manager</span>
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      activeTab === 'credentials' ? 'bg-orange-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {DEFAULT_TEACHERS.length}
                  </span>
                </button>
              </div>

              {/* Status / Feedback message */}
              {actionMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    actionMessage.type === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {actionMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {pinSuccessMsg && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-700 dark:text-green-400">
                  {pinSuccessMsg}
                </div>
              )}

              {activeTab === 'storage' ? (
                /* TAB 1: Submissions & Storage Clean-Up */
                <div className="space-y-6">
                  {/* Storage Overview Metrics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Total Submissions</span>
                        <Layers className="w-4 h-4 text-[#EA580C]" />
                      </div>
                      <div className="text-xl font-bold">{submissions.length}</div>
                      <div className="text-[11px] text-slate-500">Student answers stored</div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Storage Occupied</span>
                        <HardDrive className="w-4 h-4 text-[#EA580C]" />
                      </div>
                      <div className="text-xl font-bold">{formattedTotal}</div>
                      <div className="text-[11px] text-slate-500">Base64 photo payload</div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Average Size / Copy</span>
                        <Database className="w-4 h-4 text-[#EA580C]" />
                      </div>
                      <div className="text-xl font-bold">
                        {submissions.length > 0 ? formatStorageSize(totalBytes / submissions.length) : '0 KB'}
                      </div>
                      <div className="text-[11px] text-slate-500">Per handwritten page</div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${
                        isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Storage Health</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">Optimal</div>
                      <div className="text-[11px] text-slate-500">Reclaim available anytime</div>
                    </div>
                  </div>

                  {/* Bulk Storage Clean-up Action Controls */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 ${
                      isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                        Bulk Clean-Up Operations
                      </div>
                      <button
                        type="button"
                        onClick={onRefreshData}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1 text-xs text-[#EA580C] hover:underline cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>Refresh Size</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      {/* Delete older than X days */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs">Purge records older than</span>
                        <select
                          value={daysOlder}
                          onChange={(e) => setDaysOlder(Number(e.target.value))}
                          className={`px-2.5 py-1 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-[#EA580C] ${
                            isDarkMode
                              ? 'bg-[#141C2E] border-slate-700 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value={1}>1 Day</option>
                          <option value={3}>3 Days</option>
                          <option value={7}>7 Days (1 Week)</option>
                          <option value={14}>14 Days (2 Weeks)</option>
                          <option value={30}>30 Days (1 Month)</option>
                        </select>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handleDeleteOlderThanDays}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded transition-colors shadow-2xs disabled:opacity-50"
                        >
                          Delete Older Copies
                        </button>
                      </div>

                      {/* Bulk Purge All */}
                      <div>
                        <button
                          type="button"
                          disabled={isProcessing || submissions.length === 0}
                          onClick={handlePurgeAll}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors shadow-2xs disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge All Submissions</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filter Submissions List Table */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Student Submissions &amp; Storage Breakdown
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Filter Class:</span>
                        <select
                          value={filterClass}
                          onChange={(e) => setFilterClass(e.target.value)}
                          className={`px-2.5 py-1 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-[#EA580C] ${
                            isDarkMode
                              ? 'bg-[#0F172A] border-slate-700 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="All">All Classes</option>
                          <option value="P1">Class P1</option>
                          <option value="P2">Class P2</option>
                          <option value="P3">Class P3</option>
                          <option value="C1">Class C1</option>
                          <option value="C2">Class C2</option>
                          <option value="C3">Class C3</option>
                          <option value="C4">Class C4</option>
                        </select>
                      </div>
                    </div>

                    {displaySubmissions.length === 0 ? (
                      <div
                        className={`text-center py-12 rounded-xl border text-xs text-slate-400 ${
                          isDarkMode ? 'border-slate-800' : 'border-slate-200'
                        }`}
                      >
                        No answer submissions stored in database matching filter.
                      </div>
                    ) : (
                      <div
                        className={`border rounded-xl overflow-hidden shadow-xs ${
                          isDarkMode ? 'border-slate-800' : 'border-slate-200'
                        }`}
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead
                              className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                                isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              <tr>
                                <th className="py-2.5 px-4">Student &amp; Handle</th>
                                <th className="py-2.5 px-4">Class</th>
                                <th className="py-2.5 px-4">Subject</th>
                                <th className="py-2.5 px-4">Submitted At</th>
                                <th className="py-2.5 px-4">Storage Payload</th>
                                <th className="py-2.5 px-4">Answer Preview</th>
                                <th className="py-2.5 px-4 text-right">Reclaim Storage</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {displaySubmissions.map((sub) => {
                                const bytes = getSubmissionStorageBytes(sub);
                                const formattedSize = formatStorageSize(bytes);
                                const isConfirming = confirmDeleteId === sub.id;

                                return (
                                  <tr
                                    key={sub.id}
                                    className={`transition-colors ${
                                      isDarkMode ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    {/* Student Name */}
                                    <td className="py-3 px-4 whitespace-nowrap">
                                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                                        {sub.studentName}
                                      </div>
                                      <div className="font-mono text-[10px] text-slate-400">
                                        @{sub.customUsername}
                                      </div>
                                    </td>

                                    {/* Class Badge */}
                                    <td className="py-3 px-4 whitespace-nowrap">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                          isDarkMode
                                            ? 'bg-slate-800 border-slate-700 text-slate-300'
                                            : 'bg-slate-100 border-slate-200 text-slate-800'
                                        }`}
                                      >
                                        Class {sub.className}
                                      </span>
                                    </td>

                                    {/* Subject */}
                                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                                      {sub.subject}
                                    </td>

                                    {/* Submission Date */}
                                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                                      {new Date(sub.submittedAt).toLocaleDateString()}{' '}
                                      <span className="text-[10px] opacity-75">
                                        {new Date(sub.submittedAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </td>

                                    {/* Storage Size */}
                                    <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-[#EA580C]">
                                      {formattedSize}
                                    </td>

                                    {/* Photo Preview */}
                                    <td className="py-3 px-4 whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => setInspectPhotoUrl(sub.photoUrl)}
                                        className="group relative w-10 h-10 rounded overflow-hidden border border-slate-300 dark:border-slate-700 hover:border-[#EA580C] transition-colors"
                                        title="Click to preview answer page"
                                      >
                                        <img
                                          src={sub.photoUrl}
                                          alt="Answer copy"
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                          <Eye className="w-3.5 h-3.5" />
                                        </div>
                                      </button>
                                    </td>

                                    {/* Delete Submission Action */}
                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                      {isConfirming ? (
                                        <div className="inline-flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => handleDeleteSubmission(sub.id, sub.studentName)}
                                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors shadow-xs"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded hover:bg-slate-300 transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(sub.id)}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-semibold transition-all shadow-xs"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Delete Submission
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* TAB 2: Teacher Credentials Manager */
                <div className="space-y-4">
                  {/* Banner & Batch Copy Toolbar */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-orange-50/50 border-orange-200/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          Institutional Faculty &amp; HOD Credential Directory
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Clean usernames and secure passwords for subject faculty handover.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          isDarkMode
                            ? 'bg-[#141C2E] border-slate-700 text-slate-300 hover:text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {showPasswords ? 'Mask Passwords' : 'Show Passwords'}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyAllCredentials}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EA580C] hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                      >
                        {copiedKey === 'all_credentials' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied All!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy All Credentials</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Clean Credentials Table */}
                  <div
                    className={`border rounded-xl overflow-hidden shadow-xs ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead
                          className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                            isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <tr>
                            <th className="py-3 px-4">Subject Faculty Role</th>
                            <th className="py-3 px-4">Department</th>
                            <th className="py-3 px-4">Username</th>
                            <th className="py-3 px-4">Password</th>
                            <th className="py-3 px-4">Account Type</th>
                            <th className="py-3 px-4 text-right">Quick Handover</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                          {DEFAULT_TEACHERS.map((t) => {
                            const isHodAccount = t.role === 'hod' || t.username === 'hod_admin';
                            const pairString = `${t.username} / ${t.password}`;

                            return (
                              <tr
                                key={t.uid}
                                className={`transition-colors ${
                                  isHodAccount
                                    ? isDarkMode
                                      ? 'bg-orange-950/20'
                                      : 'bg-orange-50/40'
                                    : isDarkMode
                                    ? 'hover:bg-slate-900/40'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {/* Role / Name */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    {isHodAccount && (
                                      <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span>
                                    )}
                                    <span>{t.fullName}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {t.subjects?.join(', ') || 'All Disciplines'}
                                  </div>
                                </td>

                                {/* Department */}
                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                  {t.department || 'Academic Faculty'}
                                </td>

                                {/* Username */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <code className="px-2 py-0.5 rounded font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                      {t.username}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(t.username, `user_${t.uid}`)}
                                      className="p-1 text-slate-400 hover:text-[#EA580C] transition-colors"
                                      title="Copy Username"
                                    >
                                      {copiedKey === `user_${t.uid}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                {/* Password */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <code
                                      className={`px-2 py-0.5 rounded font-mono font-bold border ${
                                        isHodAccount
                                          ? 'bg-orange-100 text-[#EA580C] border-orange-300 dark:bg-orange-950/60 dark:border-orange-800'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {showPasswords ? t.password : '••••••••'}
                                    </code>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(t.password || '', `pass_${t.uid}`)}
                                      className="p-1 text-slate-400 hover:text-[#EA580C] transition-colors"
                                      title="Copy Password"
                                    >
                                      {copiedKey === `pass_${t.uid}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                {/* Role Badge */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                                      isHodAccount
                                        ? 'bg-[#EA580C] text-white border-[#EA580C]'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {isHodAccount ? 'Master HOD' : 'Subject Faculty'}
                                  </span>
                                </td>

                                {/* Action: Copy Pair */}
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(pairString, `pair_${t.uid}`)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#EA580C] text-slate-800 dark:text-slate-200 hover:text-[#EA580C] rounded text-xs font-medium transition-colors shadow-2xs"
                                    title="Copy Username and Password together"
                                  >
                                    {copiedKey === `pair_${t.uid}` ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                        <span className="text-green-600">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Login Pair</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer PIN Configuration Section */}
              <div
                className={`pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <div>
                  Master Admin Password Security: <span className="font-semibold text-green-600 dark:text-green-400">Active &amp; Protected</span>
                </div>

                {isChangingPin ? (
                  <form onSubmit={handleUpdatePin} className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="New PIN (4+ digits)"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className={`px-2.5 py-1 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-[#EA580C] ${
                        isDarkMode
                          ? 'bg-[#0F172A] border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-[#EA580C] text-white rounded font-semibold text-xs hover:bg-orange-700"
                    >
                      Save PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsChangingPin(false)}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(true)}
                    className="inline-flex items-center gap-1 text-[#EA580C] hover:underline font-semibold"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Change Master Admin PIN
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
            isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <div>R.D. Engineering College, Ghaziabad &bull; College work Portal &bull; Developer: Vansh Sharma</div>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Close Console
          </button>
        </div>
      </div>

      {/* Answer Photo Inspect Lightbox */}
      {inspectPhotoUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-4 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Inspect Answer Image in Storage</span>
              <button
                type="button"
                onClick={() => setInspectPhotoUrl(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-2 max-h-[65vh] overflow-hidden">
              <img
                src={inspectPhotoUrl}
                alt="Stored Answer Page"
                className="max-h-[60vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
