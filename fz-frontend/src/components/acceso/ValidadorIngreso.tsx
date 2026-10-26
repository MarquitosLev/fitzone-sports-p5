import React, { useState } from 'react';
import { QrCode, ScanLine, Keyboard, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { USE_MOCK } from '../../config';

export interface ValidadorIngresoProps {
  onValidar: (token: string) => Promise<void> | void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

interface TokenPrueba {
  label: string;
  token: string;
  tipo: 'ok' | 'error';
  descripcion: string;
}

const TOKENS_PRUEBA: TokenPrueba[] = [
  {
    label: 'Pase Válido',
    token: 'TEST-OK-30123456',
    tipo: 'ok',
    descripcion: 'Socio activo con cuota al día',
  },
  {
    label: 'QR Vencido',
    token: 'TEST-QR-VENCIDO',
    tipo: 'error',
    descripcion: 'Token con más de 5 minutos',
  },
  {
    label: 'Membresía Inactiva',
    token: 'TEST-MEMBRESIA-INACTIVA',
    tipo: 'error',
    descripcion: 'Cuota impaga o suspendida',
  },
  {
    label: 'Ya Ingresado (RN-01)',
    token: 'TEST-YA-INGRESADO',
    tipo: 'error',
    descripcion: 'Posee acceso activo sin egreso',
  },
  {
    label: 'Aforo Completo (RF-05)',
    token: 'TEST-AFORO-COMPLETO',
    tipo: 'error',
    descripcion: 'Sede al máximo de capacidad',
  },
];

/**
 * Componente interactivo para escanear o tipear el token QR del socio (RF-04).
 * En modo desarrollo/mock incluye accesos rápidos a los 4 motivos de rechazo y pase válido.
 */
export function ValidadorIngreso({
  onValidar,
  loading = false,
  disabled = false,
  className = '',
}: ValidadorIngresoProps) {
  const [tokenInput, setTokenInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || loading || disabled) return;
    void onValidar(tokenInput.trim());
  };

  const handleSeleccionarTokenPrueba = (token: string) => {
    setTokenInput(token);
    void onValidar(token);
  };

  return (
    <div
      data-testid="validador-ingreso-card"
      className={`bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-fitzone-navy text-white flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5 text-fitzone-coral" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              MOLINETE DE ENTRADA
            </span>
            <h3 className="text-base font-black text-fitzone-navy font-outfit">
              Validar Acceso de Socio
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
          <QrCode className="w-3.5 h-3.5 text-fitzone-navy" />
          <span>Lector Activo</span>
        </div>
      </div>

      {/* Formulario de ingreso de Token */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <TextField
            id="input-token-acceso"
            label="Código o Token del Pase QR"
            placeholder="Pegá o escaneá el token (ej. FZ-QR-8910 o DNI)"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            disabled={disabled || loading}
            leftIcon={<Keyboard className="w-4 h-4 text-slate-400" />}
          />
          <p className="text-[11px] text-slate-400">
            Al leer el código de barras o QR físico, el lector inyecta el token automáticamente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            id="btn-validar-acceso"
            type="submit"
            variant="coral"
            size="md"
            className="w-full sm:w-auto"
            isLoading={loading}
            disabled={disabled || !tokenInput.trim()}
            leftIcon={<ScanLine className="w-4 h-4" />}
          >
            Validar Ingreso
          </Button>

          {tokenInput && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTokenInput('')}
              disabled={loading}
            >
              Limpiar
            </Button>
          )}
        </div>
      </form>

      {/* Simulador de Pruebas Rápidas (Dev / Mock) */}
      {USE_MOCK && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-fitzone-gold" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Casos de Prueba con 1 Clic (Desarrollo / Mock)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TOKENS_PRUEBA.map((item) => (
              <button
                key={item.token}
                type="button"
                onClick={() => handleSeleccionarTokenPrueba(item.token)}
                disabled={disabled || loading}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 text-xs ${
                  item.tipo === 'ok'
                    ? 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900'
                    : 'bg-red-50/50 hover:bg-red-100/60 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full font-bold">
                  <span className="truncate">{item.label}</span>
                  {item.tipo === 'ok' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-fitzone-red shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 line-clamp-1">{item.descripcion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
