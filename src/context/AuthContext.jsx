
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

const AuthContext = createContext({});

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  SALON_MANAGER: 'salon_manager',
  STYLIST: 'stylist'
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        updateUserState(session?.user);
      } catch (err) {
        console.error("Unexpected error checking session:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserState(session?.user);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const updateUserState = (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }
    // Enhance user object with role from metadata
    const enhancedUser = {
      ...sessionUser,
      role: sessionUser.user_metadata?.role || sessionUser.app_metadata?.role || 'user'
    };
    setUser(enhancedUser);
  };

  const signUp = async (email, password, options = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      toast.error(error.message || "Signup failed");
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Login error details:", error);
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      toast.error(error.message || "Google login failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: manually clear local storage if API call fails
      localStorage.removeItem('sb-ymvqrqtbyxiclewnwhjk-auth-token');
      toast.success("Logged out locally");
    }
  };

  const resetPassword = async (email) => {
    try {
      console.log("Attempting to send password reset email to:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      console.log("Password reset email sent successfully (API returned success)");
      toast.success("Password reset link sent!");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to send reset link");
      throw error;
    }
  };

  const hasRole = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!user) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
