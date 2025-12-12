
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { Branch, Batch, User, Subject, FacultyAssignment, AttendanceRecord } from '../types';
import { Card, Button, Input, Select, Modal, FileUploader } from '../components/UI';
import { Plus, Trash2, ChevronRight, Users, BookOpen, Database, Key, ArrowLeft, CheckCircle2, XCircle, Trash, Eye, Layers, Edit2, Shield, Mail, Save, GraduationCap } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'faculty'>('students');
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!window.confirm("This will reset/overwrite initial data. Continue?")) return;
    setSeeding(true);
    try {
      await db.seedDatabase();
      alert("Database initialized successfully!");
    } catch(e: any) {
      if (e.code === 'permission-denied') {
        alert("Permission Denied! Check Firestore Rules.");
      } else {
        alert("Seeding failed: " + e.message);
      }
    } finally {
      setSeeding(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-slate-300 pb-1">
        <div className="flex space-x-2">
          <button onClick={() => setActiveTab('students')} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'students' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>Manage Students</button>
          <button onClick={() => setActiveTab('faculty')} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'faculty' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>Manage Faculty & Subjects</button>
        </div>
        <button onClick={handleSeed} disabled={seeding} className="mb-2 text-xs flex items-center px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded transition-colors"><Database className="h-3 w-3 mr-1.5" />{seeding ? 'Seeding...' : 'Initialize Database'}</button>
      </div>
      {activeTab === 'students' ? <StudentManagement /> : <FacultyManagement />}
    </div>
  );
};

// ... AdminStudentDetail component ...
const AdminStudentDetail: React.FC<{ student: User; onBack: () => void }> = ({ student, onBack }) => {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [att, subs] = await Promise.all([db.getStudentAttendance(student.uid), db.getSubjects()]);
        setAttendance(att);
        setSubjects(subs);
      } finally { setLoading(false); }
    };
    load();
  }, [student.uid]);

  const getSubjectStats = (subjectId: string) => {
    const relevant = attendance.filter(a => a.subjectId === subjectId);
    const total = relevant.length;
    const present = relevant.filter(a => a.isPresent).length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, percentage };
  };

  const subjectStats = subjects.map(s => {
    const stats = getSubjectStats(s.id);
    return { ...s, ...stats };
  }).filter(s => s.total > 0); 

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{student.displayName}</h3>
            <p className="text-sm text-slate-500 font-mono">{student.studentData?.enrollmentId} {student.studentData?.rollNo ? `| Roll: ${student.studentData.rollNo}` : ''}</p>
          </div>
        </div>
      </div>
      {loading ? <div className="p-12 text-center text-slate-500">Loading records...</div> : (
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectStats.map(stat => (
                <div key={stat.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2"><span className="font-semibold text-slate-800">{stat.name}</span><span className={`text-sm font-bold px-2 py-0.5 rounded ${stat.percentage < 75 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{stat.percentage}%</span></div>
                  <div className="text-sm text-slate-500 flex justify-between"><span>Attended: {stat.present} / {stat.total}</span></div>
                </div>
              ))}
              {subjectStats.length === 0 && <div className="col-span-full p-4 text-center bg-slate-50 border border-dashed rounded text-slate-500">No attendance data.</div>}
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-2 text-slate-900">Date</th><th className="px-4 py-2 text-slate-900">Subject</th><th className="px-4 py-2 text-center text-slate-900">Slot</th><th className="px-4 py-2 text-right text-slate-900">Status</th></tr></thead>
                  <tbody>
                     {attendance.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map(r => (
                        <tr key={r.id} className="hover:bg-slate-50"><td className="px-4 py-2 text-slate-900 font-mono">{r.date}</td><td className="px-4 py-2 text-slate-900">{subjects.find(s=>s.id===r.subjectId)?.name}</td><td className="px-4 py-2 text-center text-slate-900">L{r.lectureSlot||1}</td><td className="px-4 py-2 text-right">{r.isPresent?<span className="text-green-600 font-bold">Present</span>:<span className="text-red-600 font-bold">Absent</span>}</td></tr>
                     ))}
                  </tbody>
               </table>
            </div>
        </div>
      )}
    </Card>
  );
}

