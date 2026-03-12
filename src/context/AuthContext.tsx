import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface LobsterProfile {
  uuid: string;
  username: string;
}

interface AuthContextType {
  isClawSigned: boolean;
  isMolting: boolean;
  shellKey: CryptoKey | null;
  lobster: LobsterProfile | null;
  pinchAccessToken: (fileContent: string) => Promise<void>;
  pinchWithKey: (token: string, uuid?: string, username?: string) => Promise<void>;
  clawOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEYS = {
  token: 'cc_api_token',
  username: 'cc_username',
  uuid: 'cc_user_uuid'
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isClawSigned, setIsClawSigned] = useState(false);
  const [isMolting, setIsMolting] = useState(true);
  const [shellKey, setShellKey] = useState<CryptoKey | null>(null);
  const [lobster, setLobster] = useState<LobsterProfile | null>(null);

  // 1. Verify token on habitat entry (Page Refresh)
  useEffect(() => {
    const scanExoskeleton = async () => {
      const token = sessionStorage.getItem(SESSION_KEYS.token);
      
      if (!token) {
        setIsMolting(false);
        return;
      }

      try {
        const pearl = await authService.verifyToken(token);
        // Note: shellKey is NOT restorable on refresh because it's derived from the huKey (not stored).
        // The user must still have the huKey available in memory or re-login if they need to decrypt.
        // However, we can restore the authenticated UI state.
        setLobster({ uuid: pearl.uuid, username: pearl.username });
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
    setShellKey(null);
    setLobster(null);
    setIsClawSigned(false);
    Object.values(SESSION_KEYS).forEach(k => sessionStorage.removeItem(k));
  };

  const pinchAccessToken = async (fileContent: string) => {
    const { shellKey, username, uuid } = await authService.login(fileContent);
    setShellKey(shellKey);
    setLobster({ username, uuid });
    setIsClawSigned(true);
  };

  const pinchWithKey = async (token: string, uuid?: string, username?: string) => {
    const { shellKey, username: u, uuid: id } = await authService.loginWithKey(token, uuid, username);
    setShellKey(shellKey);
    setLobster({ username: u, uuid: id });
    setIsClawSigned(true);
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
