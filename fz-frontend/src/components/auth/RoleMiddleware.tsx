import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui';
import type { TipoUsuario } from '../../types';

export interface RoleMiddlewareProps {
  /** Lista de roles permitidos para acceder a este subárbol de rutas. Si no se indica, solo exige autenticación. */
  allowedRoles?: TipoUsuario[];
}

/**
 * RoleMiddleware — Middleware de enrutamiento basado en Layout Route (Outlet).
 * Intercepta el subárbol de rutas sin tener que envolver cada página individualmente.
 */
export function RoleMiddleware({ allowedRoles }: RoleMiddlewareProps) {
  const { usuario, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" color="navy" label="Verificando sesión..." />
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(usuario.tipoUsuario)) {
    return <Navigate to={`/rol/${usuario.tipoUsuario.toLowerCase()}`} replace />;
  }

  return <Outlet />;
}
