import { Calendar, Clock, RefreshCw, Ban } from 'lucide-react';
import { Card, StatusBadge, Button, Alert } from '../ui';
import type { MembresiaDTO, UsuarioDTO } from '../../types';
import { formatearFecha, formatearMonto } from '../../utils/formatters';

export interface MembresiaEstadoCardProps {
  /** Membresía a mostrar, o null si el usuario no tiene ninguna */
  membresia?: MembresiaDTO | null;
  /** Datos del socio (opcional para contexto de cabecera) */
  socio?: UsuarioDTO | null;
  /** Callback opcional de renovación rápida */
  onRenovarClick?: () => void;
  className?: string;
}

/**
 * Calcula la diferencia en días entre la fecha de vencimiento y la fecha actual.
 */
export function calcularDiasRestantes(fechaVencimientoIso: string): number {
  if (!fechaVencimientoIso) return 0;
  try {
    const [year, month, day] = fechaVencimientoIso.split('-').map(Number);
    const fechaVto = new Date(year, month - 1, day, 23, 59, 59);
    const hoy = new Date();
    // Normalizar hoy a inicio del día para cálculo exacto de días calendario
    const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
    const diffMs = fechaVto.getTime() - hoyInicio.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * MembresiaEstadoCard — Componente para visualizar el estado de membresía de un socio (RF-02).
 * Muestra StatusBadge, fecha de vencimiento, días restantes y alerta si vence en menos de 7 días.
 */
export function MembresiaEstadoCard({
  membresia,
  socio,
  onRenovarClick,
  className = '',
}: MembresiaEstadoCardProps) {
  // Si no tiene membresía registrada
  if (!membresia) {
    return (
      <Card
        variant="flat"
        className={`p-6 border border-slate-200 bg-slate-50/70 rounded-3xl ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/80 flex items-center justify-center text-slate-500">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-fitzone-navy font-outfit text-lg">
                  Sin Membresía Activa
                </h3>
                <StatusBadge status="SIN_MEMBRESIA" size="sm" showDot />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {socio
                  ? `${socio.nombre} ${socio.apellido} no posee un plan vigente asignado.`
                  : 'El socio seleccionado no posee un plan de membresía registrado.'}
              </p>
            </div>
          </div>

          {onRenovarClick && (
            <Button
              type="button"
              variant="coral"
              size="sm"
              onClick={onRenovarClick}
              leftIcon={RefreshCw}
              className="shrink-0"
            >
              Asociar Membresía
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const diasRestantes = calcularDiasRestantes(membresia.fechaVencimiento);
  const estaPorVencer = membresia.estado === 'ACTIVO' && diasRestantes <= 7 && diasRestantes >= 0;
  const estaVencido = membresia.estado === 'VENCIDO' || diasRestantes < 0;
  const estaSuspendido = membresia.estado === 'SUSPENDIDO';
  const estaCancelado = membresia.estado === 'CANCELADO';

  return (
    <Card
      variant="default"
      className={`relative overflow-hidden border border-slate-200 shadow-card rounded-3xl transition-all duration-200 ${className}`}
    >
      {/* Banner superior con fondo institucional Navy */}
      <div className="bg-gradient-to-r from-fitzone-navy to-fitzone-navy-light p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-fitzone-coral uppercase tracking-wider">
                Plan Actual
              </span>
              <StatusBadge status={membresia.estado} size="sm" showDot />
            </div>

            <h3 className="text-2xl font-black font-outfit tracking-tight text-white">
              {membresia.plan.nombre}
            </h3>

            <p className="text-xs text-slate-300 font-medium">
              Tarifa contratada: {formatearMonto(membresia.plan.precioBase)}
            </p>
          </div>

          {/* Días restantes - Contador destacado */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 self-stretch sm:self-auto justify-between sm:justify-start">
            <Clock className="w-5 h-5 text-fitzone-coral shrink-0" />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                {estaVencido ? 'Días vencida' : 'Días restantes'}
              </div>
              <div
                className={`text-lg font-black font-outfit tracking-tight ${
                  estaPorVencer
                    ? 'text-amber-300'
                    : estaVencido
                    ? 'text-rose-300'
                    : 'text-white'
                }`}
              >
                {estaVencido
                  ? `${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? 'día' : 'días'}`
                  : diasRestantes === 0
                  ? 'Vence hoy'
                  : `${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido inferior: Fechas, métricas y alertas */}
      <div className="p-6 space-y-5 bg-white">
        {/* Alerta si vence en menos de 7 días */}
        {estaPorVencer && (
          <div
            data-testid="alerta-vencimiento-proximo"
            className="animate-in fade-in duration-200"
          >
            <Alert
              type="warning"
              title="Membresía próxima a vencer"
              message={
                diasRestantes === 0
                  ? 'La membresía vence hoy. Renová hoy para evitar cortes en el ingreso al gimnasio.'
                  : `La membresía vence en ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}. Se recomienda renovar antes de la fecha límite.`
              }
              action={
                onRenovarClick && (
                  <Button
                    variant="coral"
                    size="xs"
                    onClick={onRenovarClick}
                    leftIcon={RefreshCw}
                  >
                    Renovar ahora
                  </Button>
                )
              }
            />
          </div>
        )}

        {/* Alerta de membresía ya vencida */}
        {estaVencido && (
          <div
            data-testid="alerta-vencida"
            className="animate-in fade-in duration-200"
          >
            <Alert
              type="error"
              title="Membresía Vencida"
              message="El plazo de vigencia ha finalizado. El socio tiene el acceso temporalmente bloqueado hasta renovar."
              action={
                onRenovarClick && (
                  <Button
                    variant="coral"
                    size="xs"
                    onClick={onRenovarClick}
                    leftIcon={RefreshCw}
                  >
                    Renovar plan
                  </Button>
                )
              }
            />
          </div>
        )}

        {/* Alerta de membresía suspendida */}
        {estaSuspendido && (
          <div
            data-testid="alerta-suspendida"
            className="animate-in fade-in duration-200"
          >
            <Alert
              type="warning"
              title="Membresía Suspendida"
              message="La membresía se encuentra pausada temporalmente. El socio no podrá ingresar a las sedes hasta su reactivación."
            />
          </div>
        )}

        {/* Alerta de membresía cancelada */}
        {estaCancelado && (
          <div
            data-testid="alerta-cancelada"
            className="animate-in fade-in duration-200"
          >
            <Alert
              type="info"
              title="Membresía Cancelada"
              message="La membresía fue dada de baja definitivamente. Podés dar de alta un nuevo plan cuando el socio lo requiera."
            />
          </div>
        )}

        {/* Grilla de fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="p-2 rounded-xl bg-slate-200/70 text-slate-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Fecha de Inicio
              </span>
              <span className="text-sm font-black text-fitzone-navy font-outfit">
                {formatearFecha(membresia.fechaInicio)}
              </span>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
              estaPorVencer
                ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                : estaVencido
                ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-100 text-fitzone-navy'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                estaPorVencer
                  ? 'bg-amber-100 text-amber-700'
                  : estaVencido
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-200/70 text-slate-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Fecha de Vencimiento
              </span>
              <span className="text-sm font-black font-outfit">
                {formatearFecha(membresia.fechaVencimiento)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
