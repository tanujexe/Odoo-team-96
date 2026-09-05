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
