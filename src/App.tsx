import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { Landing } from './pages/Landing/Landing';
import { Register } from './pages/Auth/Register';
import { Login } from './pages/Auth/Login';
import { Notes } from './pages/Pot/Notes';
import { Agents } from './pages/Agents/Agents';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isClawSigned, isMolting } = useAuth();
  
  if (isMolting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1419] text-cyan-500">
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { isMolting } = useAuth();

  if (isMolting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1419] text-cyan-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs">Initializing Habitat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1419] text-slate-900 dark:text-[#faf8f6] font-sans transition-colors duration-500">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
