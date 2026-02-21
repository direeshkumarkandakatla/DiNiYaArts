import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Priority order for default active role
const ROLE_PRIORITY = ['Administrator', 'Instructor', 'Parent', 'Student'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  // When user changes, set default active role
  useEffect(() => {
    if (user?.roles?.length) {
      const defaultRole = ROLE_PRIORITY.find((r) => user.roles.includes(r)) || user.roles[0];
      setActiveRole(defaultRole);
    } else {
      setActiveRole(null);
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const { userId, email, firstName, lastName, roles } = response.data;
      setUser({ userId, email, firstName, lastName, roles });
    } catch (err) {
      console.error('Failed to load user:', err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { token, userId, firstName, lastName, roles } = response.data;

      localStorage.setItem('token', token);
      setUser({ userId, email, firstName, lastName, roles });

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (formData) => {
    try {
      setError(null);
      const response = await authAPI.register(formData);
      const { token, userId, firstName, lastName, roles } = response.data;

      localStorage.setItem('token', token);
      setUser({ userId, email: formData.email, firstName, lastName, roles });

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.description || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveRole(null);
  };

  const switchRole = (role) => {
    if (user?.roles?.includes(role)) {
      setActiveRole(role);
    }
  };

  // Helper: is the active role an admin/instructor context?
  const isAdminContext = activeRole === 'Administrator' || activeRole === 'Instructor';

  const value = {
    user,
    activeRole,
    switchRole,
    isAdminContext,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
