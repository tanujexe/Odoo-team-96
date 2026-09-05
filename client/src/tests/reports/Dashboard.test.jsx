import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardFeature from '../../features/reports/Dashboard';
import { AuthProvider, ROLES } from '../../app/auth/AuthContext';

describe('Executive Dashboard & Live Filters (BR-11)', () => {
  it('renders aggregated executive KPIs and alerts', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'Sarah Connor', role: ROLES.HR_PAYROLL_MANAGER }}>
          <MemoryRouter>
            <DashboardFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Executive Operations Dashboard/i)).toBeInTheDocument();
    expect(await screen.findByTestId('kpi-total-net')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-payslips-count')).toBeInTheDocument();
    expect(screen.getByText(/Payroll Distribution by Department/i)).toBeInTheDocument();
  });

  it('updates KPIs dynamically when department filter changes', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'Sarah Connor', role: ROLES.HR_PAYROLL_MANAGER }}>
          <MemoryRouter>
            <DashboardFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    const deptSelect = screen.getByLabelText(/Department filter/i);
    fireEvent.change(deptSelect, { target: { value: 'dept-eng' } });

    await waitFor(() => {
      expect(screen.getByTestId('kpi-total-net')).toHaveTextContent('$7,955.00');
    });
  });
});

describe('Employee Self-Service Dashboard (BR-12)', () => {
  it('renders employee profile details, attendance records, and leave balances on employee login', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider
          initialUser={{
            id: 'usr-emp-1',
            name: 'John Developer',
            email: 'employee@peoplepay.com',
            role: ROLES.EMPLOYEE,
            employeeId: 'emp-john-1',
          }}
        >
          <MemoryRouter>
            <DashboardFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    // 1. Employee profile details
    expect(await screen.findByText(/Welcome back, John!/i)).toBeInTheDocument();
    expect(screen.getByText(/Employment & Contract Details/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Senior Full Stack Engineer/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Standard Full-Time \(40h\)/i)).toBeInTheDocument();

    // 2. Attendance terminal & records
    expect(screen.getByText(/Attendance Terminal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Out/i })).toBeInTheDocument();
    expect(screen.getByText(/Recent Attendance History/i)).toBeInTheDocument();

    // 3. Leave balances & requests
    expect(screen.getByText(/Time Off & Leave Balances/i)).toBeInTheDocument();
    expect(screen.getByTestId('emp-pto-available')).toBeInTheDocument();
    expect(screen.getByTestId('emp-sick-available')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request Time Off/i })).toBeInTheDocument();
  });
});
