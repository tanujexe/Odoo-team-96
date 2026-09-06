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

  it('successfully opens modal, inputs salary rule details, and saves new rule', async () => {
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

    const addBtn = await screen.findByRole('button', { name: /Add Salary Rule/i });
    fireEvent.click(addBtn);

    // Modal is open
    expect(screen.getByText('Configure formula, fixed, or percentage salary components')).toBeInTheDocument();

    // Fill in rule details
    const codeInput = screen.getByLabelText(/Rule Code/i);
    const nameInput = screen.getByLabelText(/Rule Name/i);
    const amountInput = screen.getByLabelText(/Fixed Amount/i);

    fireEvent.change(codeInput, { target: { value: 'COMM' } });
    fireEvent.change(nameInput, { target: { value: 'Sales Commission' } });
    fireEvent.change(amountInput, { target: { value: '750' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /Save Salary Rule/i });
    fireEvent.click(saveBtn);

    // Verify modal closes and new rule appears in the table
    await waitFor(() => {
      expect(screen.getByText('Sales Commission')).toBeInTheDocument();
      expect(screen.getByText('[COMM]')).toBeInTheDocument();
    });
  });
});

