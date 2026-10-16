/**
 * CupoIndicator.test.tsx — Unit tests for the CupoIndicator component (RF-06).
 * Validates rendering, percentage calculation, and color variation.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CupoIndicator } from '../../components/clases/CupoIndicator';

describe('CupoIndicator Component', () => {
  it('renders cupo disponible / cupo maximo text', () => {
    render(<CupoIndicator cupoDisponible={12} cupoMaximo={20} />);
    expect(screen.getByText('12 / 20')).toBeInTheDocument();
  });

  it('renders with all spots available (0% occupied)', () => {
    render(<CupoIndicator cupoDisponible={20} cupoMaximo={20} />);
    expect(screen.getByText('20 / 20')).toBeInTheDocument();
    // 0% occupied → bar should be green
    const bar = document.querySelector('.bg-fitzone-green');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveStyle({ width: '0%' });
  });

  it('applies green color when occupation is below 50%', () => {
    render(<CupoIndicator cupoDisponible={15} cupoMaximo={20} />);
    // 5 occupied out of 20 = 25% → green
    const greenBar = document.querySelector('.bg-fitzone-green');
    expect(greenBar).toBeInTheDocument();
  });

  it('applies red color when occupation is 50% or above', () => {
    render(<CupoIndicator cupoDisponible={5} cupoMaximo={20} />);
    // 15 occupied out of 20 = 75% → red
    const redBar = document.querySelector('.bg-fitzone-red');
    expect(redBar).toBeInTheDocument();
  });

  it('applies red color when fully occupied (100%)', () => {
    render(<CupoIndicator cupoDisponible={0} cupoMaximo={20} />);
    expect(screen.getByText('0 / 20')).toBeInTheDocument();
    const redBar = document.querySelector('.bg-fitzone-red');
    expect(redBar).toBeInTheDocument();
    expect(redBar).toHaveStyle({ width: '100%' });
  });

  it('bar width reflects exact occupation percentage', () => {
    render(<CupoIndicator cupoDisponible={10} cupoMaximo={20} />);
    // 10 occupied / 20 max = 50%
    const bar = document.querySelector('.bg-fitzone-red') || document.querySelector('.bg-fitzone-green');
    expect(bar).toHaveStyle({ width: '50%' });
  });
});
