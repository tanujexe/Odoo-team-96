import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Test explosion');
};

describe('ErrorBoundary Component', () => {
  it('catches render errors and displays friendly fallback UI', () => {
    // Suppress console.error in tests
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Test explosion/i)).toBeInTheDocument();

    spy.mockRestore();
  });
});
