import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, readSession } from '../services/authService';
import { deriveShellKey } from '../lib/shellCryption';

interface LobsterProfile {
  uuid: string;
  username: string;
  displayName: string | null;
}

interface AuthContextType {
  isClawSigned: boolean;
  isMolting: boolean;
  shellKey: CryptoKey | null;
  lobster: LobsterProfile | null;
  needsShellKey: boolean;
  pinchAccessToken: (fileContent: string) => Promise<void>;
  pinchWithKey: (token: string, uuid?: string, username?: string) => Promise<void>;
  rederiveShellKey: (huKey: string) => Promise<void>;
  clawOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isClawSigned, setIsClawSigned] = useState(false);
  const [isMolting, setIsMolting] = useState(true);
  const [shellKey, setShellKey] = useState<CryptoKey | null>(null);
  const [lobster, setLobster] = useState<LobsterProfile | null>(null);
  const [needsShellKey, setNeedsShellKey] = useState(false);

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
        // Note: shellKey is NOT restorable on refresh because it's derived from the huKey (not stored).
        // The user must still have the huKey available in memory or re-login if they need to decrypt.
        // However, we can restore the authenticated UI state.
        setLobster({
          uuid: pearl.uuid,
          username: pearl.username,
          displayName: pearl.displayName
        });
        setIsClawSigned(true);
        setNeedsShellKey(true); // shellKey is missing, user must re-derive it
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
    setShellKey(null);
    setLobster(null);
    setIsClawSigned(false);
    setNeedsShellKey(false);
  };

  const pinchAccessToken = async (fileContent: string) => {
    const { shellKey, username, uuid, displayName } = await authService.login(fileContent);
    setShellKey(shellKey);
    setLobster({ username, uuid, displayName });
    setIsClawSigned(true);
  };

  const pinchWithKey = async (token: string, uuid?: string, username?: string) => {
    const { shellKey, username: u, uuid: id, displayName } = await authService.loginWithKey(token, uuid, username);
    setShellKey(shellKey);
    setLobster({ username: u, uuid: id, displayName });
    setIsClawSigned(true);
  };

  const rederiveShellKey = async (huKey: string) => {
    const session = readSession();
    if (!session) {
      throw new Error('No active session');
    }
    try {
      const key = await deriveShellKey(huKey, session.uuid);
      setShellKey(key);
      setNeedsShellKey(false);
    } catch (err) {
      throw new Error('Failed to derive shellKey');
    }
  };

  const clawOut = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider value={{
      isClawSigned,
      isMolting,
      shellKey,
      lobster,
      needsShellKey,
      pinchAccessToken,
      pinchWithKey,
      rederiveShellKey,
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
