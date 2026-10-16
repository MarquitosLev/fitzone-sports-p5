/**
 * AgendaSemanal.test.tsx — Unit tests for the AgendaSemanal component (RF-06).
 * Validates weekly grid rendering, class distribution, and manager callbacks.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgendaSemanal } from '../../components/clases/AgendaSemanal';
import type { ClaseGrupalDTO } from '../../types';

const mockSede = { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 };

const mockClases: ClaseGrupalDTO[] = [
  {
    idClase: 1,
    sede: mockSede,
    nombreActividad: 'Spinning',
    fechaHoraInicio: '2026-10-19T08:00:00', // Monday
    duracionMinutos: 60,
    cupoMaximo: 20,
    cupoDisponible: 5,
  },
  {
    idClase: 2,
    sede: mockSede,
    nombreActividad: 'Yoga',
    fechaHoraInicio: '2026-10-20T10:00:00', // Tuesday
    duracionMinutos: 75,
    cupoMaximo: 15,
    cupoDisponible: 0,
  },
  {
    idClase: 3,
    sede: mockSede,
    nombreActividad: 'CrossFit',
    fechaHoraInicio: '2026-10-19T17:00:00', // Monday (second class same day)
    duracionMinutos: 50,
    cupoMaximo: 12,
    cupoDisponible: 3,
  },
];

describe('AgendaSemanal Component', () => {
  it('renders a column for each day of the week (7 columns)', () => {
    render(<AgendaSemanal clases={[]} />);

    // All 7 day names should be present
    expect(screen.getByText('lunes')).toBeInTheDocument();
    expect(screen.getByText('martes')).toBeInTheDocument();
    expect(screen.getByText('miércoles')).toBeInTheDocument();
    expect(screen.getByText('jueves')).toBeInTheDocument();
    expect(screen.getByText('viernes')).toBeInTheDocument();
    expect(screen.getByText('sábado')).toBeInTheDocument();
    expect(screen.getByText('domingo')).toBeInTheDocument();
  });

  it('shows "Sin clases" placeholder for days without classes', () => {
    render(<AgendaSemanal clases={[]} />);
    const sinClases = screen.getAllByText(/sin clases/i);
    // All 7 days should show the placeholder
    expect(sinClases.length).toBe(7);
  });

  it('renders class names in the correct day column', () => {
    render(<AgendaSemanal clases={mockClases} />);
    // Spinning and CrossFit are on Monday, Yoga on Tuesday
    expect(screen.getByText('Spinning')).toBeInTheDocument();
    expect(screen.getByText('CrossFit')).toBeInTheDocument();
    expect(screen.getByText('Yoga')).toBeInTheDocument();
  });

  it('renders multiple classes on the same day', () => {
    render(<AgendaSemanal clases={mockClases} />);
    // Both Monday classes should appear
    expect(screen.getByText('Spinning')).toBeInTheDocument();
    expect(screen.getByText('CrossFit')).toBeInTheDocument();
  });

  it('shows CupoIndicator (cupo text) for each class', () => {
    render(<AgendaSemanal clases={mockClases} />);
    // Each class shows "disponible / maximo"
    expect(screen.getByText('5 / 20')).toBeInTheDocument();  // Spinning
    expect(screen.getByText('0 / 15')).toBeInTheDocument();  // Yoga
    expect(screen.getByText('3 / 12')).toBeInTheDocument();  // CrossFit
  });

  it('calls onEdit when clicking on a class block', () => {
    const handleEdit = vi.fn();
    render(<AgendaSemanal clases={mockClases} onEdit={handleEdit} />);

    fireEvent.click(screen.getByText('Spinning'));
    expect(handleEdit).toHaveBeenCalledWith(mockClases[0]);
  });

  it('calls onDelete when clicking the Eliminar button', () => {
    const handleDelete = vi.fn();
    render(<AgendaSemanal clases={mockClases} onDelete={handleDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('does NOT render Eliminar buttons when onDelete prop is not provided', () => {
    render(<AgendaSemanal clases={mockClases} />);
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it('Eliminar button does not trigger onEdit (stopPropagation works)', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    render(<AgendaSemanal clases={mockClases} onEdit={handleEdit} onDelete={handleDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    // onDelete called but NOT onEdit (stopPropagation)
    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleEdit).not.toHaveBeenCalled();
  });

  it('renders with empty class list without errors', () => {
    expect(() => render(<AgendaSemanal clases={[]} />)).not.toThrow();
  });
});
