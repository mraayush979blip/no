import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { User, Subject, AttendanceRecord } from '../types';
import { Card } from '../components/UI';
import { PieChart, AlertCircle } from 'lucide-react';

interface StudentProps {
  user: User;
}

export const StudentDashboard: React.FC<StudentProps> = ({ user }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // 1. Get all subjects (in a real app, filtering by user's branch would happen here)
      const allSubs = await db.getSubjects();
      setSubjects(allSubs);

      // 2. Get my attendance
      const myAtt = await db.getStudentAttendance(user.uid);
      setAttendance(myAtt);
      
      setLoading(false);
    };
    loadData();
  }, [user.uid]);

  const calculateStats = (subjectId: string) => {
    const relevant = attendance.filter(a => a.subjectId === subjectId);
    const total = relevant.length;
    const present = relevant.filter(a => a.isPresent).length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, percentage };
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading your academic records...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-900 rounded-lg p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-1">Welcome back, {user.displayName.split(' ')[0]}</h2>
        <p className="text-indigo-200">
           {user.studentData?.enrollmentId} • {user.studentData?.branchId.replace('b_', '').toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {subjects.map(subject => {
          const { total, present, percentage } = calculateStats(subject.id);
          const isLow = percentage < 75;
          const statusColor = isLow ? 'text-red-600' : 'text-green-600';
          const progressColor = isLow ? 'bg-red-500' : 'bg-green-500';
          const borderColor = isLow ? 'border-red-200' : 'border-slate-200';

          // Simulate data if total is 0 for demo purposes (so the UI looks populated)
          // In production, remove this OR block
          const dispTotal = total || 0; 
          const dispPercent = total === 0 ? 100 : percentage; 

          return (
            <div key={subject.id} className={`bg-white rounded-xl shadow-sm border ${borderColor} p-6 relative overflow-hidden`}>
              {isLow && total > 0 && (
                <div className="absolute top-0 right-0 bg-red-100 text-red-700 px-2 py-1 text-xs font-bold rounded-bl-lg flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> Low Attendance
                </div>
              )}
              
              <h3 className="font-bold text-slate-900 text-lg mb-1">{subject.name}</h3>
              <p className="text-slate-500 text-sm mb-4 font-mono">{subject.code}</p>

              <div className="flex items-end justify-between mb-2">
                <div>
                   <span className={`text-4xl font-bold ${total === 0 ? 'text-slate-400' : statusColor}`}>
                     {dispPercent}%
                   </span>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <div className="font-semibold">{present} / {dispTotal}</div>
                  <div className="text-xs text-slate-400">Classes Attended</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${progressColor}`} 
                  style={{ width: `${dispPercent}%` }}
                ></div>
              </div>

              {total === 0 && (
                <p className="text-xs text-center text-slate-400 italic">No classes conducted yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
