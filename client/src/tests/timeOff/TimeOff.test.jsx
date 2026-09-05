import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TimeOffFeature from '../../features/time-off';
import { AuthProvider, ROLES } from '../../app/auth/AuthContext';

describe('Time-Off & Leave Workflow', () => {
  it('renders leave balances and request list', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'Alex Rivera', role: ROLES.EMPLOYEE, employeeId: 'emp-alex-1' }}>
          <MemoryRouter>
            <TimeOffFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Time Off & Leave Management/i)).toBeInTheDocument();
    expect(screen.getByTestId('pto-available-balance')).toBeInTheDocument();
    expect(screen.getByTestId('sick-available-balance')).toBeInTheDocument();
    // Alex's request
    expect(await screen.findByText(/Alex Rivera/i)).toBeInTheDocument();
  });

  it('renders approve/refuse actions for HR_PAYROLL_MANAGER role and updates status on click', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'Sarah Connor', role: ROLES.HR_PAYROLL_MANAGER, employeeId: 'emp-sarah-1' }}>
          <MemoryRouter>
            <TimeOffFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    const approveButton = await screen.findByRole('button', { name: /^Approve$/i });
    expect(approveButton).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Refuse$/i })).toBeInTheDocument();

    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Approve$/i })).not.toBeInTheDocument();
    });
  });
});
