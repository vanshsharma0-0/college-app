import React, { useState, useRef } from "react";
import { AssignmentQuestion, AnswerSubmission, CollegeClass, User } from "../types";
import { SUBJECT_LIST, canChangeStudentClass, submitAnswer, updateStudentPassword } from "../services/storage";
import { compressImageFile } from "../utils/imageCompressor";
import { DeveloperCard } from "./DeveloperCard";
import { CredentialsModal } from "./CredentialsModal";
import { RDECLogo } from "./RDECLogo";
import {
  LogOut,
  Camera,
  CheckCircle2,
  KeyRound,
  FileCheck,
  AlertTriangle,
  X,
  ExternalLink,
  Moon,
  Sun,
  Lock,
} from "lucide-react";

interface StudentPortalProps {
  student: User;
  isRecovery?: boolean;
  classes: CollegeClass[];
  questions: AssignmentQuestion[];
  submissions: AnswerSubmission[];
  onLogout: () => void;
  onRefreshData: () => Promise<void>;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  isRecovery = false,
  classes,
  questions,
  submissions,
  onLogout,
  onRefreshData,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(student);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(isRecovery);

  // Requirement 2: Student Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("college_dark_mode") === "true";
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("college_dark_mode", String(next));
      } catch {}
      return next;
    });
  };

  const canChangeClass = canChangeStudentClass(currentUser);

  // Quick password change in recovery banner
  const [quickNewPass, setQuickNewPass] = useState("");
  const [quickPassSuccess, setQuickPassSuccess] = useState(false);
  const [isSavingQuickPass, setIsSavingQuickPass] = useState(false);

  // Subject filter pills for their specific class
  const studentClass = classes.find((c) => c.name.toLowerCase() === (currentUser.className || "").toLowerCase());
  const subjectsForClass = studentClass?.subjects || [...SUBJECT_LIST];
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("All");

  // File upload state per question
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [uploadSuccessQuestionId, setUploadSuccessQuestionId] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ origKb: number; compKb: number } | null>(null);

  // Preview uploaded answer photo modal
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);

  // Hidden file inputs mapped by question ID
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Filter questions for the student class and active subject pill
  const classQuestions = questions.filter((q) => {
    const classMatch = !currentUser.className || q.className.toLowerCase() === currentUser.className.toLowerCase();
    if (!classMatch) return false;
    if (selectedSubjectFilter !== "All" && q.subject.toLowerCase() !== selectedSubjectFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Handle file capture & HTML5 Canvas compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, question: AssignmentQuestion) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQuestionId(question.id);
    setCompressionStats(null);

    try {
      const { dataUrl, originalSize, compressedSize } = await compressImageFile(file, 1000, 0.6);

      setCompressionStats({
        origKb: Math.round(originalSize / 1024),
        compKb: Math.round(compressedSize / 1024),
      });

      await submitAnswer({
        questionId: question.id,
        studentId: currentUser.uid,
        studentName: currentUser.fullName,
        customUsername: currentUser.customUsername,
        className: currentUser.className || question.className,
        subject: question.subject,
        photoUrl: dataUrl,
      });

      setUploadSuccessQuestionId(question.id);
      await onRefreshData();

      if (fileInputRefs.current[question.id]) {
        fileInputRefs.current[question.id]!.value = "";
      }

      setTimeout(() => {
        setUploadSuccessQuestionId(null);
        setCompressionStats(null);
      }, 4000);
    } catch (err) {
      console.error("Failed to compress and upload photo:", err);
    } finally {
      setUploadingQuestionId(null);
    }
  };

  // Quick recovery password update
  const handleQuickPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNewPass || quickNewPass.length < 4) return;

    setIsSavingQuickPass(true);
    try {
      const ok = await updateStudentPassword(currentUser.uid, quickNewPass);
      if (ok) {
        setQuickPassSuccess(true);
        setCurrentUser((prev) => ({ ...prev, password: quickNewPass }));
        setTimeout(() => {
          setShowRecoveryBanner(false);
          setQuickPassSuccess(false);
        }, 2500);
      }
    } finally {
      setIsSavingQuickPass(false);
    }
  };

  return (
    <div
      className={"min-h-screen flex flex-col justify-between transition-colors duration-200 " +
        (isDarkMode ? "bg-[#090D16] text-[#F8FAFC]" : "bg-white text-slate-900")}
    >
      {/* Clean Header with Dark Mode Switch & Credentials */}
      <header
        className={"sticky top-0 z-30 backdrop-blur-sm border-b px-4 sm:px-8 py-3.5 transition-colors " +
          (isDarkMode ? "bg-[#0F172A]/95 border-slate-800" : "bg-white/95 border-slate-200")}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RDECLogo size={42} showBorder />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">{currentUser.fullName}</h2>
                <span
                  className={"px-2 py-0.5 text-[11px] font-mono font-semibold rounded border " +
                    (isDarkMode
                      ? "bg-slate-800 text-orange-400 border-slate-700"
                      : "bg-orange-50 text-[#EA580C] border-orange-200")}
                >
                  @{currentUser.customUsername}
                </span>

                {/* Class Badge: Shows locked or 1-time status */}
                <span
                  className={"px-2 py-0.5 text-[11px] font-bold rounded border inline-flex items-center gap-1 " +
                    (!canChangeClass
                      ? isDarkMode
                        ? "bg-slate-800 border-slate-700 text-slate-200"
                        : "bg-slate-100 border-slate-200 text-slate-800"
                      : isDarkMode
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-amber-50 border-amber-300 text-amber-800")}
                >
                  {!canChangeClass && <Lock className="w-3 h-3 text-[#EA580C]" />}
                  Class {currentUser.className || "P1"}
                  {!canChangeClass ? " (Locked)" : ""}
                </span>

                <span className="hidden md:inline-flex px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
                  RDEC Ghaziabad
                </span>
              </div>
              <p className={"text-xs " + (isDarkMode ? "text-slate-400" : "text-slate-500")}>
                College work Portal &bull; R.D. Engineering College, Ghaziabad &bull; Student Account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Requirement 2: Dark Mode Switch */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className={"inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors " +
                (isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700")}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCredentialsOpen(true)}
              className={"inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors " +
                (isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800")}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#EA580C]" />
              My Credentials
            </button>

            <button
              type="button"
              onClick={onLogout}
              className={"inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors " +
                (isDarkMode
                  ? "border-slate-800 text-slate-300 hover:text-red-400 hover:bg-red-500/10"
                  : "border-slate-200 text-slate-700 hover:text-red-700 hover:bg-red-50")}
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Workspace */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6 flex-1">
        {/* Requirement 1: One-time class notice banner if student has not locked yet */}
        {canChangeClass && (
          <div
            className={"border rounded-xl p-3.5 text-xs flex items-center justify-between gap-3 " +
              (isDarkMode
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-amber-50 border-amber-200 text-amber-900")}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>First Login Setup:</strong> Your cohort is currently set to <strong>Class {currentUser.className || "P1"}</strong>. You can change your class section exactly ONCE in "My Credentials" before it is permanently locked.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCredentialsOpen(true)}
              className="px-2.5 py-1 bg-[#EA580C] hover:bg-orange-700 text-white rounded text-[11px] font-semibold shrink-0"
            >
              Configure Class
            </button>
          </div>
        )}

        {/* Account Recovery Banner */}
        {showRecoveryBanner && (
          <div
            className={"border rounded-xl p-4 sm:p-5 text-xs animate-in fade-in duration-200 shadow-xs " +
              (isDarkMode
                ? "bg-[#141C2E] border-slate-700 text-slate-200"
                : "bg-amber-50 border-amber-200 text-amber-900")}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">Account Recovery: Welcome Back!</div>
                  <div className={"mt-0.5 " + (isDarkMode ? "text-slate-300" : "text-slate-700")}>
                    Your saved Custom Username is{" "}
                    <span
                      className={"font-mono font-bold px-1.5 py-0.5 rounded border " +
                        (isDarkMode
                          ? "bg-slate-800 border-slate-700 text-orange-400"
                          : "bg-white border-amber-200 text-slate-900")}
                    >
                      @{currentUser.customUsername}
                    </span>{" "}
                    (Class {currentUser.className || "P1"}). You can update your password below in one click:
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecoveryBanner(false)}
                className={"p-1 rounded " + (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600")}
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickPassSuccess ? (
              <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 text-green-600 rounded font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Your new password has been saved successfully!
              </div>
            ) : (
              <form onSubmit={handleQuickPasswordUpdate} className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="password"
                  placeholder="Set new portal password (min 4 chars)"
                  value={quickNewPass}
                  onChange={(e) => setQuickNewPass(e.target.value)}
                  required
                  className={"px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#EA580C] min-w-[240px] " +
                    (isDarkMode
                      ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      : "bg-white border-amber-300 text-slate-900 placeholder:text-slate-400")}
                />
                <button
                  type="submit"
                  disabled={isSavingQuickPass}
                  className="px-4 py-1.5 bg-[#EA580C] text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSavingQuickPass ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className={"text-xs font-semibold mr-1 " + (isDarkMode ? "text-slate-400" : "text-slate-500")}>
            Subject:
          </span>
          <button
            type="button"
            onClick={() => setSelectedSubjectFilter("All")}
            className={"px-3 py-1.5 text-xs font-semibold rounded-md transition-colors " +
              (selectedSubjectFilter === "All"
                ? "bg-[#EA580C] text-white shadow-xs"
                : isDarkMode
                ? "bg-[#141C2E] border border-slate-800 text-slate-300 hover:bg-slate-800"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
          >
            All Subjects
          </button>
          {subjectsForClass.map((subj) => (
            <button
              key={subj}
              type="button"
              onClick={() => setSelectedSubjectFilter(subj)}
              className={"px-3 py-1.5 text-xs font-semibold rounded-md transition-colors " +
                (selectedSubjectFilter === subj
                  ? "bg-[#EA580C] text-white shadow-xs"
                  : isDarkMode
                  ? "bg-[#141C2E] border border-slate-800 text-slate-300 hover:bg-slate-800"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
            >
              {subj}
            </button>
          ))}
        </div>

        {/* Compression Toast Indicator */}
        {compressionStats && (
          <div
            className={"p-3 border rounded-lg text-xs flex items-center justify-between " +
              (isDarkMode
                ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                : "bg-orange-50 border-orange-200 text-slate-800")}
          >
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#EA580C]" />
              <span>
                Notebook image compressed from <strong>{compressionStats.origKb} KB</strong> to{" "}
                <strong>{compressionStats.compKb} KB</strong> (1000px max width, JPEG 0.6) and submitted!
              </span>
            </div>
          </div>
        )}

        {/* Questions list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Assigned Questions ({classQuestions.length})</h3>
            <span className={"text-xs font-semibold " + (isDarkMode ? "text-slate-400" : "text-slate-600")}>
              Your Class: Class {currentUser.className || "P1"}
            </span>
          </div>

          {classQuestions.length === 0 ? (
            <div
              className={"border rounded-xl p-10 text-center text-xs " +
                (isDarkMode
                  ? "bg-[#141C2E] border-slate-800 text-slate-400"
                  : "bg-[#F8FAFC] border-slate-200 text-slate-500")}
            >
              No questions found for the selected subject filter in Class {currentUser.className || "P1"}. Check back once your teachers post assignments!
            </div>
          ) : (
            <div className="space-y-4">
              {classQuestions.map((q) => {
                const submission = submissions.find(
                  (s) =>
                    s.questionId === q.id &&
                    (s.studentId === currentUser.uid || s.customUsername === currentUser.customUsername)
                );
                const isSubmitted = !!submission;
                const isChecked = submission?.marksAwarded !== undefined;
                const isUploadingThis = uploadingQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    className={"border rounded-xl p-5 sm:p-6 transition-all shadow-xs " +
                      (isDarkMode
                        ? "bg-[#141C2E] border-slate-800 hover:border-slate-700"
                        : "bg-[#F8FAFC] border-slate-200 hover:border-slate-300")}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={"px-2 py-0.5 text-[11px] font-semibold rounded border " +
                              (isDarkMode
                                ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                : "bg-orange-50 text-[#EA580C] border-orange-200")}
                          >
                            {q.subject}
                          </span>
                          <span className={"text-xs font-medium " + (isDarkMode ? "text-slate-400" : "text-slate-500")}>
                            Max Marks: {q.marks}
                          </span>
                          <span className={isDarkMode ? "text-slate-600" : "text-slate-400"}>&bull;</span>
                          <span className={"text-xs " + (isDarkMode ? "text-slate-400" : "text-slate-500")}>
                            Faculty: {q.teacherName}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-semibold leading-snug">
                          {q.questionText}
                        </h4>
                      </div>

                      {/* Marks / Status badge */}
                      <div className="shrink-0">
                        {isChecked ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/30 rounded-lg text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Checked: {submission.marksAwarded} / {q.marks} Marks
                          </div>
                        ) : isSubmitted ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-semibold">
                            Submitted &bull; Under Evaluation
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div
                      className={"pt-4 border-t flex flex-wrap items-center justify-between gap-3 " +
                        (isDarkMode ? "border-slate-800" : "border-slate-200")}
                    >
                      <div className={"text-xs " + (isDarkMode ? "text-slate-400" : "text-slate-500")}>
                        {isSubmitted ? (
                          <span>
                            Answer photo submitted on{" "}
                            {new Date(submission.submittedAt).toLocaleDateString()} at{" "}
                            {new Date(submission.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ) : (
                          <span>Write answer in notebook, take photo &amp; submit</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          ref={(el) => {
                            fileInputRefs.current[q.id] = el;
                          }}
                          onChange={(e) => handleFileChange(e, q)}
                          className="hidden"
                          id={"file-input-" + q.id}
                        />

                        {isSubmitted ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg border border-green-500/30 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Submitted
                            </span>

                            <button
                              type="button"
                              onClick={() => setInspectPhotoUrl(submission.photoUrl)}
                              className={"px-2.5 py-1.5 border text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 " +
                                (isDarkMode
                                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50")}
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Copy
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[q.id]?.click()}
                              disabled={isUploadingThis}
                              className="text-xs text-[#EA580C] hover:underline font-medium ml-1"
                            >
                              Replace Photo
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isUploadingThis}
                            onClick={() => fileInputRefs.current[q.id]?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50"
                          >
                            <Camera className="w-4 h-4" />
                            {isUploadingThis ? "Compressing & Uploading..." : "Upload Answer Page Photo"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Answer Copy Viewer Modal */}
      {inspectPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div
            className={"rounded-xl border shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 " +
              (isDarkMode ? "bg-[#0F172A] border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900")}
          >
            <div
              className={"flex items-center justify-between px-6 py-3.5 border-b " +
                (isDarkMode ? "border-slate-800 bg-[#141C2E]" : "border-slate-200 bg-slate-50")}
            >
              <h3 className="font-bold text-sm">Your Uploaded Notebook Answer Copy</h3>
              <button
                type="button"
                onClick={() => setInspectPhotoUrl(null)}
                className={"p-1 rounded transition-colors " +
                  (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-400 hover:text-slate-600")}
                aria-label="Close copy view"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={"flex-1 overflow-auto p-4 flex items-center justify-center min-h-[400px] " + (isDarkMode ? "bg-[#090D16]" : "bg-slate-100")}>
              <img
                src={inspectPhotoUrl}
                alt="My uploaded notebook copy"
                className="max-h-[75vh] max-w-full w-auto h-auto object-contain rounded shadow-xs select-none block mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      <CredentialsModal
        isOpen={isCredentialsOpen}
        onClose={() => setIsCredentialsOpen(false)}
        user={currentUser}
        isDarkMode={isDarkMode}
        onPasswordUpdated={(newPass) => {
          setCurrentUser((prev) => ({ ...prev, password: newPass }));
        }}
        onClassUpdated={(newClass) => {
          setCurrentUser((prev) => ({ ...prev, className: newClass, classLocked: true, classChangesRemaining: 0 }));
          onRefreshData();
        }}
      />

      {/* Footer with Developer Card */}
      <footer
        className={"w-full max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-6 border-t flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 transition-colors " +
          (isDarkMode ? "border-slate-800" : "border-slate-200")}
      >
        <div className="w-full sm:w-auto">
          <DeveloperCard isDarkMode={isDarkMode} />
        </div>
        <div className={"text-xs " + (isDarkMode ? "text-slate-500" : "text-slate-400")}>
          College work Portal &bull; R.D. Engineering College, Ghaziabad &bull; Student Workspace
        </div>
      </footer>
    </div>
  );
};
