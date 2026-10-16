/**
 * CanchasPage.tsx — Página del módulo Canchas.
 * Esqueleto conectado: lista canchas con indicador de mantenimiento.
 * TODO: Agregar grilla de disponibilidad horaria, toggle de mantenimiento.
 */

import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { DataTable, Spinner, Alert, Badge } from '../components/ui';
import type { Column } from '../components/ui';
import { listarCanchas } from '../services/canchasService';
import { useSede } from '../context/SedeContext';
import type { CanchaDTO } from '../types';
import { formatearMonto } from '../utils/formatters';

const COLUMNS: Column<CanchaDTO>[] = [
  { key: 'idCancha', header: 'ID', width: 60, align: 'center' },
  { key: 'nombre', header: 'Nombre' },
  {
    header: 'Precio/hora',
    render: (row) => formatearMonto(row.precioBaseHora),
    align: 'right',
  },
  {
    header: 'Estado',
    align: 'center',
    render: (row) => (
      <Badge variant={row.enMantenimiento ? 'red-soft' : 'green-soft'}>
        {row.enMantenimiento ? 'En mantenimiento' : 'Disponible'}
      </Badge>
    ),
  },
];

export function CanchasPage() {
  const { sedeActiva } = useSede();
  const [data, setData] = useState<CanchaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sedeActiva) return;
    let cancelled = false;

    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listarCanchas(sedeActiva.idSede);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar canchas');
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
        <Layers className="w-6 h-6 text-fitzone-coral" />
        <h1 className="text-2xl font-black text-fitzone-navy font-outfit">Canchas</h1>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}
      {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {!loading && (
        <DataTable<CanchaDTO>
          columns={COLUMNS}
          data={data}
          keyExtractor={(row) => row.idCancha}
          emptyTitle="Sin canchas registradas"
          emptyMessage="No hay canchas para esta sede."
        />
      )}
    </div>
  );
}
