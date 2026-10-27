export type Role = 'student' | 'teacher' | 'hod';

export interface User {
  uid: string;
  email: string;
  fullName: string;
  customUsername: string;
  password?: string;
  className?: string;
  classLocked?: boolean;
  classChangesRemaining?: number;
  role: Role;
  createdAt: string;
}

export interface TeacherAccount {
  uid: string;
  username: string;
  password?: string;
  fullName: string;
  role: 'teacher' | 'hod';
  department?: string;
  subjects?: string[];
  createdAt: string;
}

export interface CollegeClass {
  id: string;
  name: string;
  subjects: string[];
}

export interface AssignmentQuestion {
  id: string;
  teacherId: string;
  teacherName: string;
  className: string;
  subject: string;
  questionText: string;
  marks: number;
  createdAt: string;
}

export interface AnswerSubmission {
  id: string;
  questionId: string;
  studentId: string;
  studentName: string;
  customUsername: string;
  className: string;
  subject: string;
  photoUrl: string;
  submittedAt: string;
  marksAwarded?: number;
  evaluatedAt?: string;
  evaluatorName?: string;
}