const StudentManagement: React.FC = () => {
  const [level, setLevel] = useState<'branches' | 'batches' | 'students'>('branches');
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  
  const [selBranch, setSelBranch] = useState<Branch | null>(null);
  const [selBatch, setSelBatch] = useState<Batch | null>(null);

  const [viewStudent, setViewStudent] = useState<User | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadBranches(); }, []);
  const loadBranches = async () => { setBranches(await db.getBranches()); };
  
  const handleSelectBranch = async (b: Branch) => { setSelBranch(b); setBatches(await db.getBatches(b.id)); setLevel('batches'); };
  const handleSelectBatch = async (b: Batch) => { 
      setSelBatch(b); 
      if (selBranch) setStudents(await db.getStudents(selBranch.id, b.id)); 
      setLevel('students'); 
  };

  const handleAdd = async () => {
    if (!newItemName) return;
    if (level === 'branches') { await db.addBranch(newItemName); loadBranches(); }
    else if (level === 'batches' && selBranch) { await db.addBatch(newItemName, selBranch.id); setBatches(await db.getBatches(selBranch.id)); }
    setNewItemName('');
  };

  const handleCSVUpload = async (file: File) => {
    if (!selBranch || !selBatch) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const newStudents: Partial<User>[] = [];
      const startIndex = lines[0].toLowerCase().includes('enrollment') ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map(s => s.trim());
        let enroll, roll, name, email;
        if (parts.length >= 4) { [enroll, roll, name, email] = parts; }
        else if (parts.length === 3) { [enroll, name, email] = parts; roll = ''; }
        if (enroll && name && email) {
          newStudents.push({
            displayName: name, email: email,
            studentData: { branchId: selBranch.id, batchId: selBatch.id, enrollmentId: enroll, rollNo: roll }
          });
        }
      }
      if (newStudents.length > 0) {
        try { await db.importStudents(newStudents); alert(`Imported ${newStudents.length} students.`); setStudents(await db.getStudents(selBranch.id, selBatch.id)); } catch (err: any) { alert("Import failed: " + err.message); }
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const [newStudent, setNewStudent] = useState({ name: '', email: '', enroll: '', rollNo: '' });
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selBranch || !selBatch) return;
    setLoading(true);
    try {
      await db.createStudent({ displayName: newStudent.name, email: newStudent.email, studentData: { branchId: selBranch.id, batchId: selBatch.id, enrollmentId: newStudent.enroll, rollNo: newStudent.rollNo } });
      setNewStudent({ name: '', email: '', enroll: '', rollNo: '' });
      setStudents(await db.getStudents(selBranch.id, selBatch.id));
      alert(`Student added.`);
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm("Delete?")) return;
    if (level === 'branches') { await db.deleteBranch(id); loadBranches(); }
    else if (level === 'batches' && selBranch) { await db.deleteBatch(id); setBatches(await db.getBatches(selBranch.id)); }
    else if (level === 'students' && selBranch && selBatch) { await db.deleteUser(id); setStudents(await db.getStudents(selBranch.id, selBatch.id)); }
  };

  if (viewStudent) return <AdminStudentDetail student={viewStudent} onBack={() => setViewStudent(null)} />;

  let listItems: any[] = [];
  if (level === 'branches') listItems = branches;
  else if (level === 'batches') listItems = batches;

  return (
    <Card>
      <div className="flex items-center text-sm mb-6 text-slate-500 flex-wrap">
        <span className={`cursor-pointer hover:text-indigo-600 ${level === 'branches' ? 'font-bold text-indigo-600' : ''}`} onClick={() => { setLevel('branches'); setSelBranch(null); }}>Branches</span>
        {selBranch && <><ChevronRight className="h-4 w-4 mx-2" /><span className={`cursor-pointer hover:text-indigo-600 ${level === 'batches' ? 'font-bold text-indigo-600' : ''}`} onClick={() => { setLevel('batches'); setSelBatch(null); }}>{selBranch.name}</span></>}
        {selBatch && <><ChevronRight className="h-4 w-4 mx-2" /><span className="font-bold text-indigo-600">{selBatch.name}</span></>}
      </div>

      {level !== 'students' ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder={`New ${level === 'branches' ? 'Branch' : 'Batch'} Name`} value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-grow text-slate-900 bg-white" />
            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1 inline" /> Add</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {listItems.map((item) => (
              <div key={item.id} onClick={() => { if(level==='branches') handleSelectBranch(item); else handleSelectBatch(item); }} className="group border p-4 rounded-lg cursor-pointer bg-slate-50 hover:border-indigo-400 hover:shadow-md flex justify-between items-center">
                 <div className="flex items-center"><span className="font-semibold text-slate-800">{item.name}</span></div>
                 <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-slate-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4"/></button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
           <div className="bg-slate-50 p-4 rounded border">
              <form onSubmit={handleAddStudent} className="grid grid-cols-4 gap-4 mb-2">
                 <Input label="Name" required value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="mb-0 text-slate-900 bg-white"/>
                 <Input label="Email" required value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} className="mb-0 text-slate-900 bg-white"/>
                 <Input label="Enrollment" required value={newStudent.enroll} onChange={e => setNewStudent({...newStudent, enroll: e.target.value})} className="mb-0 text-slate-900 bg-white"/>
                 <Input label="Roll No" value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})} className="mb-0 text-slate-900 bg-white"/>
              </form>
              <div className="flex justify-end gap-2"><FileUploader onFileSelect={handleCSVUpload} label="Import CSV" /><Button onClick={handleAddStudent} disabled={loading}>{loading?'Adding...':'Add Student'}</Button></div>
           </div>
           <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 border-b"><tr><th className="p-2 text-slate-900">Enrollment</th><th className="p-2 text-slate-900">Roll No</th><th className="p-2 text-slate-900">Name</th><th className="p-2 text-slate-900">Email</th><th className="p-2 text-right text-slate-900">Actions</th></tr></thead>
               <tbody>{students.map(s=>(<tr key={s.uid} className="border-b group"><td className="p-2 font-mono text-slate-900">{s.studentData?.enrollmentId}</td><td className="p-2 font-mono text-slate-900">{s.studentData?.rollNo}</td><td className="p-2 text-slate-900">{s.displayName}</td><td className="p-2 text-slate-900">{s.email}</td><td className="p-2 text-right"><button onClick={()=>setViewStudent(s)} className="text-indigo-500 mr-2 opacity-0 group-hover:opacity-100"><Eye className="h-4 w-4"/></button><button onClick={()=>handleDelete(s.uid)} className="text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4"/></button></td></tr>))}</tbody>
           </table>
        </div>
      )}
    </Card>
  );
};

