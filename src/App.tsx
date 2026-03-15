import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { Landing } from './pages/Landing/Landing';
import { Register } from './pages/Auth/Register';
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Notes } from './pages/Pot/Notes';
import { Agents } from './pages/Agents/Agents';
import { Settings } from './pages/Settings/Settings';
import { Loader2, X } from 'lucide-react';

function ReKeyPrompt() {
  const { rederiveShellKey, clawOut } = useAuth();
  const navigate = useLocation();
  const [huKey, setHuKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRederive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!huKey.trim()) {
      setError('ClawKey is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await rederiveShellKey(huKey);
    } catch (err) {
      setError('Failed to derive shellKey. Check your ClawKey and try again.');
      setHuKey('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clawOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1419] text-amber-500 p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/50 dark:border-red-500/70 rounded-2xl shadow-2xl max-w-sm w-full">
        <div className="h-1 w-full rounded-t-2xl bg-amber-500 dark:bg-red-500" />
        <div className="p-6 border-b border-amber-500/30 dark:border-red-500/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Re-enter Your ClawKey</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Derive your encryption key to access your pearls</p>
        </div>

        <form onSubmit={handleRederive} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-white" htmlFor="hukey">
              ClawKey©™
            </label>
            <input
              id="hukey"
              type="password"
              className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-red-500/50 transition-colors mt-1 text-sm"
              placeholder="hu-..."
              value={huKey}
              onChange={(e) => setHuKey(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-amber-500/30 dark:border-red-500/50">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Log Out
            </button>
            <button
              type="submit"
              disabled={isLoading || !huKey.trim()}
              className="flex-1 px-4 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deriving...
                </>
              ) : (
                'Unlock 🦞'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isClawSigned, isMolting, shellKey, needsShellKey } = useAuth();

  if (isMolting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1419] text-amber-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs">Scanning Exoskeleton...</p>
      </div>
    );
  }

  if (!isClawSigned) return <Navigate to="/login" />;
  if (needsShellKey || !shellKey) return <ReKeyPrompt />;

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

  const hideNavbar = ['/login', '/register', '/dashboard', '/settings', '/notes', '/agents'].includes(location.pathname);
  const isDashboard = ['/dashboard', '/notes', '/settings', '/agents'].includes(location.pathname);

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

        <Route path="/agents" element={
          <ProtectedRoute>
            <DashboardLayout><Agents /></DashboardLayout>
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
