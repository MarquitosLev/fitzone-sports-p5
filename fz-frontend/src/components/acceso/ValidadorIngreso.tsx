import React, { useState } from 'react';
import { QrCode, ScanLine, Keyboard } from 'lucide-react';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';

export interface ValidadorIngresoProps {
  onValidar: (token: string) => Promise<void> | void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente interactivo para escanear o tipear el token QR del socio (RF-04).
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
            placeholder="Ingresá el código QR o DNI del socio"
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
    </div>
  );
}
