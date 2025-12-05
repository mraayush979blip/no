import { Branch, Batch, Subject, User, UserRole, FacultyAssignment } from './types';

export const SEED_BRANCHES: Branch[] = [
  { id: 'b_cse', name: 'Computer Science (CSE)' },
  { id: 'b_aiml', name: 'AI & ML (AIML)' },
  { id: 'b_ece', name: 'Electronics (ECE)' }
];

export const SEED_BATCHES: Batch[] = [
  { id: 'batch_cse_1', name: 'CSE Batch A', branchId: 'b_cse' },
  { id: 'batch_cse_2', name: 'CSE Batch B', branchId: 'b_cse' },
  { id: 'batch_aiml_1', name: 'AIML Batch 1', branchId: 'b_aiml' }
];

export const SEED_SUBJECTS: Subject[] = [
  { id: 'sub_math', name: 'Engineering Mathematics', code: 'M101' },
  { id: 'sub_ds', name: 'Data Structures', code: 'CS201' },
  { id: 'sub_network', name: 'Computer Networks', code: 'CS304' }
];

export const SEED_USERS: User[] = [
  {
    uid: 'admin_1',
    email: 'hod@acropolis.in',
    displayName: 'Admin HOD',
    role: UserRole.ADMIN
  },
  {
    uid: 'fac_1',
    email: 'faculty@acropolis.in',
    displayName: 'Prof. Sharma',
    role: UserRole.FACULTY
  },
  {
    uid: 'fac_2',
    email: 'verma@acropolis.in',
    displayName: 'Prof. Verma',
    role: UserRole.FACULTY
  },
  {
    uid: 'stu_1',
    email: 'student@acropolis.in',
    displayName: 'Rahul Singh',
    role: UserRole.STUDENT,
    studentData: {
      branchId: 'b_cse',
      batchId: 'batch_cse_1',
      enrollmentId: '0827CS211001'
    }
  },
  {
    uid: 'stu_2',
    email: 'priya@acropolis.in',
    displayName: 'Priya Patel',
    role: UserRole.STUDENT,
    studentData: {
      branchId: 'b_cse',
      batchId: 'batch_cse_1',
      enrollmentId: '0827CS211002'
    }
  }
];

// Initial assignments: Prof Sharma teaches Data Structures to CSE Batch A
export const SEED_ASSIGNMENTS: FacultyAssignment[] = [
  {
    id: 'assign_1',
    facultyId: 'fac_1',
    branchId: 'b_cse',
    batchId: 'batch_cse_1',
    subjectId: 'sub_ds'
  },
  {
    id: 'assign_2',
    facultyId: 'fac_1',
    branchId: 'b_cse',
    batchId: 'batch_cse_2',
    subjectId: 'sub_ds'
  }
];
