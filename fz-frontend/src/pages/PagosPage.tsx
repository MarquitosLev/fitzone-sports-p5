import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { DataTable, Spinner, Alert, StatusBadge } from '../components/ui';
import type { Column } from '../components/ui';
import { listarPagos } from '../services/pagosService';
import { useSede } from '../context/SedeContext';
import type { TransaccionDTO } from '../types';
import { formatearFechaHora, formatearMonto } from '../utils/formatters';

const COLUMNS: Column<TransaccionDTO>[] = [
  { key: 'idTransaccion', header: 'ID', width: 70, align: 'center' },
  {
    header: 'Usuario',
    render: (row) => `${row.usuario.nombre} ${row.usuario.apellido}`,
  },
  {
    header: 'Concepto',
    render: (row) => row.concepto.replace('_', ' '),
  },
  {
    header: 'Monto',
    align: 'right',
    render: (row) => (
      <span className="font-bold text-fitzone-navy">{formatearMonto(row.monto)}</span>
    ),
  },
  {
    header: 'Estado',
    align: 'center',
    // StatusBadge acepta el string del enum directamente (mapea CONFIRMADO, PENDIENTE, RECHAZADO)
    render: (row) => <StatusBadge status={row.estadoPago} />,
  },
  {
    header: 'Fecha',
    render: (row) => formatearFechaHora(row.fechaHoraCreacion),
  },
];


export function PagosPage() {
  const { sedeActiva } = useSede();
  const [data, setData] = useState<TransaccionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sedeActiva) return;
    let cancelled = false;

    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listarPagos(sedeActiva.idSede);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar pagos');
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
        <DollarSign className="w-6 h-6 text-fitzone-coral" />
        <h1 className="text-2xl font-black text-fitzone-navy font-outfit">Pagos</h1>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}
      {loading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}
      {!loading && (
        <DataTable<TransaccionDTO>
          columns={COLUMNS}
          data={data}
          keyExtractor={(row) => row.idTransaccion}
          emptyTitle="Sin transacciones registradas"
          emptyMessage="No hay pagos registrados para esta sede."
        />
      )}
    </div>
  );
}
