import React from 'react';
import { X, Upload } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = 
  ({ className = '', variant = 'primary', ...props }) => {
  const base = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-sm font-medium text-slate-900 mb-1">{label}</label>}
    <input 
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white placeholder-slate-400 ${className}`}
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className = '', children, ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-sm font-medium text-slate-900 mb-1">{label}</label>}
    <select 
      className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const FileUploader: React.FC<{ onFileSelect: (file: File) => void; accept?: string; label?: string }> = ({ onFileSelect, accept = ".csv", label = "Upload File" }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="inline-block">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept={accept} 
        className="hidden" 
      />
      <Button variant="secondary" onClick={handleClick} className="flex items-center text-sm">
        <Upload className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </div>
  );
};

export const AcropolisLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 150" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
    {/* Blue Orbit */}
    <ellipse cx="100" cy="75" rx="85" ry="40" transform="rotate(-15 100 75)" stroke="#1e3a8a" strokeWidth="6" />
    
    {/* Red Orbit */}
    <path d="M180 60C170 20 30 20 20 60" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" transform="rotate(15 100 75)" />
    <path d="M20 90C30 130 170 130 180 90" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" transform="rotate(15 100 75)" />

    {/* Pillar/Building (Education) */}
    <rect x="75" y="45" width="50" height="12" fill="#1e3a8a" /> {/* Top Capital */}
    <rect x="82" y="57" width="8" height="50" fill="#1e3a8a" /> {/* Col 1 */}
    <rect x="96" y="57" width="8" height="50" fill="#1e3a8a" /> {/* Col 2 */}
    <rect x="110" y="57" width="8" height="50" fill="#1e3a8a" /> {/* Col 3 */}
    <rect x="70" y="107" width="60" height="8" fill="#1e3a8a" /> {/* Base */}
    
    {/* Gear (Engineering/Tech) - Positioned near top right of pillar */}
    <circle cx="125" cy="45" r="14" stroke="#dc2626" strokeWidth="4" />
    <path d="M125 28V34 M125 56V62 M111 45H117 M133 45H139" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
    <circle cx="125" cy="45" r="5" fill="#dc2626" />
  </svg>
);