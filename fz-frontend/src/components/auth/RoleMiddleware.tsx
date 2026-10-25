import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui';
import { AccesoDenegado403 } from './AccesoDenegado403';
import { useTienePrestacion } from '../../hooks/usePrestaciones';
import type { TipoUsuario, Prestacion } from '../../types';

export interface RoleMiddlewareProps {
  /** Lista de roles permitidos para acceder a este subárbol de rutas. Si no se indica, solo exige autenticación. */
  allowedRoles?: TipoUsuario[];
  /** Prestación específica requerida para acceder al subárbol de rutas (SCRUM-106 / SCRUM-107). */
  prestacionRequerida?: Prestacion;
}

/**
 * RoleMiddleware — Middleware de enrutamiento basado en Layout Route (Outlet).
 * Intercepta el subárbol de rutas sin tener que envolver cada página individualmente.
 */
export function RoleMiddleware({ allowedRoles, prestacionRequerida }: RoleMiddlewareProps) {
  const { usuario, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const tienePrestacion = useTienePrestacion(prestacionRequerida || 'CANCHAS_VER');

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" color="navy" label="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnUrl}`} state={{ from: location }} replace />;
  }

  // Verificación por Rol estático
  if (allowedRoles && !allowedRoles.includes(usuario.tipoUsuario)) {
    return <AccesoDenegado403 />;
  }

  // Verificación por Prestación atómica
  if (prestacionRequerida && !tienePrestacion) {
    return <AccesoDenegado403 />;
  }

  return <Outlet />;
}

