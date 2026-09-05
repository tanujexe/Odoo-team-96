import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ContractsFeature from '../../features/contracts';

describe('Contracts & Period Resolver Feature', () => {
  it('renders contracts tab and displays contract records', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ContractsFeature />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Employment Contracts & Working Schedules/i)).toBeInTheDocument();
    expect(await screen.findByText('CNT-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
  });

  it('renders resolver diagnostic warnings when ambiguous contract is tested', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ContractsFeature />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Switch to resolver tab
    fireEvent.click(screen.getByRole('button', { name: /Period Contract Resolver/i }));

    // Select the ambiguous test employee
    const select = screen.getByLabelText(/Employee/i);
    fireEvent.change(select, { target: { value: 'emp-ambiguous-1' } });

    // Click resolve
    fireEvent.click(screen.getByRole('button', { name: /Resolve Applicable Contract/i }));

    await waitFor(() => {
      expect(screen.getByTestId('resolver-warning-banner')).toBeInTheDocument();
      expect(screen.getByText(/Blocking Resolver Warning: AMBIGUOUS_CONTRACT/i)).toBeInTheDocument();
    });
  });
});
