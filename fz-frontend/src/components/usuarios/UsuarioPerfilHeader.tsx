import React, { useState } from 'react';
import { Mail, Phone, MapPin, Hash, User } from 'lucide-react';
import type { UsuarioDTO } from '../../types';
import { TipoUsuarioBadge } from './TipoUsuarioBadge';

export interface UsuarioPerfilHeaderProps {
  usuario: Pick<UsuarioDTO, 'nombre' | 'apellido' | 'dni' | 'tipoUsuario'> & Partial<UsuarioDTO>;
  sedeNombre?: string;
  actions?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Cabecera de perfil de usuario con avatar/foto, nombre completo, DNI y badge de rol.
 * Diseñado y preparado para reutilizarse en Gestión de Usuarios, Membresías y Mostrador de Recepción.
 */
export function UsuarioPerfilHeader({
  usuario,
  sedeNombre,
  actions,
  compact = false,
  className = '',
}: UsuarioPerfilHeaderProps) {
  const [imageError, setImageError] = useState(false);

  const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario sin nombre';
  const iniciales = `${(usuario.nombre?.[0] || '').toUpperCase()}${(usuario.apellido?.[0] || '').toUpperCase()}` || 'FZ';

  return (
    <div
      className={`
        bg-white rounded-3xl border border-slate-100 shadow-card p-5 sm:p-6
        transition-all duration-200
        ${className}
      `}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Lado izquierdo: Avatar + Información principal */}
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          {/* Avatar con soporte de foto o fallback de iniciales */}
          <div className="relative shrink-0">
            {usuario.fotoUrl && !imageError ? (
              <img
                src={usuario.fotoUrl}
                alt={nombreCompleto}
                onError={() => setImageError(true)}
                className={`
                  rounded-2xl object-cover border-2 border-slate-100 shadow-sm
                  ${compact ? 'w-12 h-12' : 'w-16 h-16 sm:w-20 sm:h-20'}
                `}
              />
            ) : (
              <div
                className={`
                  rounded-2xl bg-gradient-to-br from-fitzone-navy to-fitzone-navy-light text-white
                  flex items-center justify-center font-outfit font-black tracking-tight shadow-sm select-none
                  ${compact ? 'w-12 h-12 text-sm' : 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl'}
                `}
              >
                {iniciales ? (
                  <span>{iniciales}</span>
                ) : (
                  <User className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
                )}
              </div>
            )}

            {/* Micro-indicador de rol en esquina del avatar */}
            <div className="absolute -bottom-1 -right-1 sm:hidden">
              <TipoUsuarioBadge tipoUsuario={usuario.tipoUsuario} size="xs" />
            </div>
          </div>

          {/* Textos y Metadatos */}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={`
                  font-black text-fitzone-navy font-outfit truncate tracking-tight
                  ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'}
                `}
              >
                {nombreCompleto}
              </h2>

              <div className="hidden sm:inline-flex">
                <TipoUsuarioBadge tipoUsuario={usuario.tipoUsuario} size="sm" showDot />
              </div>
            </div>

            {/* DNI y Sede */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1 font-mono font-bold text-fitzone-navy bg-slate-100 px-2.5 py-0.5 rounded-md">
                <Hash className="w-3 h-3 text-slate-400" />
                DNI {usuario.dni || '—'}
              </span>

              {sedeNombre && (
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {sedeNombre}
                </span>
              )}
            </div>

            {/* Datos secundarios (Email & Teléfono) si no es compacto */}
            {!compact && (usuario.email || usuario.telefono) && (
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {usuario.email && (
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{usuario.email}</span>
                  </span>
                )}
                {usuario.telefono && (
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{usuario.telefono}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lado derecho: Acciones contextuales (opcionales) */}
        {actions && (
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
