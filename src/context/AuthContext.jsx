import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OWNER: 'Owner',
  CASHIER: 'Cashier',
  EMPLOYEE: 'Employee'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted session
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('rcas_user_session');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Auth check failed", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const userData = await base44.auth.login(username, password);
      setUser(userData);
      localStorage.setItem('rcas_user_session', JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.full_name}!`);
      return userData;
    } catch (error) {
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const logout = () => {
    base44.auth.logout();
    setUser(null);
    localStorage.removeItem('rcas_user_session');
    toast.info("Logged out successfully");
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true; // Super Admin has access to everything
    
    if (!roles) return true; // No specific roles required
    if (!Array.isArray(roles)) return user.role === roles;
    
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
