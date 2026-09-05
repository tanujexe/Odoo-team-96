import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PayrollFeature from '../../features/payroll';
import { AuthProvider, ROLES } from '../../app/auth/AuthContext';

describe('Salary Rules & Role Restrictions (BR-05 / BR-06)', () => {
  it('allows HR_PAYROLL_MANAGER to access Add Salary Rule button', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'Sarah Connor', role: ROLES.HR_PAYROLL_MANAGER }}>
          <MemoryRouter>
            <PayrollFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    // Switch to Salary Rules tab
    fireEvent.click(screen.getByRole('button', { name: /Salary Rules & Configuration/i }));

    expect(await screen.findByRole('button', { name: /Add Salary Rule/i })).toBeInTheDocument();
  });

  it('restricts HR_PAYROLL_USER from modifying salary rules', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'David Miller', role: ROLES.HR_PAYROLL_USER }}>
          <MemoryRouter>
            <PayrollFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    // Switch to Salary Rules tab
    fireEvent.click(screen.getByRole('button', { name: /Salary Rules & Configuration/i }));

    expect(screen.queryByRole('button', { name: /Add Salary Rule/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Read-Only \(Payroll User\)/i)).toBeInTheDocument();
  });
});
