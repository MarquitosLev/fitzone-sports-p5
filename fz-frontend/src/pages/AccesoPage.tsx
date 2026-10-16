/**
 * AccesoPage.tsx — Página de Control de Acceso físico.
 * Esqueleto conectado: carga datos del servicio de accesos.
 * TODO: Agregar columnas de hora de ingreso/egreso, búsqueda por DNI.
 */

import { useState, useEffect } from 'react';
import { DoorOpen } from 'lucide-react';
import { DataTable, Spinner, Alert } from '../components/ui';
import type { Column } from '../components/ui';
import { listarAccesos } from '../services/accesoService';
import { useSede } from '../context/SedeContext';
import type { AccesoDTO } from '../types';
import { formatearFechaHora } from '../utils/formatters';

const COLUMNS: Column<AccesoDTO>[] = [
  { key: 'idAcceso', header: 'ID', width: 60, align: 'center' },
  {
    header: 'Usuario',
    render: (row) => `${row.usuario.nombre} ${row.usuario.apellido}`,
  },
  {
    header: 'Ingreso',
    render: (row) => formatearFechaHora(row.fechaHoraIngreso),
  },
  {
    header: 'Egreso',
    render: (row) => row.fechaHoraEgreso ? formatearFechaHora(row.fechaHoraEgreso) : '— (en sede)',
  },
];

export function AccesoPage() {
  const { sedeActiva } = useSede();
  const [data, setData] = useState<AccesoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sedeActiva) return;
    let cancelled = false;

    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listarAccesos(sedeActiva.idSede);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar accesos');
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
        <DoorOpen className="w-6 h-6 text-fitzone-coral" />
        <h1 className="text-2xl font-black text-fitzone-navy font-outfit">Control de Acceso</h1>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}
      {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {!loading && (
        <DataTable<AccesoDTO>
          columns={COLUMNS}
          data={data}
          keyExtractor={(row) => row.idAcceso}
          emptyTitle="Sin registros de acceso"
          emptyMessage="No hay ingresos/egresos registrados para esta sede."
        />
      )}
    </div>
  );
}
