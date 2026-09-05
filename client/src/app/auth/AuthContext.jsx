import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, fetchMeApi } from '../../lib/api/auth';

/**
 * Supported roles from PRD & Technical Spec:
 * 1. ADMIN
 * 2. HR_PAYROLL_MANAGER
 * 3. HR_PAYROLL_USER
 * 4. HR_MANAGER
 * 5. EMPLOYEE
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_MANAGER: 'HR_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export const DEFAULT_USERS = {
  [ROLES.ADMIN]: {
    id: 'usr-admin-1',
    name: 'System Admin',
    email: 'admin@peoplepay.com',
    role: ROLES.ADMIN,
    employeeId: null,
  },
  [ROLES.HR_PAYROLL_MANAGER]: {
    id: 'usr-pm-1',
    name: 'Charlie Payroll Manager',
    email: 'payrollmanager@peoplepay.com',
    role: ROLES.HR_PAYROLL_MANAGER,
    employeeId: 'emp-charlie-1',
  },
  [ROLES.HR_PAYROLL_USER]: {
    id: 'usr-pu-1',
    name: 'Payroll User Account',
    email: 'payrolluser@peoplepay.com',
    role: ROLES.HR_PAYROLL_USER,
    employeeId: 'emp-charlie-1',
  },
  [ROLES.HR_MANAGER]: {
    id: 'usr-hm-1',
    name: 'Jane HR Specialist',
    email: 'hrmanager@peoplepay.com',
    role: ROLES.HR_MANAGER,
    employeeId: 'emp-jane-1',
  },
  [ROLES.EMPLOYEE]: {
    id: 'usr-emp-1',
    name: 'John Developer',
    email: 'employee@peoplepay.com',
    role: ROLES.EMPLOYEE,
    employeeId: 'emp-john-1',
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser, initialToken }) {
  const [currentUser, setCurrentUser] = useState(() => {
    if (initialUser !== undefined) return initialUser;
    const stored = localStorage.getItem('peoplepay_session');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse session from storage', e);
      }
    }
    return DEFAULT_USERS[ROLES.HR_PAYROLL_MANAGER];
  });

  const [token, setToken] = useState(() => {
    if (initialToken !== undefined) return initialToken;
    return localStorage.getItem('peoplepay_token') || 'mock-jwt-token';
  });

  const [isLoading, setIsLoading] = useState(false);

  // Synchronize storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('peoplepay_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('peoplepay_session');
    }
  }, [currentUser]);

  // Listen for unauthorized events dispatched by API client
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('peoplepay:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('peoplepay:unauthorized', handleUnauthorized);
  }, []);

  /**
   * Attempt live API login with fallback to mock accounts if server is unreachable
   */
  const login = async ({ email, password, role }) => {
    setIsLoading(true);
    try {
      // 1. Try real server API
      const result = await loginApi({ email, password });
      if (result?.user && result?.token) {
        setCurrentUser(result.user);
        setToken(result.token);
        localStorage.setItem('peoplepay_token', result.token);
        return { success: true, user: result.user };
      }
    } catch (err) {
      // If server returned a 401/400 validation or credentials error, rethrow
      if (err.code === 'INVALID_CREDENTIALS' || err.code === 'ACCOUNT_INACTIVE' || err.code === 'VALIDATION_ERROR') {
        throw err;
      }

      // If server is not running (network error), fallback to seed user if provided
      console.warn('[Auth] Server unavailable, falling back to local demo profile');
      const matchedRole = role || Object.keys(DEFAULT_USERS).find((r) => DEFAULT_USERS[r].email.toLowerCase() === email.toLowerCase()) || ROLES.HR_PAYROLL_MANAGER;
      const fallbackUser = DEFAULT_USERS[matchedRole];
      const mockToken = `mock-token-${fallbackUser.role.toLowerCase()}`;
      
      setCurrentUser(fallbackUser);
      setToken(mockToken);
      localStorage.setItem('peoplepay_token', mockToken);
      return { success: true, user: fallbackUser, isMock: true };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('peoplepay_session');
    localStorage.removeItem('peoplepay_token');
  };

  const switchRole = async (roleKey) => {
    const defaultUser = DEFAULT_USERS[roleKey];
    if (!defaultUser) return;

    try {
      const result = await loginApi({ email: defaultUser.email, password: 'Password123!' });
      if (result?.user && result?.token) {
        setCurrentUser(result.user);
        setToken(result.token);
        localStorage.setItem('peoplepay_token', result.token);
        return;
      }
    } catch (err) {
      console.warn(`[Auth] Real login failed for ${roleKey}, using local fallback:`, err);
    }

    const mockToken = `mock-token-${defaultUser.role.toLowerCase()}`;
    setCurrentUser(defaultUser);
    setToken(mockToken);
    localStorage.setItem('peoplepay_token', mockToken);
  };

  /**
   * Permission Helper checking role access (ADMIN and SUPER_ADMIN have universal access)
   */
  const hasAccess = (allowedRoles = []) => {
    if (!currentUser) return false;
    if (allowedRoles.length === 0) return true;
    if (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.SUPER_ADMIN) return true;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        role: currentUser?.role || null,
        token,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        switchRole,
        hasAccess,
        availableRoles: Object.values(ROLES),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
