import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PayrollFeature from '../../features/payroll';
import { AuthProvider, ROLES } from '../../app/auth/AuthContext';

describe('Document Delivery & Payslip Actions', () => {
  it('renders download PDF buttons and allows viewing payslip lines', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={{ name: 'Sarah Connor', role: ROLES.HR_PAYROLL_MANAGER }}>
          <MemoryRouter>
            <PayrollFeature />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument();
    const pdfButtons = screen.getAllByTitle(/Download Payslip PDF/i);
    expect(pdfButtons.length).toBeGreaterThan(0);

    const linesButtons = screen.getAllByRole('button', { name: /^Lines$/i });
    fireEvent.click(linesButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Payslip Breakdown: Alex Rivera/i)).toBeInTheDocument();
      expect(screen.getByText(/Basic Wage/i)).toBeInTheDocument();
      expect(screen.getByText(/Final Net Disbursement:/i)).toBeInTheDocument();
    });
  });
});
