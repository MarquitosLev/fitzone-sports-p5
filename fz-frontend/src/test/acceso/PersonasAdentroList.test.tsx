/**
 * PersonasAdentroList.test.tsx — Pruebas unitarias para el listado de personas en sede y egresos (BUG-09).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PersonasAdentroList } from '../../components/acceso/PersonasAdentroList';
import type { AccesoDTO } from '../../types';

const mockAccesos: AccesoDTO[] = [
  {
    idAcceso: 1,
    usuario: {
      idUsuario: 1,
      authId: 'u1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas@fitzone.com',
      telefono: '',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    reservaClase: null,
    reservaCancha: null,
    fechaHoraIngreso: '2026-10-18T09:10:00',
    fechaHoraEgreso: null, // adentro
  },
  {
    idAcceso: 2,
    usuario: {
      idUsuario: 2,
      authId: 'u2',
      dni: '28456789',
      nombre: 'Valentina',
      apellido: 'García',
      email: 'vgarcia@fitzone.com',
      telefono: '',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    reservaClase: {
      idReservaClase: 10,
      clase: {
        idClase: 1,
        sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
        nombreActividad: 'Spinning',
        fechaHoraInicio: '2026-10-18T09:30:00',
        duracionMinutos: 60,
        cupoMaximo: 20,
        cupoDisponible: 5,
      },
      usuario: {
        idUsuario: 2,
        authId: 'u2',
        dni: '28456789',
        nombre: 'Valentina',
        apellido: 'García',
        email: 'vgarcia@fitzone.com',
        telefono: '',
        fotoUrl: null,
        tipoUsuario: 'SOCIO',
        idSede: 1,
      },
      estado: 'CONFIRMADA',
    },
    reservaCancha: null,
    fechaHoraIngreso: '2026-10-18T09:20:00',
    fechaHoraEgreso: null, // adentro
  },
  {
    idAcceso: 3,
    usuario: {
      idUsuario: 3,
      authId: 'u3',
      dni: '32987654',
      nombre: 'Martín',
      apellido: 'Gómez',
      email: 'mgomez@fitzone.com',
      telefono: '',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    reservaClase: null,
    reservaCancha: null,
    fechaHoraIngreso: '2026-10-18T08:00:00',
    fechaHoraEgreso: '2026-10-18T09:00:00', // YA EGRESÓ
  },
];

describe('PersonasAdentroList Component', () => {
  it('renderiza solo a quienes tienen fechaHoraEgreso === null', () => {
    render(
      <PersonasAdentroList
        accesos={mockAccesos}
        onRegistrarEgreso={vi.fn()}
      />
    );

    expect(screen.getByText('Lucas Martínez')).toBeInTheDocument();
    expect(screen.getByText('Valentina García')).toBeInTheDocument();
    // Martín Gómez ya egresó, no debe estar en la grilla
    expect(screen.queryByText('Martín Gómez')).not.toBeInTheDocument();
    expect(screen.getByText('2 personas adentro')).toBeInTheDocument();
  });

  it('diferencia los tipos de acceso (Pase Libre vs Clase Grupal)', () => {
    render(
      <PersonasAdentroList
        accesos={mockAccesos}
        onRegistrarEgreso={vi.fn()}
      />
    );

    expect(screen.getByText('Pase Libre')).toBeInTheDocument();
    expect(screen.getByText('Clase Grupal')).toBeInTheDocument();
  });

  it('abre el diálogo ConfirmDialog al presionar Registrar Egreso', () => {
    render(
      <PersonasAdentroList
        accesos={mockAccesos}
        onRegistrarEgreso={vi.fn()}
      />
    );

    const botonesEgreso = screen.getAllByRole('button', { name: /Registrar Egreso/i });
    fireEvent.click(botonesEgreso[0]); // Lucas Martínez

    expect(screen.getByText('Registrar Egreso del Socio')).toBeInTheDocument();
    expect(
      screen.getByText(/¿Confirmás la salida de Lucas Martínez\? Esto liberará 1 lugar en el aforo/i)
    ).toBeInTheDocument();
  });

  it('llama a onRegistrarEgreso con el idAcceso correcto al confirmar', async () => {
    const onEgresoMock = vi.fn().mockResolvedValue(undefined);
    render(
      <PersonasAdentroList
        accesos={mockAccesos}
        onRegistrarEgreso={onEgresoMock}
      />
    );

    const botonesEgreso = screen.getAllByRole('button', { name: /Registrar Egreso/i });
    fireEvent.click(botonesEgreso[0]); // Lucas Martínez (idAcceso: 1)

    // Dentro del modal ConfirmDialog
    const btnConfirmar = screen.getByRole('button', { name: 'Confirmar Egreso' });
    fireEvent.click(btnConfirmar);

    expect(onEgresoMock).toHaveBeenCalledWith(1);
  });

  it('cierra el modal sin invocar onRegistrarEgreso si se cancela', () => {
    const onEgresoMock = vi.fn();
    render(
      <PersonasAdentroList
        accesos={mockAccesos}
        onRegistrarEgreso={onEgresoMock}
      />
    );

    const botonesEgreso = screen.getAllByRole('button', { name: /Registrar Egreso/i });
    fireEvent.click(botonesEgreso[0]);

    const btnCancelar = screen.getByRole('button', { name: 'Cancelar' });
    fireEvent.click(btnCancelar);

    expect(onEgresoMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Registrar Egreso del Socio')).not.toBeInTheDocument();
  });

  it('muestra estado vacío cuando nadie está dentro de la sede', () => {
    render(
      <PersonasAdentroList
        accesos={[]}
        onRegistrarEgreso={vi.fn()}
      />
    );

    expect(screen.getByText('No hay personas en la sede')).toBeInTheDocument();
  });
});
