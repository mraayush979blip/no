import React, { useEffect, useState } from 'react';
import { db } from './services/db';
import { User, UserRole } from './types';
import { Login } from './views/Login';
import { Layout } from './components/Layout';
import { AdminDashboard } from './views/Admin';
import { FacultyDashboard } from './views/Faculty';
import { StudentDashboard } from './views/Student';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const u = await db.getCurrentUser();
        setUser(u);
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await db.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      title={
        user.role === UserRole.ADMIN ? 'Administrator Portal' : 
        user.role === UserRole.FACULTY ? 'Faculty Dashboard' : 
        'Student Portal'
      }
    >
      {user.role === UserRole.ADMIN && <AdminDashboard />}
      {user.role === UserRole.FACULTY && <FacultyDashboard user={user} />}
      {user.role === UserRole.STUDENT && <StudentDashboard user={user} />}
    </Layout>
  );
};

export default App;
