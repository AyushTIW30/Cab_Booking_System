import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('cabgo_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await getMe();
      setUser(res.data.user);
    } catch {
      localStorage.removeItem('cabgo_token');
      localStorage.removeItem('cabgo_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (token, userData) => {
    localStorage.setItem('cabgo_token', token);
    localStorage.setItem('cabgo_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cabgo_token');
    localStorage.removeItem('cabgo_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
