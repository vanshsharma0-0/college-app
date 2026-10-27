import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateScaledDimensions } from './imageCompressor.ts';
import { generateCustomUsername, validateUsername, validatePassword } from './usernameGenerator.ts';
import { STRICT_CLASSES, SUBJECT_LIST } from '../services/storage.ts';

test('calculateScaledDimensions maintains size when width <= 1000', () => {
  const result = calculateScaledDimensions(800, 600, 1000);
  assert.equal(result.width, 800);
  assert.equal(result.height, 600);
});

test('calculateScaledDimensions scales down proportionally when width > 1000', () => {
  const result = calculateScaledDimensions(2000, 1500, 1000);
  assert.equal(result.width, 1000);
  assert.equal(result.height, 750);
});

test('calculateScaledDimensions handles mobile aspect ratios correctly', () => {
  const result = calculateScaledDimensions(3000, 4000, 1000);
  assert.equal(result.width, 1000);
  assert.equal(result.height, 1333);
});

test('generateCustomUsername creates clean username from full name', () => {
  const username = generateCustomUsername('Vansh Sharma', [], 842);
  assert.equal(username, 'vansh_842');
});

test('generateCustomUsername creates clean username from email address', () => {
  const username = generateCustomUsername('collegegolu@gmail.com', [], 512);
  assert.equal(username, 'collegegol_512');
});

test('generateCustomUsername avoids collisions with existing usernames', () => {
  const existing = ['vansh_100', 'vansh_101'];
  const generated = generateCustomUsername('Vansh', existing);
  assert.ok(generated.startsWith('vansh_'));
  assert.ok(!existing.includes(generated));
});

test('validateUsername validates valid and invalid patterns', () => {
  assert.equal(validateUsername('vansh_842').isValid, true);
  assert.equal(validateUsername('teacher1').isValid, true);
  assert.equal(validateUsername('ab').isValid, false); // too short
  assert.equal(validateUsername('').isValid, false); // empty
  assert.equal(validateUsername('vansh@123').isValid, false); // invalid char @
});

test('validatePassword validates length requirement', () => {
  assert.equal(validatePassword('1234').isValid, true);
  assert.equal(validatePassword('abc').isValid, false);
});

test('STRICT_CLASSES matches required [P1, P2, P3, C1, C2, C3, C4]', () => {
  const expected = ['P1', 'P2', 'P3', 'C1', 'C2', 'C3', 'C4'];
  assert.deepEqual(Array.from(STRICT_CLASSES), expected);
});

test('SUBJECT_LIST contains all institutional subject specializations', () => {
  assert.ok(SUBJECT_LIST.includes('Chemistry'));
  assert.ok(SUBJECT_LIST.includes('Programming'));
  assert.ok(SUBJECT_LIST.includes('Mechanics'));
  assert.ok(SUBJECT_LIST.includes('Mathematics'));
  assert.ok(SUBJECT_LIST.includes('EVS'));
  assert.ok(SUBJECT_LIST.includes('Physics'));
  assert.ok(SUBJECT_LIST.includes('Electrical Engineering'));
});

import { canChangeStudentClass } from "../services/storage.ts";
import type { User, AnswerSubmission } from "../types/index.ts";

test("canChangeStudentClass permits one change when unlocked", () => {
  const studentUnlocked: User = {
    uid: "test_std_1",
    email: "test@college.edu",
    fullName: "Test Student",
    customUsername: "test_123",
    className: "P1",
    classLocked: false,
    classChangesRemaining: 1,
    role: "student",
    createdAt: new Date().toISOString(),
  };
  assert.equal(canChangeStudentClass(studentUnlocked), true);
});

test("canChangeStudentClass blocks change when classLocked is true or changes remaining is 0", () => {
  const studentLocked: User = {
    uid: "test_std_2",
    email: "locked@college.edu",
    fullName: "Locked Student",
    customUsername: "locked_456",
    className: "C1",
    classLocked: true,
    classChangesRemaining: 0,
    role: "student",
    createdAt: new Date().toISOString(),
  };
  assert.equal(canChangeStudentClass(studentLocked), false);
});


import {
  verifyDeveloperPin,
  getSubmissionStorageBytes,
  formatStorageSize,
  DEFAULT_DEVELOPER_PIN,
} from "../services/storage.ts";

test("verifyDeveloperPin validates master PIN 706577 and rejects invalid ones", () => {
  assert.equal(DEFAULT_DEVELOPER_PIN, "706577");
  assert.equal(verifyDeveloperPin("706577"), true);
  assert.equal(verifyDeveloperPin("  706577  "), true);
  assert.equal(verifyDeveloperPin("wrong_pin"), false);
  assert.equal(verifyDeveloperPin("2026"), false);
  assert.equal(verifyDeveloperPin(""), false);
});

