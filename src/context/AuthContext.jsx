import React, { createContext, useContext, useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
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
      const userData = await rcas.auth.login(username, password);
      setUser(userData);
      localStorage.setItem('rcas_user_session', JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.full_name}!`);
      return userData;
    } catch (error) {
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const loginWithGoogle = async (googleData) => {
    try {
      const userData = await rcas.auth.loginWithGoogle(googleData);
      setUser(userData);
      localStorage.setItem('rcas_user_session', JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.full_name}!`);
      return userData;
    } catch (error) {
      toast.error(error.message || "Google Login failed");
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const newUser = await rcas.auth.register(userData);
      setUser(newUser);
      localStorage.setItem('rcas_user_session', JSON.stringify(newUser));
      toast.success(`Welcome, ${newUser.full_name}!`);
      return newUser;
    } catch (error) {
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  const logout = () => {
    rcas.auth.logout();
    setUser(null);
    localStorage.removeItem('rcas_user_session');
    toast.info("Logged out successfully");
  };

  // --- Password Recovery ---
  // Requests an OTP to be sent to the user's email
  const requestPasswordReset = async (email) => {
    try {
      const result = await rcas.auth.requestPasswordReset(email);
      if (result.success) {
        toast.success(result.message);
        // For development convenience, show OTP in toast too
        if (result.dev_otp) toast.info(`DEV: OTP is ${result.dev_otp}`);
      } else {
        toast.info(result.message);
      }
      return result;
    } catch (error) {
      toast.error("Failed to request reset");
      throw error;
    }
  };

  // Resets the password using the OTP
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const result = await rcas.auth.resetPassword(email, otp, newPassword);
      toast.success(result.message);
      return result;
    } catch (error) {
      toast.error(error.message || "Failed to reset password");
      throw error;
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true; // Super Admin has access to everything
    
    if (!roles) return true; // No specific roles required
    if (!Array.isArray(roles)) return user.role === roles;
    
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      login, 
      loginWithGoogle, 
      register, 
      logout, 
      requestPasswordReset, 
      resetPassword,
      hasRole 
    }}>
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
