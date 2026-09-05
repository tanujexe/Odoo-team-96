import React, { createContext, useContext, useState, useEffect } from 'react';

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
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_MANAGER: 'HR_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

const DEFAULT_USERS = {
  [ROLES.ADMIN]: {
    id: 'usr-admin-1',
    name: 'Eleanor Vance (Admin)',
    email: 'admin@peoplepay360.com',
    role: ROLES.ADMIN,
    employeeId: null,
  },
  [ROLES.HR_PAYROLL_MANAGER]: {
    id: 'usr-pm-1',
    name: 'Sarah Connor (HR Payroll Mgr)',
    email: 'sarah.payroll@peoplepay360.com',
    role: ROLES.HR_PAYROLL_MANAGER,
    employeeId: 'emp-sarah-1',
  },
  [ROLES.HR_PAYROLL_USER]: {
    id: 'usr-pu-1',
    name: 'David Miller (Payroll Specialist)',
    email: 'david.payroll@peoplepay360.com',
    role: ROLES.HR_PAYROLL_USER,
    employeeId: 'emp-david-1',
  },
  [ROLES.HR_MANAGER]: {
    id: 'usr-hm-1',
    name: 'Rachel Green (HR Manager)',
    email: 'rachel.hr@peoplepay360.com',
    role: ROLES.HR_MANAGER,
    employeeId: 'emp-rachel-1',
  },
  [ROLES.EMPLOYEE]: {
    id: 'usr-emp-1',
    name: 'Alex Rivera (Staff Engineer)',
    email: 'alex.rivera@peoplepay360.com',
    role: ROLES.EMPLOYEE,
    employeeId: 'emp-alex-1',
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser }) {
  const [currentUser, setCurrentUser] = useState(() => {
    if (initialUser) return initialUser;
    const stored = localStorage.getItem('peoplepay_session');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse session from storage', e);
      }
    }
    // Default to HR_PAYROLL_MANAGER for rich testing
    return DEFAULT_USERS[ROLES.HR_PAYROLL_MANAGER];
  });

  const [token, setToken] = useState(() => localStorage.getItem('peoplepay_token') || 'mock-jwt-token');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('peoplepay_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('peoplepay_session');
    }
  }, [currentUser]);

  const login = (roleOrUser, newToken = 'mock-jwt-token') => {
    if (typeof roleOrUser === 'string' && DEFAULT_USERS[roleOrUser]) {
      setCurrentUser(DEFAULT_USERS[roleOrUser]);
    } else if (typeof roleOrUser === 'object') {
      setCurrentUser(roleOrUser);
    }
    setToken(newToken);
    localStorage.setItem('peoplepay_token', newToken);
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('peoplepay_session');
    localStorage.removeItem('peoplepay_token');
  };

  const switchRole = (role) => {
    if (DEFAULT_USERS[role]) {
      setCurrentUser(DEFAULT_USERS[role]);
    }
  };

  /**
   * Permission Helper checking role access
   */
  const hasAccess = (allowedRoles = []) => {
    if (!currentUser) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        role: currentUser?.role || null,
        token,
        isAuthenticated: !!currentUser,
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
