import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToastOpcional } from '../../context/ToastContext';
import { Spinner } from '../ui';
import { usePrestacionesUsuario } from '../../hooks/usePrestaciones';
import { evaluarAccesoRuta } from './accesoRuta';
import type { TipoUsuario, Prestacion } from '../../types';

/** Mensaje del aviso que se muestra al redirigir a alguien que entró por URL a una ruta de otro rol. */
export const MENSAJE_RUTA_SIN_PERMISO = 'Esa sección no está disponible para tu rol. Te llevamos a tu inicio.';

export interface RoleMiddlewareProps {
  /** Lista de roles permitidos para acceder a este subárbol de rutas. Si no se indica, solo exige autenticación. */
  allowedRoles?: TipoUsuario[];
  /** Prestación específica requerida para acceder al subárbol de rutas (SCRUM-106 / SCRUM-107). */
  prestacionRequerida?: Prestacion;
}

/**
 * Redirige al inicio del rol (`/`, que IndexRedirect resuelve con INICIO_POR_ROL)
 * y avisa con un toast. El toast va en un efecto para no disparar side effects en el render.
 */
function RedireccionSinPermiso() {
  const toast = useToastOpcional();
  const addToast = toast?.addToast;
  const notificadoRef = useRef(false);

  useEffect(() => {
    if (notificadoRef.current) return;
    notificadoRef.current = true;
    addToast?.({ type: 'warning', title: 'Sin permiso', message: MENSAJE_RUTA_SIN_PERMISO });
  }, [addToast]);

  return <Navigate to="/" replace />;
}

/**
 * RoleMiddleware — "RutaProtegida" de SCRUM-92. Middleware de enrutamiento basado en
 * Layout Route (Outlet): intercepta el subárbol de rutas sin envolver cada página.
 *
 * - Sin sesión → /login?returnTo=<ruta pedida>.
 * - Con sesión pero sin el rol (`allowedRoles`) o la prestación (`prestacionRequerida`)
 *   → redirige al inicio de su rol y muestra un aviso "sin permiso".
 * - Con permiso → renderiza las rutas hijas.
 *
 * Uso en App.tsx:
 *   <Route element={<RoleMiddleware allowedRoles={['GERENTE']} />}>
 *     <Route path="admin/roles" element={<RolesPage />} />
 *   </Route>
 */
export function RoleMiddleware({ allowedRoles, prestacionRequerida }: RoleMiddlewareProps) {
  const { usuario, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const prestacionesUsuario = usePrestacionesUsuario();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" color="navy" label="Verificando sesión..." />
      </div>
    );
  }

  const resultado = evaluarAccesoRuta({
    tipoUsuario: isAuthenticated && usuario ? usuario.tipoUsuario : null,
    prestacionesUsuario,
    allowedRoles,
    prestacionRequerida,
  });

  if (resultado === 'REQUIERE_LOGIN') {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnUrl}`} state={{ from: location }} replace />;
  }

  if (resultado === 'SIN_PERMISO') {
    return <RedireccionSinPermiso />;
  }

  return <Outlet />;
}

