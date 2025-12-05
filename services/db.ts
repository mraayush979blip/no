import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, User as FirebaseUser, updateProfile, updatePassword } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, setDoc, query, where, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { User, Branch, Batch, Subject, FacultyAssignment, AttendanceRecord, UserRole } from "../types";
import { SEED_BRANCHES, SEED_BATCHES, SEED_SUBJECTS, SEED_USERS, SEED_ASSIGNMENTS } from "../constants";

// --- Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCdpI72dXZU9ZgDi9rNMsThEym7EYJfuq4",
  authDomain: "acropolis-7d028.firebaseapp.com",
  projectId: "acropolis-7d028",
  storageBucket: "acropolis-7d028.firebasestorage.app",
  messagingSenderId: "917626092892",
  appId: "1:917626092892:web:33637e585e836eeb771599",
  measurementId: "G-7434LNMMNG"
};

// --- Service Interface ---
// We define a generic interface so the UI doesn't care if it's Firebase or LocalStorage
interface IDataService {
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  
  // Hierarchy
  getBranches: () => Promise<Branch[]>;
  addBranch: (name: string) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  
  getBatches: (branchId: string) => Promise<Batch[]>;
  addBatch: (name: string, branchId: string) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  
  // Users
  getStudents: (branchId: string, batchId: string) => Promise<User[]>;
  createStudent: (data: Partial<User>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  
  getSubjects: () => Promise<Subject[]>;
  addSubject: (name: string, code: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  
  getFaculty: () => Promise<User[]>;
  getAssignments: (facultyId?: string) => Promise<FacultyAssignment[]>;
  assignFaculty: (data: Omit<FacultyAssignment, 'id'>) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  
  // Attendance
  getAttendance: (branchId: string, batchId: string, subjectId: string, date?: string) => Promise<AttendanceRecord[]>;
  getStudentAttendance: (studentId: string) => Promise<AttendanceRecord[]>;
  saveAttendance: (records: AttendanceRecord[]) => Promise<void>;
}

// --- MOCK Implementation (LocalStorage) ---
class MockService implements IDataService {
  private simulateDelay = () => new Promise(resolve => setTimeout(resolve, 300));

  private load(key: string, seed: any[]): any[] {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(data);
  }

  private save(key: string, data: any[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  constructor() {
    // Initialize seeds if empty
    this.load('ams_branches', SEED_BRANCHES);
    this.load('ams_batches', SEED_BATCHES);
    this.load('ams_subjects', SEED_SUBJECTS);
    this.load('ams_users', SEED_USERS);
    this.load('ams_assignments', SEED_ASSIGNMENTS);
  }

  async login(email: string, pass: string): Promise<User> {
    await this.simulateDelay();
    const users = this.load('ams_users', SEED_USERS) as User[];
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Simple mock auth - allow any password for demo if user exists
    if (user) {
      localStorage.setItem('ams_current_user', JSON.stringify(user));
      return user;
    }
    throw new Error("Invalid credentials");
  }

  async logout(): Promise<void> {
    localStorage.removeItem('ams_current_user');
  }

  async getCurrentUser(): Promise<User | null> {
    const data = localStorage.getItem('ams_current_user');
    return data ? JSON.parse(data) : null;
  }

  async getBranches(): Promise<Branch[]> {
    await this.simulateDelay();
    return this.load('ams_branches', SEED_BRANCHES);
  }
  
  async addBranch(name: string): Promise<void> {
    const branches = await this.getBranches();
    branches.push({ id: `b_${Date.now()}`, name });
    this.save('ams_branches', branches);
  }

  async deleteBranch(id: string): Promise<void> {
    const branches = await this.getBranches();
    this.save('ams_branches', branches.filter(b => b.id !== id));
  }

  async getBatches(branchId: string): Promise<Batch[]> {
    await this.simulateDelay();
    const batches = this.load('ams_batches', SEED_BATCHES) as Batch[];
    return batches.filter(b => b.branchId === branchId);
  }

  async addBatch(name: string, branchId: string): Promise<void> {
    const batches = this.load('ams_batches', SEED_BATCHES);
    batches.push({ id: `batch_${Date.now()}`, name, branchId });
    this.save('ams_batches', batches);
  }
  
  async deleteBatch(id: string): Promise<void> {
    const batches = this.load('ams_batches', SEED_BATCHES);
    this.save('ams_batches', batches.filter((b: Batch) => b.id !== id));
  }

  async getStudents(branchId: string, batchId: string): Promise<User[]> {
    await this.simulateDelay();
    const users = this.load('ams_users', SEED_USERS) as User[];
    return users.filter(u => u.role === UserRole.STUDENT && u.studentData?.branchId === branchId && u.studentData?.batchId === batchId);
  }

  async createStudent(data: Partial<User>): Promise<void> {
    const users = this.load('ams_users', SEED_USERS);
    users.push({ ...data, uid: `stu_${Date.now()}`, role: UserRole.STUDENT });
    this.save('ams_users', users);
  }

  async deleteUser(uid: string): Promise<void> {
    const users = this.load('ams_users', SEED_USERS);
    this.save('ams_users', users.filter((u: User) => u.uid !== uid));
  }

  async getSubjects(): Promise<Subject[]> {
    await this.simulateDelay();
    return this.load('ams_subjects', SEED_SUBJECTS);
  }

  async addSubject(name: string, code: string): Promise<void> {
    const subs = this.load('ams_subjects', SEED_SUBJECTS);
    subs.push({ id: `sub_${Date.now()}`, name, code });
    this.save('ams_subjects', subs);
  }

  async deleteSubject(id: string): Promise<void> {
    const subs = this.load('ams_subjects', SEED_SUBJECTS);
    this.save('ams_subjects', subs.filter((s: Subject) => s.id !== id));
  }

  async getFaculty(): Promise<User[]> {
    const users = this.load('ams_users', SEED_USERS) as User[];
    return users.filter(u => u.role === UserRole.FACULTY);
  }

  async getAssignments(facultyId?: string): Promise<FacultyAssignment[]> {
    const assigns = this.load('ams_assignments', SEED_ASSIGNMENTS) as FacultyAssignment[];
    if (facultyId) return assigns.filter(a => a.facultyId === facultyId);
    return assigns;
  }

  async assignFaculty(data: Omit<FacultyAssignment, 'id'>): Promise<void> {
    const assigns = this.load('ams_assignments', SEED_ASSIGNMENTS);
    assigns.push({ ...data, id: `assign_${Date.now()}` });
    this.save('ams_assignments', assigns);
  }

  async removeAssignment(id: string): Promise<void> {
    const assigns = this.load('ams_assignments', SEED_ASSIGNMENTS);
    this.save('ams_assignments', assigns.filter((a: FacultyAssignment) => a.id !== id));
  }

  async getAttendance(branchId: string, batchId: string, subjectId: string, date?: string): Promise<AttendanceRecord[]> {
    const all = this.load('ams_attendance', []) as AttendanceRecord[];
    return all.filter(a => 
      a.branchId === branchId && 
      a.batchId === batchId && 
      a.subjectId === subjectId &&
      (!date || a.date === date)
    );
  }

  async getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    const all = this.load('ams_attendance', []) as AttendanceRecord[];
    return all.filter(a => a.studentId === studentId);
  }

  async saveAttendance(records: AttendanceRecord[]): Promise<void> {
    const all = this.load('ams_attendance', []) as AttendanceRecord[];
    
    // Remove existing records for this day/subject to avoid duplicates (overwrite mode)
    if (records.length > 0) {
      const sample = records[0];
      const filtered = all.filter(a => 
        !(a.date === sample.date && a.subjectId === sample.subjectId && a.batchId === sample.batchId)
      );
      const combined = [...filtered, ...records];
      this.save('ams_attendance', combined);
    }
  }
}

// --- Singleton Export ---
// In a real scenario, we would try-catch Firebase initialization. 
// Given the prompt constraints and reliability needs, we default to MockService
// but keep the structure ready for switch.
export const db = new MockService();
