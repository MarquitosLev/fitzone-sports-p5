import { useState } from 'react';
import { LogOut, User, Clock, Dumbbell, Calendar, Users } from 'lucide-react';
import type { AccesoDTO } from '../../types';
import { DataTable } from '../ui/DataTable';
import type { Column } from '../ui/DataTable';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Badge } from '../ui/Badge';
import { formatearHora } from '../../utils/formatters';

export interface PersonasAdentroListProps {
  accesos: AccesoDTO[];
  loading?: boolean;
  onRegistrarEgreso: (idAcceso: number) => Promise<void> | void;
  egresoLoadingId?: number | null;
  className?: string;
}

/**
 * Listado en tiempo real de los socios y usuarios actualmente adentro de la sede (fechaHoraEgreso === null).
 * Integra DataTable y ConfirmDialog para registrar egresos de forma segura (solución BUG-09 y RN-01).
 */
export function PersonasAdentroList({
  accesos,
  loading = false,
  onRegistrarEgreso,
  egresoLoadingId = null,
  className = '',
}: PersonasAdentroListProps) {
  const [accesoParaEgreso, setAccesoParaEgreso] = useState<AccesoDTO | null>(null);

  const personasAdentro = accesos.filter((a) => a.fechaHoraEgreso === null);

  const handleConfirmarEgreso = async () => {
    if (!accesoParaEgreso) return;
    try {
      await onRegistrarEgreso(accesoParaEgreso.idAcceso);
    } finally {
      setAccesoParaEgreso(null);
    }
  };

  const columns: Column<AccesoDTO>[] = [
    {
      key: 'usuario',
      header: 'Socio / Usuario',
      render: (row) => {
        const u = row.usuario;
        const nombre = `${u.nombre} ${u.apellido}`;
        const iniciales = `${(u.nombre?.[0] || '').toUpperCase()}${(u.apellido?.[0] || '').toUpperCase()}` || 'FZ';

        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-fitzone-navy/10 text-fitzone-navy flex items-center justify-center font-bold text-xs shrink-0">
              {iniciales}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-fitzone-navy block truncate text-xs sm:text-sm">
                {nombre}
              </span>
              <span className="text-[11px] text-slate-400 block">
                DNI: {u.dni || '—'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'origen',
      header: 'Tipo de Acceso',
      align: 'center',
      render: (row) => {
        if (row.reservaClase) {
          return (
            <Badge variant="navy-soft">
              <Dumbbell className="w-3 h-3 mr-1 inline" />
              Clase Grupal
            </Badge>
          );
        }
        if (row.reservaCancha) {
          return (
            <Badge variant="gold">
              <Calendar className="w-3 h-3 mr-1 inline" />
              Cancha
            </Badge>
          );
        }
        return (
          <Badge variant="green-soft">
            <User className="w-3 h-3 mr-1 inline" />
            Pase Libre
          </Badge>
        );
      },
    },
    {
      key: 'ingreso',
      header: 'Hora Ingreso',
      align: 'center',
      render: (row) => (
        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatearHora(row.fechaHoraIngreso)}</span>
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Salida',
      align: 'right',
      render: (row) => {
        const isThisLoading = egresoLoadingId === row.idAcceso;

        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAccesoParaEgreso(row)}
            isLoading={isThisLoading}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
            className="hover:border-fitzone-coral hover:text-fitzone-coral"
          >
            Registrar Egreso
          </Button>
        );
      },
    },
  ];

  return (
    <div
      data-testid="personas-adentro-card"
      className={`bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-fitzone-navy flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-fitzone-navy" />
          </div>
          <div>
            <h3 className="text-base font-black text-fitzone-navy font-outfit">
              Personas Actualmente en Sede
            </h3>
            <p className="text-xs text-slate-400">
              Accesos activos sin salida registrada ({personasAdentro.length})
            </p>
          </div>
        </div>

        <Badge variant={personasAdentro.length > 0 ? 'green-soft' : 'default'}>
          {personasAdentro.length} {personasAdentro.length === 1 ? 'persona adentro' : 'personas adentro'}
        </Badge>
      </div>

      {/* Grilla DataTable */}
      <DataTable<AccesoDTO>
        columns={columns}
        data={personasAdentro}
        loading={loading}
        keyExtractor={(row) => row.idAcceso}
        emptyTitle="No hay personas en la sede"
        emptyMessage="En este momento no hay socios dentro de las instalaciones o todos ya registraron su salida."
      />

      {/* Diálogo de Confirmación de Egreso */}
      <ConfirmDialog
        isOpen={Boolean(accesoParaEgreso)}
        onClose={() => setAccesoParaEgreso(null)}
        onConfirm={handleConfirmarEgreso}
        title="Registrar Egreso del Socio"
        description={`¿Confirmás la salida de ${accesoParaEgreso?.usuario.nombre} ${accesoParaEgreso?.usuario.apellido}? Esto liberará 1 lugar en el aforo de la sede.`}
        confirmText="Confirmar Egreso"
        cancelText="Cancelar"
        variant="warning"
      />
    </div>
  );
}
