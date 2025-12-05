import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Branch, Batch, User, Subject, FacultyAssignment, AttendanceRecord } from '../types';
import { Card, Button, Input } from '../components/UI';
import { Check, X, ArrowRight, ArrowLeft, Calendar, Save } from 'lucide-react';

interface FacultyProps {
  user: User;
}

export const FacultyDashboard: React.FC<FacultyProps> = ({ user }) => {
  const [step, setStep] = useState(1);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  
  // Selection State
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  // Data for Selects
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  
  // Final Step Data
  const [students, setStudents] = useState<User[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Initial Load: Get assignments for this faculty
  useEffect(() => {
    const loadInit = async () => {
      const myAssignments = await db.getAssignments(user.uid);
      setAssignments(myAssignments);

      // Extract unique branches from assignments
      const branchIds = Array.from(new Set(myAssignments.map(a => a.branchId)));
      const allBranches = await db.getBranches();
      setAvailableBranches(allBranches.filter(b => branchIds.includes(b.id)));
    };
    loadInit();
  }, [user.uid]);

  // Step 2: Load Batches based on Branch
  useEffect(() => {
    if (selectedBranchId) {
      const loadBatches = async () => {
        // Filter assignments for this branch
        const relevant = assignments.filter(a => a.branchId === selectedBranchId);
        const batchIds = Array.from(new Set(relevant.map(a => a.batchId)));
        
        const allBatches = await db.getBatches(selectedBranchId);
        setAvailableBatches(allBatches.filter(b => batchIds.includes(b.id)));
      };
      loadBatches();
    }
  }, [selectedBranchId, assignments]);

  // Step 3: Load Subjects based on Branch & Batch
  useEffect(() => {
    if (selectedBranchId && selectedBatchId) {
      const loadSubjects = async () => {
        const relevant = assignments.filter(a => a.branchId === selectedBranchId && a.batchId === selectedBatchId);
        const subIds = relevant.map(a => a.subjectId);
        
        const allSubs = await db.getSubjects();
        const mySubs = allSubs.filter(s => subIds.includes(s.id));
        setAvailableSubjects(mySubs);

        // Auto-skip logic: If only 1 subject, select it and move to dashboard
        if (mySubs.length === 1 && step === 3) {
           setSelectedSubjectId(mySubs[0].id);
           setStep(4);
        }
      };
      loadSubjects();
    }
  }, [selectedBranchId, selectedBatchId, assignments, step]);

  // Step 4: Load Students and Existing Attendance
  useEffect(() => {
    if (step === 4 && selectedBranchId && selectedBatchId && selectedSubjectId) {
      const loadClassData = async () => {
        setLoading(true);
        const stu = await db.getStudents(selectedBranchId, selectedBatchId);
        setStudents(stu);
        
        // Initialize all as present by default if new
        const initialStatus: Record<string, boolean> = {};
        stu.forEach(s => initialStatus[s.uid] = true);

        // Fetch existing
        const existing = await db.getAttendance(selectedBranchId, selectedBatchId, selectedSubjectId, attendanceDate);
        if (existing.length > 0) {
          existing.forEach(r => initialStatus[r.studentId] = r.isPresent);
        }
        
        setAttendanceStatus(initialStatus);
        setLoading(false);
      };
      loadClassData();
    }
  }, [step, selectedBranchId, selectedBatchId, selectedSubjectId, attendanceDate]);

  const handleSave = async () => {
    setLoading(true);
    const records: AttendanceRecord[] = students.map(s => ({
      id: `${attendanceDate}_${s.uid}_${selectedSubjectId}`,
      date: attendanceDate,
      studentId: s.uid,
      subjectId: selectedSubjectId,
      branchId: selectedBranchId,
      batchId: selectedBatchId,
      facultyId: user.uid,
      isPresent: attendanceStatus[s.uid],
      markedBy: user.uid,
      timestamp: Date.now()
    }));

    await db.saveAttendance(records);
    setLoading(false);
    setMessage('Attendance saved successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleStatus = (uid: string) => {
    setAttendanceStatus(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const reset = () => {
    setStep(1);
    setSelectedBranchId('');
    setSelectedBatchId('');
    setSelectedSubjectId('');
  };

  // --- Wizard Steps Render ---

  if (step === 1) {
    return (
      <Card>
         <h3 className="text-lg font-bold text-slate-800 mb-4">Select Branch</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
           {availableBranches.map(b => (
             <button
               key={b.id}
               onClick={() => { setSelectedBranchId(b.id); setStep(2); }}
               className="p-6 border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-lg bg-white transition flex flex-col items-center text-center group"
             >
               <div className="bg-indigo-50 p-3 rounded-full mb-3 group-hover:bg-indigo-100">
                  <ArrowRight className="h-6 w-6 text-indigo-600" />
               </div>
               <span className="font-semibold text-slate-900">{b.name}</span>
             </button>
           ))}
           {availableBranches.length === 0 && <p className="text-slate-500">No branches assigned to you.</p>}
         </div>
      </Card>
    );
  }

  if (step === 2) {
    return (
      <Card>
        <div className="flex items-center mb-4">
          <button onClick={() => setStep(1)} className="mr-3 p-1 hover:bg-slate-100 rounded"><ArrowLeft className="h-5 w-5 text-slate-500"/></button>
          <h3 className="text-lg font-bold text-slate-800">Select Batch</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {availableBatches.map(b => (
             <button
               key={b.id}
               onClick={() => { setSelectedBatchId(b.id); setStep(3); }}
               className="p-4 border border-slate-200 rounded-lg hover:border-indigo-500 hover:shadow-md bg-white transition text-left font-medium text-slate-900"
             >
               {b.name}
             </button>
           ))}
         </div>
      </Card>
    );
  }

  if (step === 3) {
    return (
      <Card>
         <div className="flex items-center mb-4">
          <button onClick={() => setStep(2)} className="mr-3 p-1 hover:bg-slate-100 rounded"><ArrowLeft className="h-5 w-5 text-slate-500"/></button>
          <h3 className="text-lg font-bold text-slate-800">Select Subject</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {availableSubjects.map(s => (
             <button
               key={s.id}
               onClick={() => { setSelectedSubjectId(s.id); setStep(4); }}
               className="p-4 border border-slate-200 rounded-lg hover:border-indigo-500 hover:shadow-md bg-white transition text-left"
             >
               <span className="block font-bold text-slate-900">{s.name}</span>
               <span className="text-xs text-slate-500">{s.code}</span>
             </button>
           ))}
         </div>
      </Card>
    );
  }

  // Step 4: The Action Dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
         <div className="flex items-center">
            <button onClick={reset} className="mr-4 text-sm text-indigo-600 font-medium hover:underline">Change Class</button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mark Attendance</h2>
              <p className="text-sm text-slate-500">
                {availableBranches.find(b=>b.id===selectedBranchId)?.name} • {availableBatches.find(b=>b.id===selectedBatchId)?.name}
              </p>
            </div>
         </div>
         <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-slate-400" />
            <input 
              type="date" 
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="border-none bg-slate-100 rounded px-2 py-1 text-slate-900 font-medium focus:ring-2 ring-indigo-500"
            />
         </div>
      </div>

      <Card>
        {loading ? <div className="text-center py-8">Loading student list...</div> : (
          <>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg">Student List ({students.length})</h3>
               <div className="text-sm space-x-4">
                 <span className="text-green-600 font-medium">Present: {Object.values(attendanceStatus).filter(v => v).length}</span>
                 <span className="text-red-600 font-medium">Absent: {Object.values(attendanceStatus).filter(v => !v).length}</span>
               </div>
            </div>

            <div className="overflow-x-auto border rounded-lg border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-slate-600 border-b">Roll No.</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 border-b">Student Name</th>
                    <th className="p-3 text-sm font-semibold text-slate-600 border-b text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s.uid} className={`hover:bg-slate-50 transition ${!attendanceStatus[s.uid] ? 'bg-red-50' : ''}`}>
                      <td className="p-3 font-mono text-sm text-slate-700">{s.studentData?.enrollmentId}</td>
                      <td className="p-3 font-medium text-slate-900">{s.displayName}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => toggleStatus(s.uid)}
                          className={`
                            relative inline-flex h-8 w-24 items-center rounded-full transition-colors focus:outline-none
                            ${attendanceStatus[s.uid] ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}
                          `}
                        >
                          <span className={`absolute left-1 flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow transition-transform ${attendanceStatus[s.uid] ? 'translate-x-16' : 'translate-x-0'}`}>
                            {attendanceStatus[s.uid] ? <Check className="h-4 w-4 text-green-600"/> : <X className="h-4 w-4 text-red-600"/>}
                          </span>
                          <span className={`ml-2 text-xs font-bold uppercase ${attendanceStatus[s.uid] ? 'opacity-0' : 'opacity-100'}`}>Absent</span>
                          <span className={`ml-auto mr-8 text-xs font-bold uppercase ${attendanceStatus[s.uid] ? 'opacity-100' : 'opacity-0'}`}>Present</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-slate-500">No students found in this batch.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end items-center">
               {message && <span className="text-green-600 font-medium mr-4 animate-pulse">{message}</span>}
               <Button onClick={handleSave} className="flex items-center space-x-2">
                 <Save className="h-4 w-4" />
                 <span>Submit Attendance</span>
               </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};