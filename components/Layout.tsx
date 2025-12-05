import React from 'react';
import { LogOut, User as UserIcon, GraduationCap, LayoutDashboard } from 'lucide-react';
import { User, UserRole } from '../types';
import { db } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, title }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="bg-indigo-900 text-white shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-indigo-300" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Acropolis AMS</h1>
              <p className="text-xs text-indigo-200">Attendance Management System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold">{user.displayName}</span>
              <span className="text-xs bg-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">{user.role}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-indigo-800 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        </div>
        {children}
      </main>

      <footer className="bg-slate-200 text-slate-600 py-4 text-center text-sm border-t border-slate-300">
        &copy; {new Date().getFullYear()} Acropolis Institute. All rights reserved.
      </footer>
    </div>
  );
};
