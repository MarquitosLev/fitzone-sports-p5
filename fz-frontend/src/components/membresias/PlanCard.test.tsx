import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanCard } from './PlanCard';
import type { PlanDTO } from '../../types';

describe('PlanCard Component', () => {
  const mockPlanMensual: PlanDTO = {
    idPlan: 1,
    nombre: 'Plan Mensual',
    precioBase: 15000,
    duracionMeses: 1,
    descripcion: 'Acceso ilimitado a musculación y cardio.',
    beneficios: ['Musculación completa', 'Cardio y vestuarios'],
    destacado: false,
  };

  const mockPlanTrimestral: PlanDTO = {
    idPlan: 2,
    nombre: 'Plan Trimestral',
    precioBase: 40000,
    duracionMeses: 3,
    descripcion: 'Pase multi-sede con clases grupales.',
    beneficios: ['Multi-sede', '2 clases por semana'],
    destacado: true,
  };

  it('renderiza nombre, precio formateado, descripción y beneficios', () => {
    render(<PlanCard plan={mockPlanMensual} />);

    expect(screen.getByText('Plan Mensual')).toBeInTheDocument();
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
    expect(screen.getByText('Acceso ilimitado a musculación y cardio.')).toBeInTheDocument();
    expect(screen.getByText('Musculación completa')).toBeInTheDocument();
    expect(screen.getByText('Cardio y vestuarios')).toBeInTheDocument();
  });

  it('muestra el badge "Más Elegido" cuando el plan es destacado', () => {
    render(<PlanCard plan={mockPlanTrimestral} />);

    expect(screen.getByText(/Más Elegido/i)).toBeInTheDocument();
  });

  it('permite forzar o anular el estado destacado mediante prop', () => {
    const { rerender } = render(<PlanCard plan={mockPlanMensual} destacado={true} />);
    expect(screen.getByText(/Más Elegido/i)).toBeInTheDocument();

    rerender(<PlanCard plan={mockPlanTrimestral} destacado={false} />);
    expect(screen.queryByText(/Más Elegido/i)).not.toBeInTheDocument();
  });

  it('ejecuta el callback onSeleccionar al presionar el botón', () => {
    const handleSeleccionar = vi.fn();
    render(<PlanCard plan={mockPlanMensual} onSeleccionar={handleSeleccionar} />);

    const boton = screen.getByRole('button', { name: /Elegir Plan/i });
    fireEvent.click(boton);

    expect(handleSeleccionar).toHaveBeenCalledTimes(1);
    expect(handleSeleccionar).toHaveBeenCalledWith(mockPlanMensual);
  });

  it('respeta la prop actionLabel personalizada', () => {
    render(<PlanCard plan={mockPlanMensual} actionLabel="Contratar Ahora" />);

    expect(screen.getByRole('button', { name: 'Contratar Ahora' })).toBeInTheDocument();
  });

  it('deshabilita el botón cuando disabled es true', () => {
    const handleSeleccionar = vi.fn();
    render(
      <PlanCard plan={mockPlanMensual} onSeleccionar={handleSeleccionar} disabled={true} />
    );

    const boton = screen.getByRole('button', { name: /Elegir Plan/i });
    expect(boton).toBeDisabled();
    fireEvent.click(boton);
    expect(handleSeleccionar).not.toHaveBeenCalled();
  });
});
