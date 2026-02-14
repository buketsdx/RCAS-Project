
import React, { createContext, useContext, useEffect, useState } from 'react';
import { rcas } from '@/api/rcasClient';
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
        const { data: { session }, error } = await rcas.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        updateUserState(session?.user);
      } catch (err) {
        if (err?.name === 'AbortError' || String(err).includes('AbortError')) {
          // Ignore aborted fetches (navigation or unmount scenarios)
        } else {
          console.error("Unexpected error checking session:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes
    // rcas.auth.onAuthStateChange returns the subscription object directly or wrapped
    const subscription = rcas.auth.onAuthStateChange((_event, session) => {
      updateUserState(session?.user);
      setLoading(false);
    });

    return () => {
      if (subscription && subscription.data && subscription.data.subscription) {
          subscription.data.subscription.unsubscribe();
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
      }
    };
  }, []);

  const updateUserState = (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      return;
    }
    // Enhance user object with role from metadata or Env Admin
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    let role = sessionUser.user_metadata?.role || sessionUser.app_metadata?.role || sessionUser.role || 'user';
    
    // Super Admin Override
    if (sessionUser.email === adminEmail || localStorage.getItem('rcas_super_admin') === 'true') {
      role = ROLES.SUPER_ADMIN;
    }

    const enhancedUser = {
      ...sessionUser,
      role: role
    };
    setUser(enhancedUser);
  };

  const signUp = async (email, password, options = {}) => {
    try {
      const full_name = options?.data?.full_name;
      const user = await rcas.auth.register({
        email,
        password,
        full_name
      });
      return { user };
    } catch (error) {
      toast.error(error.message || "Signup failed");
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const user = await rcas.auth.login(email, password);
      return { user };
    } catch (error) {
      console.error("Login error details:", error);
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await rcas.auth.loginWithGoogle({});
    } catch (error) {
      toast.error(error.message || "Google login failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await rcas.auth.logout();
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
      const result = await rcas.auth.requestPasswordReset(email);
      // Adapter might return { error } or throw
      if (result && result.error) throw result.error;
      
      console.log("Password reset email sent successfully");
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
