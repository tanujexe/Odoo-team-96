import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AttendanceFeature from '../../features/attendance';
import { AuthProvider, ROLES } from '../../app/auth/AuthContext';

describe('Attendance Workflow & Terminal', () => {
  it('renders check-in/out terminal and shows check-out button when employee is checked in', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'Alex Rivera', role: ROLES.EMPLOYEE, employeeId: 'emp-alex-1' }}>
          <MemoryRouter>
            <AttendanceFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Self-Service Terminal/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^Check Out$/i })).toBeInTheDocument();
  });

  it('renders manager correction buttons for HR_MANAGER role', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'Rachel Green', role: ROLES.HR_MANAGER, employeeId: 'emp-rachel-1' }}>
          <MemoryRouter>
            <AttendanceFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    const correctButtons = await screen.findAllByRole('button', { name: /Correct/i });
    expect(correctButtons.length).toBeGreaterThan(0);
  });
});
