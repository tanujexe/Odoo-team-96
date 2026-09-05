import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminFeature from '../../features/admin';
import * as usersApi from '../../lib/api/users';
import * as empApi from '../../lib/api/employees';

vi.mock('../../lib/api/users', () => ({
  fetchUsersApi: vi.fn(),
  createUserApi: vi.fn(),
  updateUserApi: vi.fn(),
}));

vi.mock('../../lib/api/employees', () => ({
  fetchEmployees: vi.fn(),
}));

vi.mock('../../lib/api/contracts', () => ({
  fetchContracts: vi.fn().mockResolvedValue([]),
}));

describe('Admin User Account & Employee ID Provisioning', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();

    usersApi.fetchUsersApi.mockResolvedValue([
      {
        id: 'u1',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'ADMIN',
        employeeCode: 'EMP-001',
        employeeName: 'Admin User',
        status: 'ACTIVE',
      },
    ]);

    empApi.fetchEmployees.mockResolvedValue([
      { id: 'e1', employeeCode: 'EMP-001', name: 'Admin User' },
      { id: 'e2', employeeCode: 'EMP-004', name: 'Marcus Vance' },
    ]);
  });

  it('renders user directory with employee code status', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminFeature />
      </QueryClientProvider>
    );

    expect(screen.getByText('System Administration & RBAC Governance')).toBeInTheDocument();
    const userNames = await screen.findAllByText('Admin User');
    expect(userNames.length).toBeGreaterThan(0);
    expect(screen.getByText('EMP-001')).toBeInTheDocument();
  });

  it('opens modal with auto-suggested Employee ID and Contract Code', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminFeature />
      </QueryClientProvider>
    );

    await screen.findAllByText('Admin User');
    const createBtn = screen.getByRole('button', { name: /Create User Account/i });
    fireEvent.click(createBtn);

    expect(screen.getByText(/Admin: Create User Account & Employment Contract/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. EMP-005')).toHaveValue('EMP-005');
  });

  it('submits new user with new Employee ID and contract setup', async () => {
    usersApi.createUserApi.mockResolvedValueOnce({
      id: 'u2',
      name: 'New Dev',
      email: 'newdev@company.com',
      role: 'EMPLOYEE',
      employeeCode: 'EMP-005',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminFeature />
      </QueryClientProvider>
    );

    await screen.findAllByText('Admin User');
    fireEvent.click(screen.getByRole('button', { name: /Create User Account/i }));

    fireEvent.change(screen.getByPlaceholderText(/Marcus Vance/i), { target: { value: 'New Dev' } });
    fireEvent.change(screen.getByPlaceholderText(/marcus@company.com/i), { target: { value: 'newdev@company.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), { target: { value: 'password123' } });

    const submitBtn = screen.getByRole('button', { name: /Create User & Contract Account/i });
    fireEvent.click(submitBtn);
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      console.log('MOCK CALLS:', usersApi.createUserApi.mock.calls);
      expect(usersApi.createUserApi).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Dev',
          email: 'newdev@company.com',
          employeeCode: 'EMP-005',
        })
      );
    });
  });
});
