/**
 * DesglosePrecio.tsx — Componente de desglose de precios de reserva (RF-11, SCRUM-73).
 *
 * Muestra:
 * - Precio base de la cancha.
 * - Recargo por horario pico (+20%, 19:00 a 21:00 hs).
 * - Descuento por socio activo (-15%).
 * - Total a pagar con monto original tachado si aplica descuento.
 *
 * Reutilizable tanto en la pantalla de reserva de turno como en el checkout de pago (M5).
 */

import { Info, Tag, Sparkles } from 'lucide-react';
import type { CotizacionReservaDTO } from '../../types';
import { formatearMonto } from '../../utils/formatters';

export interface DesglosePrecioProps {
  /** Cotización completa o valores individuales */
  cotizacion?: CotizacionReservaDTO;
  precioBase?: number;
  esPico?: boolean;
  recargoPico?: number;
  porcentajeRecargoPico?: number;
  descuentoSocio?: number;
  porcentajeDescuentoSocio?: number;
  esSocio?: boolean;
  total?: number;
  /** Variante visual: 'card' (con fondo y borde) o 'plain' (sin tarjeta externa) */
  variant?: 'card' | 'plain';
  /** Muestra u oculta la nota explicativa */
  mostrarExplicacion?: boolean;
  titulo?: string;
  className?: string;
}

export function DesglosePrecio({
  cotizacion,
  precioBase: propPrecioBase,
  esPico: propEsPico,
  recargoPico: propRecargoPico,
  porcentajeRecargoPico: propPorcentajeRecargoPico = 20,
  descuentoSocio: propDescuentoSocio,
  porcentajeDescuentoSocio: propPorcentajeDescuentoSocio = 15,
  esSocio: propEsSocio,
  total: propTotal,
  variant = 'card',
  mostrarExplicacion = true,
  titulo = 'Resumen del precio',
  className = '',
}: DesglosePrecioProps) {
  // Unifica valores desde cotizacion o props
  const precioBase = cotizacion?.precioBase ?? propPrecioBase ?? 0;
  const esPico = cotizacion?.esPico ?? propEsPico ?? false;
  const recargoPico =
    cotizacion?.recargoPico ??
    propRecargoPico ??
    (esPico ? Math.round(precioBase * (propPorcentajeRecargoPico / 100)) : 0);
  const esSocio = cotizacion?.esSocio ?? propEsSocio ?? false;

  const subtotal = precioBase + recargoPico;
  const descuentoSocio =
    cotizacion?.descuentoSocio ??
    propDescuentoSocio ??
    (esSocio ? Math.round(subtotal * (propPorcentajeDescuentoSocio / 100)) : 0);

  const total = cotizacion?.total ?? propTotal ?? subtotal - descuentoSocio;

  const containerClasses =
    variant === 'card'
      ? 'p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-100 shadow-xs'
      : '';

  return (
    <div className={`space-y-3.5 ${containerClasses} ${className}`}>
      {titulo && (
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-fitzone-navy" />
            <h3 className="text-xs font-black text-fitzone-navy uppercase tracking-wider font-outfit">
              {titulo}
            </h3>
          </div>
          {esSocio && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#2E9E5B] bg-[#EAF7EE] px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3 text-[#2E9E5B]" />
              Beneficio socio
            </span>
          )}
        </div>
      )}

      {/* Filas de desglose */}
      <div className="space-y-2.5 text-xs">
        {/* Precio base */}
        <div className="flex items-center justify-between text-slate-600">
          <span className="font-medium">Tarifa base · 1 hora</span>
          <span className="font-extrabold text-[#1B2A55] font-outfit">
            {formatearMonto(precioBase)}
          </span>
        </div>

        {/* Recargo franja pico (+20%) */}
        {esPico && recargoPico > 0 && (
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 font-medium text-fitzone-coral">
              <span>Horario pico (19 a 21 hs) · +{propPorcentajeRecargoPico}%</span>
            </span>
            <span className="font-extrabold text-fitzone-coral font-outfit">
              {`+${formatearMonto(recargoPico)}`}
            </span>
          </div>
        )}

        {/* Descuento Socio Activo (-15%) */}
        {esSocio && descuentoSocio > 0 && (
          <div className="flex items-center justify-between text-[#2E9E5B] font-bold">
            <span className="flex items-center gap-1.5">
              <span>Descuento socio activo · −{propPorcentajeDescuentoSocio}%</span>
            </span>
            <span className="font-black font-outfit">
              {`−${formatearMonto(descuentoSocio)}`}
            </span>
          </div>
        )}

        {/* Subtotal / Total a pagar */}
        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-sm sm:text-base font-black text-[#1B2A55]">
          <span>Total final</span>
          <div className="flex items-baseline gap-2">
            {esSocio && descuentoSocio > 0 && (
              <span className="text-xs sm:text-sm font-bold text-slate-400 line-through font-outfit">
                {formatearMonto(subtotal)}
              </span>
            )}
            <span className="text-xl sm:text-2xl font-black text-[#1B2A55] font-outfit">
              {formatearMonto(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Nota Explicativa */}
      {mostrarExplicacion && (
        <div className="pt-2 text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            {esSocio
              ? `El beneficio del 15% para socios se aplica sobre la tarifa calculada (${formatearMonto(subtotal)}).`
              : 'Socios con cuota al día obtienen 15% de descuento adicional en todas las reservas.'}
          </span>
        </div>
      )}
    </div>
  );
}
