import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { Landing } from './pages/Landing/Landing';
import { Register } from './pages/Auth/Register';
import { Login } from './pages/Auth/Login';
import { Notes } from './pages/Vault/Notes';
import { Agents } from './pages/Agents/Agents';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isClawSigned } = useAuth();
  if (!isClawSigned) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1419] text-slate-900 dark:text-[#faf8f6] font-sans">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}
