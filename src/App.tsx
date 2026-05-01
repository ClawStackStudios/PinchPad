import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Navbar } from './features/dashboard/components/layout/Navbar';
import { DashboardLayout } from './features/dashboard/components/layout/DashboardLayout';
import { Landing } from './features/landing/Landing';
import { Register } from './features/auth/Register';
import { Login } from './features/auth/Login';
import { Dashboard } from './features/dashboard/Dashboard';
import { Notes } from './features/notes/Notes';
import { Settings } from './features/settings/Settings';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isClawSigned, isMolting } = useAuth();

  if (isMolting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1419] text-amber-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs">Scanning Exoskeleton...</p>
      </div>
    );
  }

  if (!isClawSigned) return <Navigate to="/login" />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const { isMolting } = useAuth();
  const location = useLocation();

  if (isMolting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1419] text-amber-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs">Initializing Habitat...</p>
      </div>
    );
  }

  const hideNavbar = ['/login', '/register', '/dashboard', '/settings', '/notes'].includes(location.pathname);
  const isDashboard = ['/dashboard', '/notes', '/settings'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419] text-slate-900 dark:text-[#faf8f6] font-sans transition-colors duration-500">
      {!hideNavbar && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout><Dashboard /></DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/notes" element={
          <ProtectedRoute>
            <DashboardLayout><Notes /></DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardLayout><Settings /></DashboardLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}
