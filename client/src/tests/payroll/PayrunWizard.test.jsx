import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PayrunWizard } from '../../components/PayrunWizard';

const structures = [{ id: 'str-1', name: 'Tech Structure', code: 'TECH' }];

describe('Payrun Creation Wizard (BR-07 / BR-08)', () => {
  it('navigates from step 1 to step 2 upon selecting valid dates', () => {
    render(<PayrunWizard salaryStructures={structures} onComplete={vi.fn()} />);

    expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: /Proceed to Employee Selection/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Step 2 of 2/i)).toBeInTheDocument();
  });

  it('blocks submission when zero employees are selected in step 2', () => {
    render(<PayrunWizard salaryStructures={structures} onComplete={vi.fn()} />);

    // Go to step 2
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Employee Selection/i }));

    // Uncheck both selected employees
    const alexCheck = screen.getByLabelText(/Select Alex Rivera/i);
    const sarahCheck = screen.getByLabelText(/Select Sarah Connor/i);
    fireEvent.click(alexCheck);
    fireEvent.click(sarahCheck);

    // Try submit
    const submitBtn = screen.getByRole('button', { name: /Create Draft Payrun Batch/i });
    fireEvent.click(submitBtn);

    expect(screen.getByTestId('wizard-error-banner')).toBeInTheDocument();
    expect(screen.getByText(/You must explicitly select at least 1 employee/i)).toBeInTheDocument();
  });
});
