import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await authService.getMe();
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.data.success) {
      if (res.data.token) {
        try {
          localStorage.setItem('freetalk_token', res.data.token);
        } catch (e) {}
      }
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    if (res.data.success) {
      if (res.data.token) {
        try {
          localStorage.setItem('freetalk_token', res.data.token);
        } catch (e) {}
      }
      setUser(res.data.user);
    }
    return res.data;
  };


  const sendOtp = async (data) => {
    const res = await authService.sendOtp(data);
    if (res.data.success && !res.data.otpRequired && res.data.user) {
      if (res.data.token) {
        try {
          localStorage.setItem('freetalk_token', res.data.token);
        } catch (e) {}
      }
      setUser(res.data.user);
    }
    return res.data;
  };

  const verifyOtp = async (data) => {
    const res = await authService.verifyOtp(data);
    if (res.data.success && res.data.user) {
      if (res.data.token) {
        try {
          localStorage.setItem('freetalk_token', res.data.token);
        } catch (e) {}
      }
      setUser(res.data.user);
    }
    return res.data;
  };


  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      try {
        localStorage.removeItem('freetalk_token');
      } catch (e) {}
      setUser(null);
    }
  };

  const regenerateIdentity = async () => {
    const res = await authService.regenerateIdentity();
    if (res.data.success) {
      setUser(prev => ({
        ...prev,
        activeIdentity: res.data.identity
      }));
    }
    return res.data;
  };

  const updateSettings = async (settings) => {
    const res = await authService.updateSettings(settings);
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const value = {
    user,
    activeIdentity: user?.activeIdentity || null,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'ADMIN',
    isStaff: ['ADMIN', 'MODERATOR'].includes(user?.role),
    loading,
    login,
    register,
    sendOtp,
    verifyOtp,
    logout,
    regenerateIdentity,
    updateSettings,
    refreshUser: fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
