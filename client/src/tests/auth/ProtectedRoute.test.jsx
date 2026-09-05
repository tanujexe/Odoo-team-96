import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../app/auth/ProtectedRoute';
import { AuthProvider, ROLES } from '../../app/auth/AuthContext';

describe('ProtectedRoute Guard', () => {
  it('redirects unauthenticated users to /login', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider initialUser={null} initialToken={null}>
          <Routes>
            <Route path="/login" element={<div>Login Screen</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated with authorized role', () => {
    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <AuthProvider
          initialUser={{ id: '1', role: ROLES.HR_PAYROLL_MANAGER, name: 'Sarah' }}
          initialToken="token-123"
        >
          <Routes>
            <Route
              path="/payroll"
              element={
                <ProtectedRoute allowedRoles={[ROLES.HR_PAYROLL_MANAGER]}>
                  <div>Payroll Engine Ready</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Payroll Engine Ready')).toBeInTheDocument();
  });

  it('displays access restricted when user role is not permitted', () => {
    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <AuthProvider
          initialUser={{ id: '2', role: ROLES.EMPLOYEE, name: 'Alex' }}
          initialToken="token-456"
        >
          <Routes>
            <Route
              path="/payroll"
              element={
                <ProtectedRoute allowedRoles={[ROLES.HR_PAYROLL_MANAGER, ROLES.ADMIN]}>
                  <div>Payroll Engine Ready</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('unauthorized-state')).toBeInTheDocument();
    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(screen.queryByText('Payroll Engine Ready')).not.toBeInTheDocument();
  });
});
