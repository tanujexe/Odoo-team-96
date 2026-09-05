import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ContractsFeature from '../../features/contracts';
import { ContractFormViewModal } from '../../features/contracts/ContractFormViewModal';
import { mockContracts } from '../../lib/api/mockData';
import * as contractsApi from '../../lib/api/contracts';

vi.spyOn(contractsApi, 'fetchContracts').mockResolvedValue(mockContracts);

describe('Contract Form View Popup Feature', () => {
  it('opens contract form view modal when clicking on a contract row in the registry', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ContractsFeature />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for the contracts table to load and find Jane HR Specialist row
    const janeElement = await screen.findByText(/Jane HR Specialist/i);
    expect(janeElement).toBeInTheDocument();

    // Click the Open Form button inside Jane HR Specialist's row
    const row = janeElement.closest('tr');
    const openFormBtn = row.querySelector('button');
    fireEvent.click(openFormBtn);

    // Verify the Form View popup appears with Image 1 UX & Image 2 Theme
    const formViewTexts = await screen.findAllByText(/Form view of one contract/i);
    expect(formViewTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('Jane HR Specialist')).toBeInTheDocument();
    expect(screen.getByText('People & Culture')).toBeInTheDocument();
    expect(screen.getByText('HR Specialist')).toBeInTheDocument();
    expect(screen.getAllByText('Salary Structure / Notes').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Useful note: for the problem statement, one employee should not have multiple Running contracts/i).length
    ).toBeGreaterThan(0);
  });

  it('renders standalone ContractFormViewModal with all required 2-column fields and notes', () => {
    const mockContract = {
      id: 'cnt-test-1',
      contractCode: 'CON/2026/0042',
      employeeName: 'Aarav Mehta',
      employeeCode: 'EMP-042',
      department: 'Finance',
      jobPosition: 'Payroll Specialist',
      wage: 85000,
      workingSchedule: '40 Hours / Week',
      startDate: '2026-01-01',
      endDate: null,
      status: 'ACTIVE',
      salaryStructureName: 'Employee Salary',
      notes: 'This running contract is the source for payroll calculation in the active period.',
    };

    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <ContractFormViewModal
        isOpen={true}
        onClose={handleClose}
        contract={mockContract}
        onSave={handleSave}
      />
    );

    // Check Header & Subtitle
    expect(screen.getByText('CON/2026/0042')).toBeInTheDocument();
    expect(screen.getByText(/Form view of one contract/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Running/i).length).toBeGreaterThan(0);

    // Check 2-Column Fields
    expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
    expect(screen.getByText('EMP-042')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Payroll Specialist')).toBeInTheDocument();
    expect(screen.getByText('40 Hours / Week')).toBeInTheDocument();

    // Check Salary Structure / Notes Box
    expect(screen.getByText('Salary Structure / Notes')).toBeInTheDocument();
    expect(screen.getByText('Employee Salary')).toBeInTheDocument();
    expect(screen.getByText(/This running contract is the source for payroll calculation/i)).toBeInTheDocument();

    // Check Bottom Helpful Note
    expect(screen.getByText(/Useful note: for the problem statement, one employee should not have multiple Running contracts/i)).toBeInTheDocument();

    // Toggle Edit Mode
    const editBtn = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