// --- Faculty Management Logic ---

const FacultyDetailView: React.FC<{ faculty: User; onBack: () => void }> = ({ faculty, onBack }) => {
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // New Assignment State
  const [newAssign, setNewAssign] = useState({ branchId: '', batchId: '', subjectId: '' });
  const [assignBatches, setAssignBatches] = useState<Batch[]>([]);

  // Password Reset State
  const [resetPass, setResetPass] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [faculty.uid]);

  const loadData = async () => {
    const [assigns, br, sub, bts] = await Promise.all([
       db.getAssignments(faculty.uid),
       db.getBranches(),
       db.getSubjects(),
       // We'll load all batches for metadata display, though in a huge app this might be paginated
       Promise.all((await db.getBranches()).map(b => db.getBatches(b.id))).then(res => res.flat())
    ]);
    setAssignments(assigns);
    setBranches(br);
    setSubjects(sub);
    setAllBatches(bts);
    setLoading(false);
  };

  const handleBranchSelect = async (branchId: string) => {
    setNewAssign({...newAssign, branchId, batchId: ''});
    if (branchId) {
        setAssignBatches(await db.getBatches(branchId));
    } else {
        setAssignBatches([]);
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssign.branchId || !newAssign.subjectId) return;
    try {
        await db.assignFaculty({
            facultyId: faculty.uid,
            branchId: newAssign.branchId,
            batchId: newAssign.batchId || 'ALL',
            subjectId: newAssign.subjectId
        });
        setNewAssign({ branchId: '', batchId: '', subjectId: '' });
        loadData();
    } catch (e: any) {
        alert("Error: " + e.message);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
      if(window.confirm("Remove this assignment?")) {
          await db.removeAssignment(id);
          loadData();
      }
  };

  const handlePasswordReset = async () => {
      if (!resetPass) return;
      setResetLoading(true);
      try {
          await db.resetFacultyPassword(faculty.uid, resetPass);
          alert("Password updated successfully.");
          setResetPass('');
      } catch (e: any) {
          alert("Error: " + e.message);
      } finally {
          setResetLoading(false);
      }
  };

  const batchName = (id: string) => {
      if (id === 'ALL') return 'All Batches';
      return allBatches.find(b => b.id === id)?.name || id;
  };

  const branchName = (id: string) => branches.find(b => b.id === id)?.name || id;
  const subjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  if (loading) return <div>Loading Profile...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft className="h-5 w-5 text-slate-600" /></button>
            <div className="flex-grow">
                <h2 className="text-2xl font-bold text-slate-800">{faculty.displayName}</h2>
                <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="h-4 w-4" /> {faculty.email}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assignments Column */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-semibold text-lg text-slate-800">Academic Assignments</h3>
                    </div>
                    
                    {/* Add Assignment Form */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Assign New Subject</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <Select value={newAssign.branchId} onChange={e => handleBranchSelect(e.target.value)} className="mb-0 text-sm">
                                <option value="">Select Branch</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </Select>
                            <Select value={newAssign.batchId} onChange={e => setNewAssign({...newAssign, batchId: e.target.value})} disabled={!newAssign.branchId} className="mb-0 text-sm">
                                <option value="">All Batches</option>
                                {assignBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </Select>
                            <Select value={newAssign.subjectId} onChange={e => setNewAssign({...newAssign, subjectId: e.target.value})} className="mb-0 text-sm">
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </Select>
                            <Button onClick={handleAddAssignment} disabled={!newAssign.branchId || !newAssign.subjectId}>Assign</Button>
                        </div>
                    </div>

                    {/* Assignments Table */}
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-3 text-slate-700 font-semibold">Subject</th>
                                    <th className="p-3 text-slate-700 font-semibold">Branch</th>
                                    <th className="p-3 text-slate-700 font-semibold">Context (Batch)</th>
                                    <th className="p-3 text-right text-slate-700 font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {assignments.map(a => (
                                    <tr key={a.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-900">{subjectName(a.subjectId)}</td>
                                        <td className="p-3 text-slate-600">{branchName(a.branchId)}</td>
                                        <td className="p-3 text-slate-600">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${a.batchId === 'ALL' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {batchName(a.batchId)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleRemoveAssignment(a.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {assignments.length === 0 && (
                                    <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">No active assignments found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Security Column */}
            <div className="space-y-6">
                <Card className="bg-white border-slate-200">
                     <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                        <Shield className="h-5 w-5 text-red-600" />
                        <h3 className="font-semibold text-lg text-slate-800">Security</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reset Password</label>
                            <Input 
                                type="text" 
                                placeholder="Enter new password" 
                                value={resetPass} 
                                onChange={e => setResetPass(e.target.value)}
                                className="mb-2"
                            />
                            <Button onClick={handlePasswordReset} disabled={resetLoading || !resetPass} className="w-full">
                                {resetLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                             <button className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-2 w-full justify-center p-2 hover:bg-red-50 rounded transition-colors">
                                <Trash2 className="h-4 w-4" />
                                Delete Faculty Account
                             </button>
                             <p className="text-xs text-center text-slate-400 mt-2">Caution: This action cannot be undone.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
  );
};

const FacultyManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'subjects' | 'faculty_list' | 'allocations'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  
  // View State
  const [selectedFaculty, setSelectedFaculty] = useState<User | null>(null);

  // Forms
  const [newSub, setNewSub] = useState({ name: '', code: '' });
  const [newFac, setNewFac] = useState({ name: '', email: '', password: '' });

  // Metadata for allocations table
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batchMap, setBatchMap] = useState<Record<string, string>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [sub, fac, assign, br, allBatches] = await Promise.all([
        db.getSubjects(),
        db.getFaculty(),
        db.getAssignments(),
        db.getBranches(),
        Promise.all((await db.getBranches()).map(b => db.getBatches(b.id))).then(res => res.flat())
    ]);

    setSubjects(sub);
    setFaculty(fac);
    setAssignments(assign);
    setBranches(br);
    
    const bMap: Record<string, string> = {};
    allBatches.forEach(b => bMap[b.id] = b.name);
    setBatchMap(bMap);
  };

  const handleAddSubject = async () => { if(newSub.name) { await db.addSubject(newSub.name, newSub.code); setNewSub({name:'',code:''}); loadData(); }};
  const handleDeleteSubject = async (id: string) => { if(confirm("Delete?")) { await db.deleteSubject(id); loadData(); }};
  
  const handleAddFaculty = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      try { 
          await db.createFaculty({displayName:newFac.name, email:newFac.email}, newFac.password); 
          setNewFac({name:'',email:'',password:''}); 
          loadData(); 
          alert("Faculty added."); 
      } catch(e:any){alert(e.message);} 
  };
  
  const handleDeleteFaculty = async (uid: string) => { if(confirm("Delete?")) { await db.deleteUser(uid); loadData(); }};

  if (selectedFaculty) {
      return <FacultyDetailView faculty={selectedFaculty} onBack={() => { setSelectedFaculty(null); loadData(); }} />;
  }

  const getFacultyName = (uid: string) => faculty.find(f => f.uid === uid)?.displayName || uid;
  const getSubjectName = (sid: string) => subjects.find(s => s.id === sid)?.name || sid;
  const getBranchName = (bid: string) => branches.find(b => b.id === bid)?.name || bid;
  const getBatchName = (bid: string) => bid === 'ALL' ? 'All Batches' : (batchMap[bid] || bid);

  return (
     <div className="space-y-6">
       <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg w-fit">
          <button onClick={()=>setActiveSubTab('subjects')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeSubTab==='subjects'?'bg-white text-indigo-700 shadow-sm':'text-slate-600 hover:text-slate-900'}`}>Subjects</button>
          <button onClick={()=>setActiveSubTab('faculty_list')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeSubTab==='faculty_list'?'bg-white text-indigo-700 shadow-sm':'text-slate-600 hover:text-slate-900'}`}>Faculty Directory</button>
          <button onClick={()=>setActiveSubTab('allocations')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeSubTab==='allocations'?'bg-white text-indigo-700 shadow-sm':'text-slate-600 hover:text-slate-900'}`}>Global Allocations</button>
       </div>

       {activeSubTab==='subjects' && (
         <Card>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Subject Library</h3>
            <div className="flex gap-2 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 items-end">
                <div className="flex-grow"><label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name</label><input className="border border-slate-300 rounded p-2 w-full text-sm text-slate-900 bg-white" value={newSub.name} onChange={e=>setNewSub({...newSub,name:e.target.value})} placeholder="e.g. Data Structures" /></div>
                <div className="w-32"><label className="block text-xs font-semibold text-slate-500 mb-1">Code</label><input className="border border-slate-300 rounded p-2 w-full text-sm text-slate-900 bg-white" value={newSub.code} onChange={e=>setNewSub({...newSub,code:e.target.value})} placeholder="CS101" /></div>
                <Button onClick={handleAddSubject} disabled={!newSub.name}>Add Subject</Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-3 text-slate-900">Code</th><th className="p-3 text-slate-900">Name</th><th className="p-3 text-right text-slate-900">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{subjects.map(s=><tr key={s.id} className="hover:bg-slate-50"><td className="p-3 font-mono text-slate-600">{s.code}</td><td className="p-3 font-medium text-slate-900">{s.name}</td><td className="p-3 text-right"><button onClick={()=>handleDeleteSubject(s.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></button></td></tr>)}</tbody></table>
            </div>
         </Card>
       )}

       {activeSubTab==='faculty_list' && (
         <Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Faculty Directory</h3>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-3 text-slate-900">Name</th>
                                    <th className="p-3 text-slate-900">Email</th>
                                    <th className="p-3 text-right text-slate-900">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {faculty.map(f => (
                                    <tr key={f.uid} className="hover:bg-slate-50 group">
                                        <td className="p-3 font-medium text-slate-900 cursor-pointer text-indigo-700 hover:underline" onClick={() => setSelectedFaculty(f)}>{f.displayName}</td>
                                        <td className="p-3 text-slate-600">{f.email}</td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => setSelectedFaculty(f)} className="text-indigo-500 hover:text-indigo-700 mr-3"><Edit2 className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeleteFaculty(f.uid)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                                {faculty.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400">No faculty found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 h-fit sticky top-4">
                    <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Add New Faculty</h4>
                    <form onSubmit={handleAddFaculty} className="space-y-3">
                        <Input label="Name" value={newFac.name} onChange={e => setNewFac({...newFac, name: e.target.value})} required className="bg-white" />
                        <Input label="Email" type="email" value={newFac.email} onChange={e => setNewFac({...newFac, email: e.target.value})} required className="bg-white" />
                        <Input label="Initial Password" type="text" value={newFac.password} onChange={e => setNewFac({...newFac, password: e.target.value})} placeholder="Default: password123" className="bg-white" />
                        <Button type="submit" className="w-full">Create Account</Button>
                    </form>
                </div>
            </div>
         </Card>
       )}

       {activeSubTab==='allocations' && (
           <Card>
               <h3 className="text-lg font-bold text-slate-800 mb-4">Global Allocations</h3>
               <p className="text-sm text-slate-500 mb-4">This is a read-only view of all teaching assignments across the institute. To manage assignments, go to the Faculty Directory and select a specific faculty member.</p>
               <div className="overflow-hidden rounded-lg border border-slate-200">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 border-b">
                           <tr>
                               <th className="p-3 text-slate-900">Faculty</th>
                               <th className="p-3 text-slate-900">Subject</th>
                               <th className="p-3 text-slate-900">Branch</th>
                               <th className="p-3 text-slate-900">Batch</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {assignments.map(a => (
                               <tr key={a.id} className="hover:bg-slate-50">
                                   <td className="p-3 font-medium text-indigo-700">{getFacultyName(a.facultyId)}</td>
                                   <td className="p-3 text-slate-900">{getSubjectName(a.subjectId)}</td>
                                   <td className="p-3 text-slate-600">{getBranchName(a.branchId)}</td>
                                   <td className="p-3 text-slate-600">{getBatchName(a.batchId)}</td>
                               </tr>
                           ))}
                           {assignments.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-400">No assignments found.</td></tr>}
                       </tbody>
                   </table>
               </div>
           </Card>
       )}
     </div>
  );
};
