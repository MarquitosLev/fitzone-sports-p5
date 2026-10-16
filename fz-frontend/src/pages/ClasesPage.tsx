/**
 * ClasesPage.tsx — Página del módulo Clases Grupales.
 * Esqueleto conectado: carga y muestra clases grupales de la sede activa.
 * TODO: Agregar gestión de cupos, acciones de cancelar clase.
 */

import { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { DataTable, Spinner, Alert, Badge } from '../components/ui';
import type { Column } from '../components/ui';
import { listarClases } from '../services/clasesService';
import { useSede } from '../context/SedeContext';
import type { ClaseGrupalDTO } from '../types';
import { formatearFechaHora } from '../utils/formatters';

const COLUMNS: Column<ClaseGrupalDTO>[] = [
  { key: 'idClase', header: 'ID', width: 60, align: 'center' },
  { key: 'nombreActividad', header: 'Actividad' },
  {
    header: 'Inicio',
    render: (row) => formatearFechaHora(row.fechaHoraInicio),
  },
  {
    header: 'Duración',
    render: (row) => `${row.duracionMinutos} min`,
    align: 'center',
  },
  {
    header: 'Cupos',
    align: 'center',
    render: (row) => (
      <Badge variant={row.cupoDisponible === 0 ? 'red-soft' : 'green-soft'}>
        {row.cupoDisponible} / {row.cupoMaximo}
      </Badge>
    ),
  },
];

export function ClasesPage() {
  const { sedeActiva } = useSede();
  const [data, setData] = useState<ClaseGrupalDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sedeActiva) return;
    let cancelled = false;

    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listarClases(sedeActiva.idSede);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar clases');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void cargar();
    return () => { cancelled = true; };
  }, [sedeActiva]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Dumbbell className="w-6 h-6 text-fitzone-coral" />
        <h1 className="text-2xl font-black text-fitzone-navy font-outfit">Clases Grupales</h1>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}
      {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {!loading && (
        <DataTable<ClaseGrupalDTO>
          columns={COLUMNS}
          data={data}
          keyExtractor={(row) => row.idClase}
          emptyTitle="Sin clases programadas"
          emptyMessage="No hay clases grupales para esta sede."
        />
      )}
    </div>
  );
}
