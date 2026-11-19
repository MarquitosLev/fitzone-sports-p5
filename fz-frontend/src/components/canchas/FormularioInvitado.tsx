import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, CreditCard, Timer } from 'lucide-react';
import { TextField, Button, Alert } from '../ui';
import type { DatosInvitado } from '../../types';

export interface FormularioInvitadoProps {
  onSubmit: (datos: DatosInvitado) => void | Promise<void>;
  onCancelar: () => void;
  isLoading?: boolean;
  error?: string | null;
  /** Los datos son de una cuenta: se ofrece iniciar sesión en vez de reintentar */
  pedirInicioSesion?: boolean;
  /** Total a cobrar, para el texto del botón */
  montoTotal?: number;
  /** Segundos que quedan de la retención de 5 minutos del turno */
  segundosRestantes?: number;
}

type Errores = Partial<Record<keyof DatosInvitado, string>>;

const LINK_LOGIN = '/login?returnTo=%2Fcanchas';

export function FormularioInvitado({
  onSubmit,
  onCancelar,
  isLoading = false,
  error = null,
  pedirInicioSesion = false,
  montoTotal,
  segundosRestantes,
}: FormularioInvitadoProps) {
  const [datos, setDatos] = useState<DatosInvitado>({ nombre: '', apellido: '', dni: '', email: '' });
  const [errores, setErrores] = useState<Errores>({});

  const cambiar = (campo: keyof DatosInvitado, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const validar = (): boolean => {
    const nuevos: Errores = {};
    if (datos.nombre.trim().length < 2) nuevos.nombre = 'Ingresá tu nombre';
    if (datos.apellido.trim().length < 2) nuevos.apellido = 'Ingresá tu apellido';
    if (!/^\d{7,10}$/.test(datos.dni.replace(/\D/g, ''))) nuevos.dni = 'El DNI debe tener entre 7 y 10 números';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) nuevos.email = 'Ingresá un email válido';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !validar()) return;
    await onSubmit({
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      dni: datos.dni.replace(/\D/g, ''),
      email: datos.email.trim().toLowerCase(),
    });
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <p className="text-xs text-slate-500">
        Reservá sin crear una cuenta: pagás ahora y te damos el <strong>comprobante</strong> con el código para
        presentar en la sede. Tus datos quedan solo en el comprobante.
      </p>

      {segundosRestantes !== undefined && (
        <p
          className="flex items-center gap-2 text-xs font-bold text-fitzone-navy bg-slate-50 rounded-xl px-3 py-2"
          role="timer"
          aria-live="polite"
        >
          <Timer className="w-4 h-4 text-fitzone-coral" />
          Te guardamos el turno {Math.floor(segundosRestantes / 60)}:
          {String(segundosRestantes % 60).padStart(2, '0')} min. Si no pagás, se libera.
        </p>
      )}

      {error && (
        <Alert
          type={pedirInicioSesion ? 'warning' : 'error'}
          message={error}
          action={
            pedirInicioSesion ? (
              <Link to={LINK_LOGIN} className="font-bold underline">
                Iniciar sesión
              </Link>
            ) : undefined
          }
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField id="invitado-nombre" label="Nombre" value={datos.nombre} leftIcon={User}
          onChange={(e) => cambiar('nombre', e.target.value)} error={errores.nombre} disabled={isLoading} />
        <TextField id="invitado-apellido" label="Apellido" value={datos.apellido} leftIcon={User}
          onChange={(e) => cambiar('apellido', e.target.value)} error={errores.apellido} disabled={isLoading} />
        <TextField id="invitado-dni" label="DNI" placeholder="Sin puntos" value={datos.dni} leftIcon={CreditCard}
          onChange={(e) => cambiar('dni', e.target.value)} error={errores.dni} disabled={isLoading} />
        <TextField id="invitado-email" label="Email" type="email" value={datos.email} leftIcon={Mail}
          onChange={(e) => cambiar('email', e.target.value)} error={errores.email} disabled={isLoading} />
      </div>

      <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5">
        <Button type="button" variant="secondary" fullWidth onClick={onCancelar} disabled={isLoading}>
          Volver
        </Button>
        <Button type="submit" variant="coral" fullWidth isLoading={isLoading}>
          {montoTotal !== undefined ? `Pagar $${montoTotal.toLocaleString('es-AR')} y reservar` : 'Pagar y reservar'}
        </Button>
      </div>

      <p className="text-[11px] text-center text-slate-500">
        ¿Sos socio?{' '}
        <Link to={LINK_LOGIN} className="font-bold text-fitzone-coral">
          Iniciá sesión
        </Link>{' '}
        para tu descuento.
      </p>
    </form>
  );
}
