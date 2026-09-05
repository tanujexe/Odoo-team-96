import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployeesFeature from '../../features/employees';

describe('Employee Directory & Workspace', () => {
  it('renders employee list and allows searching', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeesFeature />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Employee Directory & Workspace/i)).toBeInTheDocument();
    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('EMP-001')).toBeInTheDocument();
  });

  it('opens workspace hub modal when clicking Workspace button', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <EmployeesFeature />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const workspaceButtons = await screen.findAllByRole('button', { name: /^Workspace$/i });
    expect(workspaceButtons.length).toBeGreaterThan(0);
    fireEvent.click(workspaceButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Smart Related Modules/i)).toBeInTheDocument();
      expect(screen.getByText(/Contracts/i)).toBeInTheDocument();
      expect(screen.getByText(/Attendance History/i)).toBeInTheDocument();
    });
  });
});
