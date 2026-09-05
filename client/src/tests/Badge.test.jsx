import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../components/ui/Badge';

describe('Badge UI Component', () => {
  it('renders status text correctly', () => {
    render(<Badge status="COMPUTED" />);
    expect(screen.getByText('COMPUTED')).toBeInTheDocument();
  });

  it('applies appropriate color classes for status states', () => {
    const { rerender } = render(<Badge status="PAID" />);
    const paidBadge = screen.getByTestId('status-badge');
    expect(paidBadge).toHaveClass('text-emerald-700');

    rerender(<Badge status="BLOCKING" />);
    const blockingBadge = screen.getByTestId('status-badge');
    expect(blockingBadge).toHaveClass('text-rose-800');
  });
});
