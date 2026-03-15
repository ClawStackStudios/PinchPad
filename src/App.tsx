import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { Landing } from './pages/Landing/Landing';
import { Register } from './pages/Auth/Register';
import { Login } from './pages/Auth/Login';
import { Notes } from './pages/Pot/Notes';
import { Agents } from './pages/Agents/Agents';
import { Settings } from './pages/Settings/Settings';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isClawSigned, isMolting, shellKey } = useAuth();
  
  if (isMolting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1419] text-amber-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs">Scanning Exoskeleton...</p>
      </div>
    );
  }

  if (!isClawSigned || !shellKey) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
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

  const hideNavbar = ['/login', '/register', '/settings'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1419] text-slate-900 dark:text-[#faf8f6] font-sans transition-colors duration-500">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
