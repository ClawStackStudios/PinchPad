import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, readSession } from '../services/authService';

interface LobsterProfile {
  uuid: string;
  username: string;
  displayName: string | null;
}

interface AuthContextType {
  isClawSigned: boolean;
  isMolting: boolean;
  lobster: LobsterProfile | null;
  pinchAccessToken: (fileContent: string) => Promise<void>;
  pinchWithKey: (token: string, uuid?: string, username?: string) => Promise<void>;
  clawOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isClawSigned, setIsClawSigned] = useState(false);
  const [isMolting, setIsMolting] = useState(true);
  const [lobster, setLobster] = useState<LobsterProfile | null>(null);

  // 1. Verify token on habitat entry (Page Refresh)
  useEffect(() => {
    const scanExoskeleton = async () => {
      const session = readSession();

      if (!session) {
        setIsMolting(false);
        return;
      }

      try {
        const pearl = await authService.verifyToken(session.token);
        setLobster({
          uuid: pearl.uuid,
          username: pearl.username,
          displayName: pearl.displayName
        });
        setIsClawSigned(true);
      } catch (err) {
        console.warn('[Auth] Session is cracked. Clearing local reef.');
        clearSession();
      } finally {
        setIsMolting(false);
      }
    };

    scanExoskeleton();
  }, []);

  // 2. Listen for auth:expired (401 from apiFetch)
  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn('[Auth] Token expired mid-session. Declawing...');
      clearSession();
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const clearSession = () => {
    authService.logout();
    setLobster(null);
    setIsClawSigned(false);
  };

  const pinchAccessToken = async (fileContent: string) => {
    const { username, uuid, displayName } = await authService.login(fileContent);
    setLobster({ username, uuid, displayName });
    setIsClawSigned(true);
  };

  const pinchWithKey = async (token: string, uuid?: string, username?: string) => {
    const { username: u, uuid: id, displayName } = await authService.loginWithKey(token, uuid, username);
    setLobster({ username: u, uuid: id, displayName });
    setIsClawSigned(true);
  };

  const clawOut = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{
      isClawSigned,
      isMolting,
      lobster,
      pinchAccessToken,
      pinchWithKey,
      clawOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
