/**
 * MembresiasPage.tsx — Página del módulo Membresías.
 * Esqueleto conectado: carga datos del servicio y muestra los 4 estados.
 * TODO: Agregar columnas de DataTable, acciones de renovar/cancelar.
 */

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { DataTable, Spinner, Alert } from '../components/ui';
import type { Column } from '../components/ui';
import { listarMembresias } from '../services/membresiasService';
import { useSede } from '../context/SedeContext';
import type { MembresiaDTO } from '../types';
import { formatearFecha } from '../utils/formatters';

const COLUMNS: Column<MembresiaDTO>[] = [
  { key: 'idMembresia', header: 'ID', width: 60, align: 'center' },
  {
    header: 'Socio',
    render: (row) => `${row.usuario.nombre} ${row.usuario.apellido}`,
  },
  {
    header: 'Plan',
    render: (row) => row.plan.nombre,
  },
  {
    header: 'Vencimiento',
    render: (row) => formatearFecha(row.fechaVencimiento),
  },
  {
    key: 'estado',
    header: 'Estado',
    align: 'center',
  },
];

export function MembresiasPage() {
  const { sedeActiva } = useSede();
  const [data, setData] = useState<MembresiaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sedeActiva) return;
    let cancelled = false;

    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listarMembresias(sedeActiva.idSede);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar membresías');
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
        <CreditCard className="w-6 h-6 text-fitzone-coral" />
        <h1 className="text-2xl font-black text-fitzone-navy font-outfit">Membresías</h1>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}
      {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {!loading && (
        <DataTable<MembresiaDTO>
          columns={COLUMNS}
          data={data}
          keyExtractor={(row) => row.idMembresia}
          emptyTitle="Sin membresías registradas"
          emptyMessage="No hay membresías para esta sede."
        />
      )}
    </div>
  );
}
