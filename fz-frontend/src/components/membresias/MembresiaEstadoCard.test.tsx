import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MembresiaEstadoCard, calcularDiasRestantes } from './MembresiaEstadoCard';
import type { MembresiaDTO } from '../../types';

describe('MembresiaEstadoCard Component', () => {
  const hoy = new Date();
  const formatearIso = (d: Date) => d.toISOString().split('T')[0];

  // Helper para generar fechas relativas a hoy
  const fechaRelativa = (dias: number) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + dias);
    return formatearIso(d);
  };

  const baseMembresia: MembresiaDTO = {
    idMembresia: 1,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas.martinez@email.com',
      telefono: '11-4567-8901',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    plan: {
      idPlan: 1,
      nombre: 'Plan Mensual',
      precioBase: 15000,
    },
    fechaInicio: fechaRelativa(-20),
    fechaVencimiento: fechaRelativa(15), // 15 días restantes (> 7)
    fechaCancelacion: null,
    estado: 'ACTIVO',
  };

  it('calcula correctamente los días restantes usando la función auxiliar', () => {
    const dias = calcularDiasRestantes(fechaRelativa(10));
    expect(dias).toBeGreaterThanOrEqual(9);
    expect(dias).toBeLessThanOrEqual(11);
  });

  it('renderiza el nombre del plan, fechas y StatusBadge de activo', () => {
    render(<MembresiaEstadoCard membresia={baseMembresia} />);

    expect(screen.getByText('Plan Mensual')).toBeInTheDocument();
    expect(screen.getByText(/Activo/i)).toBeInTheDocument();
    expect(screen.getByText('Fecha de Vencimiento')).toBeInTheDocument();
    expect(screen.getByText('Fecha de Inicio')).toBeInTheDocument();
  });

  it('NO muestra alerta si la membresía vence en más de 7 días', () => {
    const membresiaHolgada: MembresiaDTO = {
      ...baseMembresia,
      fechaVencimiento: fechaRelativa(20),
    };

    render(<MembresiaEstadoCard membresia={membresiaHolgada} />);

    expect(screen.queryByTestId('alerta-vencimiento-proximo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Membresía próxima a vencer/i)).not.toBeInTheDocument();
  });

  it('MUESTRA la alerta de vencimiento próximo si vence en menos de 7 días', () => {
    const membresiaPorVencer: MembresiaDTO = {
      ...baseMembresia,
      fechaVencimiento: fechaRelativa(3), // 3 días restantes (< 7)
      estado: 'ACTIVO',
    };

    render(<MembresiaEstadoCard membresia={membresiaPorVencer} />);

    expect(screen.getByTestId('alerta-vencimiento-proximo')).toBeInTheDocument();
    expect(screen.getByText(/Membresía próxima a vencer/i)).toBeInTheDocument();
  });

  it('muestra la alerta de vencida cuando el estado es VENCIDO', () => {
    const membresiaVencida: MembresiaDTO = {
      ...baseMembresia,
      fechaVencimiento: fechaRelativa(-5),
      estado: 'VENCIDO',
    };

    render(<MembresiaEstadoCard membresia={membresiaVencida} />);

    expect(screen.getByTestId('alerta-vencida')).toBeInTheDocument();
    expect(screen.getByText(/Membresía Vencida/i)).toBeInTheDocument();
  });

  it('muestra la alerta correspondiente cuando el estado es SUSPENDIDO', () => {
    const membresiaSuspendida: MembresiaDTO = {
      ...baseMembresia,
      estado: 'SUSPENDIDO',
    };

    render(<MembresiaEstadoCard membresia={membresiaSuspendida} />);

    expect(screen.getByTestId('alerta-suspendida')).toBeInTheDocument();
    expect(screen.getByText(/Membresía Suspendida/i)).toBeInTheDocument();
  });

  it('muestra la alerta correspondiente cuando el estado es CANCELADO', () => {
    const membresiaCancelada: MembresiaDTO = {
      ...baseMembresia,
      estado: 'CANCELADO',
    };

    render(<MembresiaEstadoCard membresia={membresiaCancelada} />);

    expect(screen.getByTestId('alerta-cancelada')).toBeInTheDocument();
    expect(screen.getByText(/Membresía Cancelada/i)).toBeInTheDocument();
  });

  it('renderiza estado amigable cuando membresia es null', () => {
    render(<MembresiaEstadoCard membresia={null} />);

    expect(screen.getByText(/Sin Membresía Activa/i)).toBeInTheDocument();
  });

  it('dispara onRenovarClick al hacer clic en el botón de renovación', () => {
    const handleRenovar = vi.fn();
    const membresiaPorVencer: MembresiaDTO = {
      ...baseMembresia,
      fechaVencimiento: fechaRelativa(2),
      estado: 'ACTIVO',
    };

    render(
      <MembresiaEstadoCard
        membresia={membresiaPorVencer}
        onRenovarClick={handleRenovar}
      />
    );

    const boton = screen.getByRole('button', { name: /Renovar ahora/i });
    fireEvent.click(boton);

    expect(handleRenovar).toHaveBeenCalledTimes(1);
  });
});
