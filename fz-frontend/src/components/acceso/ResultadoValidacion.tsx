import { CheckCircle2, XCircle, Clock, ShieldAlert, DoorOpen, X } from 'lucide-react';
import type { ResultadoValidacionDTO, MotivoRechazoAcceso } from '../../types';
import { UsuarioPerfilHeader } from '../usuarios/UsuarioPerfilHeader';
import { formatearHora } from '../../utils/formatters';

export interface ResultadoValidacionProps {
  resultado: ResultadoValidacionDTO | null;
  onLimpiar?: () => void;
  className?: string;
}

interface DetalleMotivo {
  titulo: string;
  descripcion: string;
  sugerencia: string;
}

const DICCIONARIO_MOTIVOS: Record<MotivoRechazoAcceso, DetalleMotivo> = {
  QR_VENCIDO: {
    titulo: 'Pase QR Expirado',
    descripcion: 'El código QR presentado tiene más de 5 minutos de antigüedad o ya fue consumido.',
    sugerencia: 'Pedile al socio que abra su app móvil y genere un nuevo código QR dinámico.',
  },
  MEMBRESIA_INACTIVA: {
    titulo: 'Membresía Inactiva / Morosa',
    descripcion: 'El socio no cuenta con una membresía activa vigente en el sistema.',
    sugerencia: 'Debe regularizar su cuota mensual en recepción antes de ingresar.',
  },
  YA_INGRESADO: {
    titulo: 'Ingreso Previo Activo (RN-01)',
    descripcion: 'Ya figura un ingreso registrado sin egreso para este usuario en las instalaciones.',
    sugerencia: 'Verificá si el socio olvidó registrar su salida del club o si prestó su pase.',
  },
  AFORO_COMPLETO: {
    titulo: 'Aforo Completo en Sede (RF-05)',
    descripcion: 'La sede ha alcanzado la capacidad máxima de personas autorizada por normativa.',
    sugerencia: 'El socio debe aguardar a que se registren egresos para habilitar su acceso.',
  },
};

/**
 * Muestra el resultado visual de la validación del pase de acceso (aprobado o rechazado).
 * Si es aprobado, integra la ficha del socio con UsuarioPerfilHeader y la confirmación de molinete.
 * Si es rechazado, traduce pedagógicamente el motivo de rechazo (RF-04, RN-01, RF-05).
 */
export function ResultadoValidacion({
  resultado,
  onLimpiar,
  className = '',
}: ResultadoValidacionProps) {
  if (!resultado) {
    return (
      <div
        data-testid="resultado-validacion-vacio"
        className={`bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3 ${className}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 mx-auto flex items-center justify-center shadow-xs">
          <DoorOpen className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-700">Esperando escaneo</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingresá o escaneá un token de acceso para ver la ficha del socio y autorizar el molinete.
          </p>
        </div>
      </div>
    );
  }

  const { aprobado, motivoRechazo, mensaje, usuario, acceso } = resultado;

  if (aprobado) {
    const horaIngreso = acceso?.fechaHoraIngreso ? formatearHora(acceso.fechaHoraIngreso) : 'Ahora';

    return (
      <div
        data-testid="resultado-validacion-aprobado"
        className={`bg-emerald-50/60 border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 animate-slide-up ${className}`}
      >
        {/* Banner de éxito y molinete */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-emerald-200/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-fitzone-green text-white flex items-center justify-center shadow-md shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                MOLINETE HABILITADO · ACCESO PERMITIDO
              </span>
              <h3 className="text-xl font-black text-fitzone-navy font-outfit">
                Pase Autorizado
              </h3>
              <p className="text-xs text-emerald-800 font-medium mt-0.5">
                {mensaje || 'Ingreso registrado en el sistema exitosamente.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-emerald-800 text-xs font-mono font-bold shadow-xs">
              <Clock className="w-3.5 h-3.5 text-fitzone-green" />
              <span>{horaIngreso}</span>
            </div>
            {onLimpiar && (
              <button
                type="button"
                onClick={onLimpiar}
                aria-label="Cerrar resultado"
                className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Ficha del socio usando UsuarioPerfilHeader */}
        {usuario && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              SOCIO INGRESANTE
            </span>
            <UsuarioPerfilHeader
              usuario={usuario}
              compact
              className="border-emerald-200/50 shadow-none bg-white/80"
            />
          </div>
        )}
      </div>
    );
  }

  // Caso Rechazado
  const detalleMotivo = motivoRechazo
    ? DICCIONARIO_MOTIVOS[motivoRechazo]
    : {
        titulo: 'Acceso Denegado',
        descripcion: mensaje || 'No se autorizó el pase.',
        sugerencia: 'Consultá en recepción para más información.',
      };

  return (
    <div
      data-testid="resultado-validacion-rechazado"
      className={`bg-red-50/70 border border-fitzone-red/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 animate-slide-up ${className}`}
    >
      {/* Banner de rechazo */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-fitzone-red/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-fitzone-red text-white flex items-center justify-center shadow-md shrink-0">
            <XCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-fitzone-red block">
              MOLINETE BLOQUEADO · ACCESO DENEGADO
            </span>
            <h3 className="text-xl font-black text-fitzone-navy font-outfit">
              {detalleMotivo.titulo}
            </h3>
            {motivoRechazo && (
              <span
                data-testid="resultado-validacion-motivo"
                className="text-[11px] font-mono font-bold text-fitzone-red mt-0.5 block"
              >
                Motivo: {motivoRechazo}
              </span>
            )}
          </div>
        </div>

        {onLimpiar && (
          <button
            type="button"
            onClick={onLimpiar}
            aria-label="Cerrar resultado"
            className="p-1 rounded-lg text-fitzone-red hover:bg-red-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Explicación y Sugerencia */}
      <div className="p-4 rounded-2xl bg-white/80 border border-fitzone-red/15 space-y-2 text-xs">
        <div className="flex items-start gap-2 text-slate-700">
          <ShieldAlert className="w-4 h-4 text-fitzone-red shrink-0 mt-0.5" />
          <p className="leading-relaxed">{detalleMotivo.descripcion}</p>
        </div>
        <p className="text-[11px] font-bold text-fitzone-red pl-6">
          Acción recomendada: {detalleMotivo.sugerencia}
        </p>
      </div>

      {/* Si viene con usuario asociado al pase, mostramos quién es para el recepcionista */}
      {usuario && (
        <div className="space-y-1.5 opacity-90">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            SOCIO ASOCIADO AL PASE
          </span>
          <UsuarioPerfilHeader
            usuario={usuario}
            compact
            className="border-fitzone-red/20 shadow-none bg-white/70"
          />
        </div>
      )}
    </div>
  );
}
