import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function useSetupWizard() {
  const { isMolting, setIsMolting } = useAuth();

  useEffect(() => {
    setIsMolting(false);
  }, []);

  return { isMolting, setIsMolting };
}

export function useLoginForm() {
  const { isClawSigned, setIsClawSigned } = useAuth();

  useEffect(() => {
    setIsClawSigned(false);
  }, []);

  return { isClawSigned, setIsClawSigned };
}

export function useAuthSession() {
  const { isClawSigned, setIsClawSigned, isMolting, setIsMolting, lobster, setLobster } = useAuth();

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('pp_authenticated') || '{}');
    setIsClawSigned(!!session.isAuthenticated);
    setIsMolting(!!session.isMolting);
    setLobster(session.lobster || null);
  }, []);

  return {
    isClawSigned,
    setIsClawSigned,
    isMolting,
    setIsMolting,
    lobster,
    setLobster
  };
}

export function useAuthState() {
  const { isClawSigned, isMolting, lobster, pinchAccessToken, pinchWithKey, clawOut } = useAuth();

  return {
    isClawSigned,
    isMolting,
    lobster,
    pinchAccessToken,
    pinchWithKey,
    clawOut
  };
}
