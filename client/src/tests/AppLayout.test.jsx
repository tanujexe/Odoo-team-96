import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, ROLES } from '../app/auth/AuthContext';
import { AppLayout } from '../app/layout/AppLayout';

describe('AppLayout and Navigation Roles', () => {
  it('renders payroll links for HR_PAYROLL_MANAGER role', () => {
    render(
      <MemoryRouter>
        <AuthProvider initialUser={{ name: 'Sarah', role: ROLES.HR_PAYROLL_MANAGER }}>
          <AppLayout />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Payroll & Payslips')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
  });

  it('hides payroll and employee management from EMPLOYEE role', () => {
    render(
      <MemoryRouter>
        <AuthProvider initialUser={{ name: 'Alex', role: ROLES.EMPLOYEE }}>
          <AppLayout />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText('Payroll & Payslips')).not.toBeInTheDocument();
    expect(screen.queryByText('Employees')).not.toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Time Off')).toBeInTheDocument();
  });
});
