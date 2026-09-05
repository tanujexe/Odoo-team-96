import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginFeature from '../../features/auth';
import { AuthProvider } from '../../app/auth/AuthContext';
import * as authApi from '../../lib/api/auth';

vi.mock('../../lib/api/auth', () => ({
  loginApi: vi.fn(),
  fetchMeApi: vi.fn(),
}));

describe('Login Experience', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders login form with title and role seed selectors', () => {
    render(
      <MemoryRouter>
        <AuthProvider initialUser={null} initialToken={null}>
          <LoginFeature />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('PeoplePay360')).toBeInTheDocument();
    expect(screen.getByLabelText(/Corporate Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Workspace/i })).toBeInTheDocument();
    expect(screen.getByText('Payroll Manager')).toBeInTheDocument();
  });

  it('displays error alert on invalid credentials', async () => {
    authApi.loginApi.mockRejectedValueOnce({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });

    render(
      <MemoryRouter>
        <AuthProvider initialUser={null} initialToken={null}>
          <LoginFeature />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Sign In to Workspace/i }));

    await waitFor(() => {
      expect(screen.getByTestId('login-error-alert')).toBeInTheDocument();
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('populates fields when selecting a role button', () => {
    render(
      <MemoryRouter>
        <AuthProvider initialUser={null} initialToken={null}>
          <LoginFeature />
        </AuthProvider>
      </MemoryRouter>
    );

    const employeeBtn = screen.getByText('Employee');
    fireEvent.click(employeeBtn);

    expect(screen.getByLabelText(/Corporate Email/i)).toHaveValue('employee@peoplepay.com');
  });
});
