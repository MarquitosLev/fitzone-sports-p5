import { Check, Star, Zap } from 'lucide-react';
import { Card, Button } from '../ui';
import type { PlanDTO } from '../../types';
import { formatearMonto } from '../../utils/formatters';

export interface PlanCardProps {
  plan: PlanDTO;
  /** Callback al hacer clic en el botón de acción */
  onSeleccionar?: (plan: PlanDTO) => void;
  /** Bandera explícita para destacar visualmente el plan */
  destacado?: boolean;
  /** Si la tarjeta se encuentra actualmente seleccionada */
  selected?: boolean;
  /** Deshabilita la interacción */
  disabled?: boolean;
  /** Etiqueta personalizada del botón de acción */
  actionLabel?: string;
  /** Permite ocultar el botón si solo se usa como vista */
  showAction?: boolean;
  className?: string;
}

/**
 * PlanCard — Tarjeta de presentación de plan de membresía (RF-02).
 * Muestra nombre, precio formateado, duración, beneficios y acción configurable.
 */
export function PlanCard({
  plan,
  onSeleccionar,
  destacado,
  selected = false,
  disabled = false,
  actionLabel,
  showAction = true,
  className = '',
}: PlanCardProps) {
  const isDestacado = destacado !== undefined ? destacado : Boolean(plan.destacado);
  const duracionMeses = plan.duracionMeses ?? (plan.nombre.toLowerCase().includes('trimestral') ? 3 : plan.nombre.toLowerCase().includes('anual') ? 12 : 1);

  // Formatear duración en texto amigable
  const textoDuracion =
    duracionMeses === 1
      ? '1 mes de acceso'
      : duracionMeses === 12
      ? '1 año de acceso (12 meses)'
      : `${duracionMeses} meses de acceso`;

  // Equivalente por mes para planes multi-mes
  const precioMensualEquivalente = duracionMeses > 1 ? Math.round(plan.precioBase / duracionMeses) : null;

  return (
    <Card
      variant={isDestacado ? 'default' : 'flat'}
      className={`
        relative flex flex-col justify-between transition-all duration-200 overflow-hidden
        ${isDestacado ? 'border-2 border-fitzone-coral/60 shadow-lg hover:shadow-xl' : 'border border-slate-200 hover:border-slate-300 shadow-sm'}
        ${selected ? 'ring-2 ring-fitzone-navy border-fitzone-navy' : ''}
        ${className}
      `}
    >
      {/* Badge de destacado en la parte superior */}
      {isDestacado && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-fitzone-coral to-[#ff8585] text-white text-[11px] font-black uppercase tracking-wider py-1 px-3 rounded-bl-xl shadow-xs flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" />
            <span>Más Elegido</span>
          </div>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Cabecera del Plan */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDestacado ? 'bg-fitzone-coral/10 text-fitzone-coral' : 'bg-slate-100 text-fitzone-navy'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-black text-fitzone-navy font-outfit tracking-tight">
              {plan.nombre}
            </h3>
          </div>

          <p className="text-xs text-slate-500 font-medium min-h-[32px] line-clamp-2">
            {plan.descripcion || 'Acceso completo a instalaciones y servicios de la red FitZone Sports.'}
          </p>
        </div>

        {/* Precio y Duración */}
        <div className="my-5 py-4 border-y border-slate-100/80">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-fitzone-navy font-outfit tracking-tight">
              {formatearMonto(plan.precioBase)}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              / {duracionMeses === 1 ? 'mes' : `${duracionMeses} meses`}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">{textoDuracion}</span>
            {precioMensualEquivalente && (
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Equiv. {formatearMonto(precioMensualEquivalente)}/mes
              </span>
            )}
          </div>
        </div>

        {/* Lista de Beneficios */}
        {plan.beneficios && plan.beneficios.length > 0 && (
          <div className="space-y-2.5 flex-1 mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Beneficios incluidos:
            </span>
            <ul className="space-y-2">
              {plan.beneficios.map((beneficio, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                  <div className={`rounded-full p-0.5 mt-0.5 shrink-0 ${isDestacado ? 'bg-fitzone-coral/15 text-fitzone-coral' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón de acción */}
        {showAction && (
          <div className="mt-auto pt-2">
            <Button
              type="button"
              variant={isDestacado ? 'coral' : 'primary'}
              fullWidth
              size="md"
              disabled={disabled}
              onClick={() => onSeleccionar?.(plan)}
              className="font-bold shadow-xs cursor-pointer"
            >
              {actionLabel || (selected ? 'Plan Seleccionado' : 'Elegir Plan')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
