import React, { useState } from 'react';
import { AssignmentQuestion, AnswerSubmission, CollegeClass, TeacherAccount } from '../types';
import { addClass, addQuestion, addSubjectToClass, addTeacher, evaluateSubmission } from '../services/storage';
import { DeveloperCard } from './DeveloperCard';
import { DeveloperAdminModal } from './DeveloperAdminModal';
import { RDECLogo } from './RDECLogo';
import {
  LogOut,
  Upload,
  BookOpen,
  CheckCircle,
  FileText,
  X,
  Settings,
  UserPlus,
  Layers,
  Search,
  Eye,
  Database,
} from 'lucide-react';

interface TeacherPortalProps {
  teacher: TeacherAccount;
  classes: CollegeClass[];
  questions: AssignmentQuestion[];
  submissions: AnswerSubmission[];
  onLogout: () => void;
  onRefreshData: () => Promise<void>;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  teacher,
  classes,
  questions,
  submissions,
  onLogout,
  onRefreshData,
}) => {
  const isHOD = teacher.role === 'hod' || teacher.username === 'hod_admin';
  const assignedSubject = !isHOD && teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects[0] : null;

  // Section 1: Post New Question state
  const [selectedClass, setSelectedClass] = useState(classes[0]?.name || 'P1');
  const availableSubjects = classes.find((c) => c.name === selectedClass)?.subjects || [];
  const [selectedSubject, setSelectedSubject] = useState(assignedSubject || availableSubjects[0] || 'Chemistry');
  const [questionText, setQuestionText] = useState('');
  const [marks, setMarks] = useState(10);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Section 2: Class Boxes & Submissions state
  const [selectedClassBox, setSelectedClassBox] = useState<string>('P1');
  const [inlineMarks, setInlineMarks] = useState<{ [submissionId: string]: number }>({});
  const [inlineSavingId, setInlineSavingId] = useState<string | null>(null);
  const [subFilterSubject, setSubFilterSubject] = useState<string>(assignedSubject || 'All');

  // Answer Photo Inspection Modal
  const [activeSubmission, setActiveSubmission] = useState<AnswerSubmission | null>(null);
  const [marksInput, setMarksInput] = useState<number>(10);
  const [isSavingMarks, setIsSavingMarks] = useState(false);

  // HOD "Manage Teachers & Classes" Modal
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'teacher' | 'class'>('teacher');

  // New teacher form
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [teacherMsg, setTeacherMsg] = useState<string | null>(null);

  // New class & subject form
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [existingClassIdForSubject, setExistingClassIdForSubject] = useState(classes[0]?.id || '');
  const [classMsg, setClassMsg] = useState<string | null>(null);

  // Handle class change in question post form to auto-update subjects if HOD
  const handleClassChange = (newClassName: string) => {
    setSelectedClass(newClassName);
    if (!assignedSubject) {
      const found = classes.find((c) => c.name === newClassName);
      if (found && found.subjects.length > 0) {
        setSelectedSubject(found.subjects[0]);
      }
    }
  };

  // Section 1: Upload Question
  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsPosting(true);
    setPostSuccess(false);

    try {
      await addQuestion({
        teacherId: teacher.uid,
        teacherName: teacher.fullName,
        className: selectedClass,
        subject: assignedSubject || selectedSubject || 'General',
        questionText: questionText.trim(),
        marks: Number(marks) || 10,
      });

      setQuestionText('');
      setPostSuccess(true);
      await onRefreshData();
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  // Save Marks on Student Submission
  const handleSaveMarks = async () => {
    if (!activeSubmission) return;
    setIsSavingMarks(true);

    try {
      await evaluateSubmission(activeSubmission.id, Number(marksInput), teacher.fullName);
      await onRefreshData();
      setActiveSubmission(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMarks(false);
    }
  };

  // Direct Inline Marks Evaluation
  const handleSaveInlineMarks = async (submissionId: string, maxMarks: number) => {
    const score = inlineMarks[submissionId] ?? maxMarks;
    setInlineSavingId(submissionId);
    try {
      await evaluateSubmission(submissionId, Number(score), teacher.fullName);
      await onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setInlineSavingId(null);
    }
  };

  // HOD Add Teacher
  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherMsg(null);
    if (!newTeacherName || !newTeacherUsername || !newTeacherPassword) return;

    try {
      await addTeacher({
        fullName: newTeacherName.trim(),
        username: newTeacherUsername.trim().toLowerCase(),
        password: newTeacherPassword,
        role: 'teacher',
        department: 'Academic Faculty',
      });
      setTeacherMsg('New faculty account created successfully!');
      setNewTeacherName('');
      setNewTeacherUsername('');
      setNewTeacherPassword('');
      await onRefreshData();
    } catch {
      setTeacherMsg('Failed to create teacher account.');
    }
  };

  // HOD Add Class or Subject
  const handleAddClassOrSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassMsg(null);

    try {
      if (newClassName.trim()) {
        const subjectsList = newSubjectName ? [newSubjectName.trim()] : ['General'];
        await addClass(newClassName.trim(), subjectsList);
        setClassMsg(`Class "${newClassName}" added successfully!`);
        setNewClassName('');
        setNewSubjectName('');
      } else if (existingClassIdForSubject && newSubjectName.trim()) {
        await addSubjectToClass(existingClassIdForSubject, newSubjectName.trim());
        setClassMsg(`Subject added to class successfully!`);
        setNewSubjectName('');
      }
      await onRefreshData();
    } catch {
      setClassMsg('Failed to add class or subject.');
    }
  };

  // Institutional Class list [P1, P2, P3, C1, C2, C3, C4]
  const institutionalClasses = ['P1', 'P2', 'P3', 'C1', 'C2', 'C3', 'C4'];

  // Filtered submissions list based on selected Class Box & Subject filter
  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedClassBox !== 'All' && sub.className.toUpperCase() !== selectedClassBox.toUpperCase()) return false;
    if (subFilterSubject !== 'All' && sub.subject.toLowerCase() !== subFilterSubject.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RDECLogo size={42} showBorder />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{teacher.fullName}</h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-orange-50 text-[#EA580C] border border-orange-200 rounded">
                  {assignedSubject ? `Subject: ${assignedSubject}` : isHOD ? 'HOD Admin' : 'Faculty'}
                </span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                  RDEC Ghaziabad
                </span>
              </div>
              <p className="text-xs text-slate-500">
                College work Portal &bull; R.D. Engineering College, Ghaziabad &bull; @{teacher.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Storage & Clean-Up Console */}
            <button
              type="button"
              onClick={() => setIsStorageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EA580C] hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              title="Protected by Developer PIN"
            >
              <Database className="w-3.5 h-3.5" />
              Manage Submissions &amp; Storage
            </button>

            {isHOD && (
              <button
                type="button"
                onClick={() => setIsManageModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#EA580C]" />
                Manage Teachers &amp; Classes
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:text-red-700 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Only Two Simple Sections as strictly requested */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8 flex-1">
        {/* Section 1: "Post New Question" */}
        <section className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <BookOpen className="w-5 h-5 text-[#EA580C]" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Section 1: Post New Question</h2>
              <p className="text-xs text-slate-500">
                {assignedSubject
                  ? `Create an assignment question for ${assignedSubject} students`
                  : 'Create an assignment question for your students'}
              </p>
            </div>
          </div>

          {postSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span>Assignment question successfully posted to student portal!</span>
            </div>
          )}

          <form onSubmit={handlePostQuestion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.name}>
                      Class {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject {assignedSubject ? '(Assigned to you)' : ''}
                </label>
                {assignedSubject ? (
                  <div className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-medium">
                    {assignedSubject}
                  </div>
                ) : (
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  >
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Question Description
              </label>
              <textarea
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
                placeholder="Type the assignment question here (e.g. derivations, problem solving, algorithms, proofs)..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPosting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EA580C] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isPosting ? 'Uploading...' : 'Upload Question'}
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: "Student Answer Submissions" */}
        <section className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#EA580C]" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Section 2: Student Answer Submissions</h2>
                <p className="text-xs text-slate-500">
                  Select a class box below to view student submissions, handwritten notebook photos, and enter marks
                </p>
              </div>
            </div>

            {/* Subject and Reset Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Subject:</span>
              </div>
              <select
                value={subFilterSubject}
                onChange={(e) => setSubFilterSubject(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              >
                <option value="All">All Subjects</option>
                {Array.from(new Set(classes.flatMap((c) => c.subjects))).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setSelectedClassBox("All")}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                  selectedClassBox === "All"
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                All Classes
              </button>
            </div>
          </div>

          {/* Requirement 3: Clean Grid of Class Boxes (one for each class: P1, P2, P3, C1, C2, C3, C4) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Interactive Class Boxes
              </div>
              <span className="text-[11px] text-slate-500">
                Click any class box to inspect its dedicated submissions list
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
              {institutionalClasses.map((clsName) => {
                const clsSubs = submissions.filter(
                  (s) =>
                    s.className.toUpperCase() === clsName.toUpperCase() &&
                    (subFilterSubject === "All" || s.subject.toLowerCase() === subFilterSubject.toLowerCase())
                );
                const pendingCount = clsSubs.filter((s) => s.marksAwarded === undefined).length;
                const isSelected = selectedClassBox.toUpperCase() === clsName.toUpperCase();

                return (
                  <button
                    key={clsName}
                    type="button"
                    onClick={() => setSelectedClassBox(clsName)}
                    className={`flex flex-col text-left p-3 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#EA580C] bg-orange-50/70 shadow-sm ring-1 ring-[#EA580C]/20 text-slate-900"
                        : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-base font-bold ${isSelected ? "text-[#EA580C]" : "text-slate-900"}`}>
                        Class {clsName}
                      </span>
                      {pendingCount > 0 ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-pulse" title={`${pendingCount} pending evaluation`} />
                      ) : clsSubs.length > 0 ? (
                        <span className="w-2 h-2 rounded-full bg-green-500" title="All evaluated" />
                      ) : null}
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium">
                      {clsSubs.length} {clsSubs.length === 1 ? "submission" : "submissions"}
                    </div>

                    <div className="mt-1.5">
                      {pendingCount > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                          {pendingCount} Pending
                        </span>
                      ) : clsSubs.length > 0 ? (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-100 text-green-800">
                          All Checked
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">0 entries</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated View for the selected Class Box */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {selectedClassBox === "All" ? "All Classes" : `Class ${selectedClassBox}`} &bull; Dedicated Submissions View
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-[#EA580C]">
                  {filteredSubmissions.length} Student{filteredSubmissions.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Click notebook photo or &quot;View Answer Photo&quot; to inspect handwritten page in full resolution
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-500 text-xs">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No student submissions found for {selectedClassBox === "All" ? "any class" : `Class ${selectedClassBox}`}.
                {selectedClassBox !== "All" && (
                  <p className="mt-1 text-slate-400">
                    Students in Class {selectedClassBox} have not submitted answers for this subject yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Notebook Photo</th>
                      <th className="py-3 px-4">Subject &amp; Assignment</th>
                      <th className="py-3 px-4">Submission Status</th>
                      <th className="py-3 px-4">Grading Input</th>
                      <th className="py-3 px-4 text-right">Inspect Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map((sub) => {
                      const relatedQuestion = questions.find((q) => q.id === sub.questionId);
                      const isEvaluated = sub.marksAwarded !== undefined;
                      const maxMarks = relatedQuestion?.marks || 10;
                      const currentScore = inlineMarks[sub.id] ?? (sub.marksAwarded ?? maxMarks);

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Student Name */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 text-sm">{sub.studentName}</div>
                            <div className="font-mono text-[11px] text-slate-500">@{sub.customUsername}</div>
                          </td>

                          {/* Class/Section badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 border border-slate-200 text-slate-800">
                              Class {sub.className}
                            </span>
                          </td>

                          {/* Notebook Photo thumbnail */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubmission(sub);
                                setMarksInput(sub.marksAwarded ?? maxMarks);
                              }}
                              className="group relative block w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-[#EA580C] transition-all bg-slate-100"
                              title="Click to view full answer photo"
                            >
                              <img
                                src={sub.photoUrl}
                                alt="Handwritten Notebook"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </button>
                          </td>

                          {/* Subject & Question snippet */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-medium text-slate-900">{sub.subject}</div>
                            <div className="text-slate-500 truncate text-[11px]">
                              {relatedQuestion?.questionText || "Assignment Question"}
                            </div>
                          </td>

                          {/* Submission Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isEvaluated ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                <CheckCircle className="w-3 h-3" />
                                Checked: {sub.marksAwarded} / {maxMarks} Marks
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Submitted &bull; Pending Evaluation
                              </span>
                            )}
                          </td>

                          {/* Grading Input directly in the row */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max={maxMarks}
                                value={currentScore}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(maxMarks, Number(e.target.value)));
                                  setInlineMarks((prev) => ({ ...prev, [sub.id]: val }));
                                }}
                                className="w-14 px-2 py-1 text-xs border border-slate-300 rounded font-semibold text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                              />
                              <span className="text-[11px] text-slate-500">/{maxMarks}</span>
                              <button
                                type="button"
                                disabled={inlineSavingId === sub.id}
                                onClick={() => handleSaveInlineMarks(sub.id, maxMarks)}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[11px] font-semibold rounded transition-colors"
                              >
                                {inlineSavingId === sub.id ? "..." : "Save"}
                              </button>
                            </div>
                          </td>

                          {/* Action Button: View Answer Photo */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubmission(sub);
                                setMarksInput(sub.marksAwarded ?? maxMarks);
                              }}
                              className="px-3 py-1.5 bg-[#EA580C] hover:bg-orange-700 text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
                            >
                              View Answer Photo
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Answer Photo Inspection Modal with Requirement 1 Aspect Ratio Fix */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Handwritten Notebook Answer Page
                </h3>
                <div className="text-xs text-slate-500">
                  Student: <span className="font-semibold text-slate-800">{activeSubmission.studentName}</span> (@{activeSubmission.customUsername}) &bull; Class {activeSubmission.className} &bull; {activeSubmission.subject}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubmission(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                aria-label="Close photo view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Requirement 1: Natural, original aspect ratio (object-contain, max-height constraint, never stretched or cropped) */}
              <div className="lg:col-span-2 flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 p-3 sm:p-4 min-h-[420px] overflow-auto">
                <img
                  src={activeSubmission.photoUrl}
                  alt={`Notebook copy of ${activeSubmission.studentName}`}
                  className="max-h-[75vh] max-w-full w-auto h-auto object-contain rounded shadow-xs select-none block mx-auto"
                />
              </div>

              {/* Right Col: Grading & Question details */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Assigned Question
                    </h4>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                      {questions.find((q) => q.id === activeSubmission.questionId)?.questionText || 'Assignment Question'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Submission Details
                    </h4>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>Submitted: {new Date(activeSubmission.submittedAt).toLocaleString()}</div>
                      {activeSubmission.evaluatedAt && (
                        <div>Evaluated on: {new Date(activeSubmission.evaluatedAt).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grading Action Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <label className="block text-xs font-semibold text-slate-800">
                    Enter Marks Awarded (out of {questions.find((q) => q.id === activeSubmission.questionId)?.marks || 10})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={questions.find((q) => q.id === activeSubmission.questionId)?.marks || 10}
                    value={marksInput}
                    onChange={(e) => setMarksInput(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  />

                  <button
                    type="button"
                    onClick={handleSaveMarks}
                    disabled={isSavingMarks}
                    className="w-full py-2.5 px-4 bg-[#EA580C] hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSavingMarks ? 'Saving...' : 'Save Marks'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOD Manage Teachers & Classes Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#EA580C]" />
                <h3 className="font-semibold text-slate-900 text-sm">Manage Faculty &amp; Academic Curriculum</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                aria-label="Close manage dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Switcher */}
            <div className="grid grid-cols-2 gap-1 p-2 bg-slate-100 border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setManageTab('teacher');
                  setTeacherMsg(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 ${
                  manageTab === 'teacher' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Teacher Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setManageTab('class');
                  setClassMsg(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 ${
                  manageTab === 'class' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Add Class &amp; Subject
              </button>
            </div>

            <div className="p-6">
              {manageTab === 'teacher' ? (
                <form onSubmit={handleAddTeacher} className="space-y-3">
                  {teacherMsg && (
                    <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg">
                      {teacherMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Teacher Title / Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Physics Teacher"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Teacher Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. teacher_physics"
                      value={newTeacherUsername}
                      onChange={(e) => setNewTeacherUsername(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Set teacher password"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#EA580C] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-xs"
                    >
                      Create Teacher
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddClassOrSubject} className="space-y-4">
                  {classMsg && (
                    <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg">
                      {classMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Option A: Add a New Class (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. P4 or C5"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Option B: Or Add Subject to Existing Class
                    </label>
                    <select
                      value={existingClassIdForSubject}
                      onChange={(e) => setExistingClassIdForSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Class {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Subject Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Thermodynamics"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#EA580C] text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-xs"
                    >
                      Save to Curriculum
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer with Developer card */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-6 pb-6 border-t border-slate-200 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
        <div className="w-full sm:w-auto">
          <DeveloperCard submissions={submissions} onRefreshData={onRefreshData} />
        </div>
        <div className="text-xs text-slate-400">
          College work Portal &bull; R.D. Engineering College, Ghaziabad &bull; Faculty Workspace
        </div>
      </footer>
    </div>
  );
};
