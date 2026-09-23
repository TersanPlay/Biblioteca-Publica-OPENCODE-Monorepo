import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReaderToken, setReaderToken } from '../../services/api-client';
import { readerPortalApi } from './portal-api';
import type { Reader } from '@library/shared';

interface ReaderSessionValue {
  reader: Reader | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Reader>;
  register: (v: Record<string, unknown>) => Promise<Reader>;
  claim: (cpf: string, email: string, password: string) => Promise<Reader>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const ReaderSessionContext = createContext<ReaderSessionValue | null>(null);

export function useReaderSession() {
  const ctx = useContext(ReaderSessionContext);
  if (!ctx) throw new Error('useReaderSession deve ser usado dentro de ReaderSessionProvider');
  return ctx;
}

export function ReaderSessionProvider({ children }: { children: React.ReactNode }) {
  const [reader, setReader] = useState<Reader | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    const data = await readerPortalApi.me();
    setReader(data);
  }, []);

  useEffect(() => {
    if (!getReaderToken()) {
      setLoading(false);
      return;
    }
    readerPortalApi
      .me()
      .then(setReader)
      .catch(() => setReaderToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => {
      setReader(null);
      navigate('/login');
    };
    window.addEventListener('reader:unauthorized', handler);
    return () => window.removeEventListener('reader:unauthorized', handler);
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await readerPortalApi.login(email, password);
    setReaderToken(res.token);
    setReader(res.reader);
    return res.reader;
  }, []);

  const register = useCallback(async (v: Record<string, unknown>) => {
    const res = await readerPortalApi.register(v);
    setReaderToken(res.token);
    setReader(res.reader);
    return res.reader;
  }, []);

  const claim = useCallback(async (cpf: string, email: string, password: string) => {
    const res = await readerPortalApi.claim(cpf, email, password);
    setReaderToken(res.token);
    setReader(res.reader);
    return res.reader;
  }, []);

  const logout = useCallback(() => {
    setReaderToken(null);
    setReader(null);
    navigate('/');
  }, [navigate]);

  return (
    <ReaderSessionContext.Provider value={{ reader, loading, login, register, claim, logout, refresh }}>
      {children}
    </ReaderSessionContext.Provider>
  );
}
