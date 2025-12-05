import React, { useState } from 'react';
import { db } from '../services/db';
import { User, UserRole } from '../types';
import { Button, Card, Input } from '../components/UI';
import { GraduationCap, Lock, Mail } from 'lucide-react';
import { SEED_USERS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await db.login(email, password);
      onLogin(user);
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: UserRole) => {
    const demoUser = SEED_USERS.find(u => u.role === role);
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-indigo-600">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Acropolis AMS</h1>
          <p className="text-slate-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input 
              type="email" 
              placeholder="Email address" 
              className="pl-10" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input 
              type="password" 
              placeholder="Password" 
              className="pl-10" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full py-2.5 mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-center text-slate-500 mb-3 uppercase tracking-wide">Demo Credentials</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => fillDemo(UserRole.ADMIN)} className="text-xs py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium transition">Admin</button>
            <button onClick={() => fillDemo(UserRole.FACULTY)} className="text-xs py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium transition">Faculty</button>
            <button onClick={() => fillDemo(UserRole.STUDENT)} className="text-xs py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium transition">Student</button>
          </div>
        </div>
      </Card>
    </div>
  );
};
