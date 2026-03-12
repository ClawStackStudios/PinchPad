import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

interface AuthContextType {
  isClawSigned: boolean;
  shellKey: CryptoKey | null;
  pinchAccessToken: (fileContent: string) => Promise<void>;
  pinchWithKey: (token: string, uuid?: string, username?: string) => Promise<void>;
  clawOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isClawSigned, setIsClawSigned] = useState(!!sessionStorage.getItem('cc_api_token'));
  const [shellKey, setShellKey] = useState<CryptoKey | null>(null);

  const pinchAccessToken = async (fileContent: string) => {
    const { shellKey } = await authService.login(fileContent);
    setShellKey(shellKey);
    setIsClawSigned(true);
  };

  const pinchWithKey = async (token: string, uuid?: string, username?: string) => {
    const { shellKey } = await authService.loginWithKey(token, uuid, username);
    setShellKey(shellKey);
    setIsClawSigned(true);
  };

  const clawOut = () => {
    authService.logout();
    setShellKey(null);
    setIsClawSigned(false);
  };

  return (
    <AuthContext.Provider value={{ isClawSigned, shellKey, pinchAccessToken, pinchWithKey, clawOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
