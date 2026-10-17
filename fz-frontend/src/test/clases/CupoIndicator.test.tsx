/**
 * CupoIndicator.test.tsx — Unit tests for the CupoIndicator component (RF-06).
 * Validates rendering, percentage calculation, and color variation.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CupoIndicator } from '../../components/clases/CupoIndicator';

describe('CupoIndicator Component', () => {
  it('renders cupo disponible / cupo maximo text using data-testid', () => {
    render(<CupoIndicator cupoDisponible={12} cupoMaximo={20} />);
    const textEl = screen.getByTestId('cupo-indicator-text');
    expect(textEl).toBeInTheDocument();
    expect(textEl).toHaveTextContent('12 / 20');
  });

  it('renders with all spots available (0% occupied)', () => {
    render(<CupoIndicator cupoDisponible={20} cupoMaximo={20} />);
    expect(screen.getByTestId('cupo-indicator-text')).toHaveTextContent('20 / 20');
    const bar = screen.getByTestId('cupo-indicator-bar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveAttribute('data-bar-color', 'green');
    expect(bar).toHaveStyle({ width: '0%' });
  });

  it('applies green color when occupation is below 50%', () => {
    render(<CupoIndicator cupoDisponible={15} cupoMaximo={20} />);
    // 5 occupied out of 20 = 25% → green
    const bar = screen.getByTestId('cupo-indicator-bar');
    expect(bar).toHaveAttribute('data-bar-color', 'green');
  });

  it('applies red color when occupation is 50% or above', () => {
    render(<CupoIndicator cupoDisponible={5} cupoMaximo={20} />);
    // 15 occupied out of 20 = 75% → red
    const bar = screen.getByTestId('cupo-indicator-bar');
    expect(bar).toHaveAttribute('data-bar-color', 'red');
  });

  it('applies red color when fully occupied (100%)', () => {
    render(<CupoIndicator cupoDisponible={0} cupoMaximo={20} />);
    expect(screen.getByTestId('cupo-indicator-text')).toHaveTextContent('0 / 20');
    const bar = screen.getByTestId('cupo-indicator-bar');
    expect(bar).toHaveAttribute('data-bar-color', 'red');
    expect(bar).toHaveStyle({ width: '100%' });
  });

  it('bar width reflects exact occupation percentage', () => {
    render(<CupoIndicator cupoDisponible={10} cupoMaximo={20} />);
    // 10 occupied / 20 max = 50%
    const bar = screen.getByTestId('cupo-indicator-bar');
    expect(bar).toHaveStyle({ width: '50%' });
  });

  it('handles cupoMaximo <= 0 gracefully preventing division by zero (0% width, no NaN)', () => {
    render(<CupoIndicator cupoDisponible={0} cupoMaximo={0} />);
    expect(screen.getByTestId('cupo-indicator-text')).toHaveTextContent('0 / 0');
    const bar = screen.getByTestId('cupo-indicator-bar');
    expect(bar).toHaveStyle({ width: '0%' });
    expect(bar.style.width).not.toContain('NaN');
  });

  it('normalizes negative and null/undefined values safely', () => {
    render(<CupoIndicator cupoDisponible={-5 as any} cupoMaximo={undefined as any} />);
    expect(screen.getByTestId('cupo-indicator-text')).toHaveTextContent('0 / 0');
    const bar = screen.getByTestId('cupo-indicator-bar');
    expect(bar).toHaveStyle({ width: '0%' });
    expect(bar.style.width).not.toContain('NaN');
  });
});