test("formatStorageSize formats bytes into readable units", () => {
  assert.equal(formatStorageSize(500), "500 B");
  assert.equal(formatStorageSize(2048), "2.0 KB");
  assert.equal(formatStorageSize(1048576 * 2.5), "2.50 MB");
});

test("getSubmissionStorageBytes computes accurate approximate byte size", () => {
  const sampleSubmission: AnswerSubmission = {
    id: "sub_test_size",
    questionId: "q_1",
    studentId: "std_1",
    studentName: "Test Student",
    customUsername: "test_1",
    className: "P1",
    subject: "Chemistry",
    photoUrl: "data:image/jpeg;base64," + "A".repeat(5000),
    submittedAt: new Date().toISOString(),
  };
  const bytes = getSubmissionStorageBytes(sampleSubmission);
  assert.ok(bytes > 5000);
});

import { firebaseConfig } from "../services/firebase.ts";
import { DEFAULT_CLASSES, DEFAULT_TEACHERS } from "../services/storage.ts";

test("firebaseConfig matches user project homeworks-b03f8", () => {
  assert.equal(firebaseConfig.projectId, "homeworks-b03f8");
  assert.equal(firebaseConfig.authDomain, "homeworks-b03f8.firebaseapp.com");
  assert.equal(firebaseConfig.storageBucket, "homeworks-b03f8.appspot.com");
  assert.equal(firebaseConfig.apiKey, "AIzaSyDEVaBxXkrDnG49pFWFK4gVv-HwL85i5tI");
});

test("DEFAULT_CLASSES covers all required classes P1 through C4", () => {
  const classNames = DEFAULT_CLASSES.map((c) => c.name);
  assert.deepEqual(classNames, ["P1", "P2", "P3", "C1", "C2", "C3", "C4"]);
});

test("DEFAULT_TEACHERS includes all subject-specialized teachers and HOD with real credentials", () => {
  const teacherMap = new Map(DEFAULT_TEACHERS.map((t) => [t.username, t]));

  // Chemistry Teacher: username chem_teacher, password chem@2026
  assert.ok(teacherMap.has("chem_teacher"));
  assert.equal(teacherMap.get("chem_teacher")?.password, "chem@2026");
  assert.equal(teacherMap.get("chem_teacher")?.fullName, "Chemistry Teacher");

  // Programming Teacher: username prog_teacher, password prog@2026
  assert.ok(teacherMap.has("prog_teacher"));
  assert.equal(teacherMap.get("prog_teacher")?.password, "prog@2026");
  assert.equal(teacherMap.get("prog_teacher")?.fullName, "Programming Teacher");

  // Mechanics Teacher: username mech_teacher, password mech@2026
  assert.ok(teacherMap.has("mech_teacher"));
  assert.equal(teacherMap.get("mech_teacher")?.password, "mech@2026");
  assert.equal(teacherMap.get("mech_teacher")?.fullName, "Mechanics Teacher");

  // Mathematics Teacher: username math_teacher, password math@2026
  assert.ok(teacherMap.has("math_teacher"));
  assert.equal(teacherMap.get("math_teacher")?.password, "math@2026");
  assert.equal(teacherMap.get("math_teacher")?.fullName, "Mathematics Teacher");

  // EVS Teacher: username evs_teacher, password evs@2026
  assert.ok(teacherMap.has("evs_teacher"));
  assert.equal(teacherMap.get("evs_teacher")?.password, "evs@2026");
  assert.equal(teacherMap.get("evs_teacher")?.fullName, "EVS Teacher");

  // Physics Teacher: username phys_teacher, password phys@2026
  assert.ok(teacherMap.has("phys_teacher"));
  assert.equal(teacherMap.get("phys_teacher")?.password, "phys@2026");
  assert.equal(teacherMap.get("phys_teacher")?.fullName, "Physics Teacher");

  // Electrical Engineering Teacher: username ee_teacher, password ee@2026
  assert.ok(teacherMap.has("ee_teacher"));
  assert.equal(teacherMap.get("ee_teacher")?.password, "ee@2026");
  assert.equal(teacherMap.get("ee_teacher")?.fullName, "Electrical Engineering Teacher");

  // Master HOD Admin: username hod_admin, password 706577
  assert.ok(teacherMap.has("hod_admin"));
  assert.equal(teacherMap.get("hod_admin")?.password, "706577");
  assert.equal(teacherMap.get("hod_admin")?.role, "hod");
});


