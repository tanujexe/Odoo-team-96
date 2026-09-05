import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WarningPanel } from '../../components/WarningPanel';

describe('WarningPanel Component (BR-09 / BR-10)', () => {
  it('renders clean success banner when no warnings exist', () => {
    render(<WarningPanel warnings={[]} />);
    expect(screen.getByTestId('no-warnings-banner')).toBeInTheDocument();
    expect(screen.getByText(/Zero Integrity Warnings/i)).toBeInTheDocument();
  });

  it('renders blocking calculation warnings in prominent alert state', () => {
    const warnings = [
      {
        code: 'AMBIGUOUS_CONTRACT',
        severity: 'BLOCKING',
        message: 'Multiple active contracts overlap payroll period.',
      },
      {
        code: 'MISSING_ATTENDANCE',
        severity: 'WARNING',
        message: '1 uncorrected attendance record.',
      },
    ];

    render(<WarningPanel warnings={warnings} />);

    expect(screen.getByTestId('warning-panel')).toBeInTheDocument();
    expect(screen.getByText(/1 Blocking Calculation Warning/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Informational Warning/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiple active contracts overlap/i)).toBeInTheDocument();
  });
});
