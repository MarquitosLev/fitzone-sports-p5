/**
 * InscriptosClase.test.tsx — Inscriptos y lista de espera de una clase (GER-07),
 * y acceso desde la agenda administrativa según los permisos del rol.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InscriptosClase } from '../../components/clases/InscriptosClase';
import { AgendaSemanal } from '../../components/clases/AgendaSemanal';
import { _resetMockClases } from '../../services/clasesService';
import type { ClaseGrupalDTO } from '../../types';

const sede = { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 };

const claseConEspera: ClaseGrupalDTO = {
  idClase: 2,
  sede,
  nombreActividad: 'Yoga',
  fechaHoraInicio: '2026-10-20T10:00:00',
  duracionMinutos: 75,
  cupoMaximo: 15,
  cupoDisponible: 0,
};

describe('InscriptosClase', () => {
  beforeEach(() => {
    _resetMockClases();
  });

  it('muestra los inscriptos confirmados y la cola de espera en orden', async () => {
    render(<InscriptosClase clase={claseConEspera} />);

    expect(await screen.findByText(/inscriptos \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Ruiz, Sofía')).toBeInTheDocument();
    expect(screen.getByText('López, Martina')).toBeInTheDocument();

    expect(screen.getByText(/lista de espera \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText('Fernández, Lucas')).toBeInTheDocument();
    expect(screen.getByText('García, Valentina')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('informa cuando no hay nadie en lista de espera', async () => {
    render(<InscriptosClase clase={{ ...claseConEspera, idClase: 5, nombreActividad: 'Boxeo' }} />);

    expect(await screen.findByText('Nadie en lista de espera.')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay reservas confirmadas.')).toBeInTheDocument();
  });
});

describe('AgendaSemanal: acceso a inscriptos según el rol', () => {
  it('el gerente edita al hacer click y abre inscriptos con su botón', () => {
    const onEdit = vi.fn();
    const onVerInscriptos = vi.fn();
    render(
      <AgendaSemanal clases={[claseConEspera]} onEdit={onEdit} onDelete={vi.fn()} onVerInscriptos={onVerInscriptos} />
    );

    fireEvent.click(screen.getByTestId('clase-card-2'));
    expect(onEdit).toHaveBeenCalledWith(claseConEspera);

    fireEvent.click(screen.getByRole('button', { name: /ver inscriptos de yoga/i }));
    expect(onVerInscriptos).toHaveBeenCalledWith(claseConEspera);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('el recepcionista no ve eliminar y el click en la tarjeta abre los inscriptos', () => {
    const onVerInscriptos = vi.fn();
    render(<AgendaSemanal clases={[claseConEspera]} onVerInscriptos={onVerInscriptos} />);

    expect(screen.queryByTestId('btn-eliminar-clase-2')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('clase-card-2'));
    expect(onVerInscriptos).toHaveBeenCalledWith(claseConEspera);
  });
});
