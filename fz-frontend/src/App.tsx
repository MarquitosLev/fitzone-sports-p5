/**
 * App.tsx — Punto de entrada de la aplicación FitZone Sports.
 *
 * ¿Qué hace este archivo?
 *   1. Monta los providers globales (en capas, de afuera hacia adentro):
 *      BrowserRouter → ToastProvider → SedeProvider → rutas
 *   2. Configura el router con react-router-dom
 *   3. Registra el interceptor de errores HTTP con el ToastContext
 *
 * Nota sobre el orden de providers:
 *   Los providers en React son como decoradores en Java Spring.
 *   Cada uno "envuelve" al siguiente. El que está más afuera
 *   puede ser usado por todos los que están adentro.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import { SedeProvider } from './context/SedeContext';
import { AppLayout } from './components/layout/AppLayout';
import { INICIO_POR_ROL } from './components/layout/navegacion';
import { UsuariosPage } from './pages/UsuariosPage';
import { MembresiasPage } from './pages/MembresiasPage';
import { AccesoPage } from './pages/AccesoPage';
import { ClasesPage } from './pages/ClasesPage';
import { CanchasPage } from './pages/CanchasPage';
import { CheckoutInvitadoPage } from './pages/CheckoutInvitadoPage';
import { PagosPage } from './pages/PagosPage';
import { LoginPage } from './pages/LoginPage';
import { RegistroPage } from './pages/RegistroPage';
import { RolesPage } from './pages/RolesPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoleMiddleware } from './components/auth';
import { httpClient, registerHttpErrorHandler } from './services/httpClient';
import { Spinner } from './components/ui';
import type { SedeDTO } from './types';
import './App.css';

/**
 * Componente interno que conecta el httpClient con el ToastContext.
 * Tiene que estar DENTRO del ToastProvider para poder usar el hook useToast.
 */
function HttpErrorConnector({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();

  useEffect(() => {
    // Registramos el callback UNA SOLA VEZ al montar la app.
    // Ahora el httpClient puede disparar toasts sin saber nada de React.
    registerHttpErrorHandler((message, status) => {
      if (status === 403) {
        // Sesión válida pero sin permiso: aviso, sin romper la pantalla (SCRUM-92)
        addToast({ type: 'warning', title: 'Sin permiso', message });
        return;
      }
      if (status === 404) {
        // Recurso no encontrado: lo maneja cada servicio o pantalla según su flujo de negocio (SCRUM-125)
        return;
      }
      addToast({ type: 'error', title: 'Error de servidor', message });
    });
  }, [addToast]);

  return <>{children}</>;
}

/**
 * Inicio según el rol (SCRUM-92). Visitantes sin sesión y roles sin inicio propio
 * van al catálogo público de canchas.
 */
function IndexRedirect() {
  const { usuario } = useAuth();
  const destino = usuario ? INICIO_POR_ROL[usuario.tipoUsuario] : undefined;
  return <Navigate to={destino ?? '/canchas'} replace />;
}

export default function App() {
  const [sedes, setSedes] = useState<SedeDTO[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    httpClient
      .get<SedeDTO[]>('/v1/sedes')
      .then((data) => {
        if (isMounted) {
          setSedes(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error('Error cargando sedes', err);
        if (isMounted) {
          setSedes([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" color="navy" label="Cargando sedes..." />
      </div>
    );
  }

  return (
    // BrowserRouter habilita la navegación basada en URL (History API del navegador)
    <BrowserRouter>
      {/* ToastProvider: las notificaciones están disponibles en toda la app */}
      <ToastProvider>
        <HttpErrorConnector>
          {/* AuthProvider: mantiene la sesión del usuario en toda la app (SCRUM-89) */}
          <AuthProvider>
            {/* SedeProvider: la sede activa está disponible en toda la app */}
            <SedeProvider sedes={sedes ?? []}>
              <Routes>
                {/* Rutas de autenticación a pantalla completa (fuera de AppLayout) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegistroPage />} />

                {/* 
                  AppLayout actúa como "layout raíz":
                  todas las rutas dentro de él comparten Header + Sidebar.
                  Las rutas hijas se renderizan en el <Outlet /> de AppLayout.
                */}
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<IndexRedirect />} />
                  {/* Catálogo público: ver canchas y disponibilidad no exige sesión (SCRUM-91) */}
                  <Route path="canchas" element={<CanchasPage />} />
                  <Route path="reserva-invitado/:codigo" element={<CheckoutInvitadoPage />} />

                  {/* Clases: la agenda exige sesión de SOCIO, RECEPCIONISTA o GERENTE (M3) */}
                  <Route element={<RoleMiddleware prestacionRequerida="CLASES_VER" />}>
                    <Route path="clases" element={<ClasesPage />} />
                  </Route>

                  {/* Mi Pase QR (Socio) */}
                  <Route element={<RoleMiddleware prestacionRequerida="ACCESO_MI_QR" />}>
                    <Route path="mi-qr" element={<AccesoPage />} />
                  </Route>

                  {/* Control Acceso y Aforo (Recepción / Gerencia) */}
                  <Route element={<RoleMiddleware prestacionRequerida="ACCESO_AFORO_VIEW" />}>
                    <Route path="acceso" element={<AccesoPage />} />
                  </Route>

                  {/* Historial de Pagos */}
                  <Route element={<RoleMiddleware prestacionRequerida="PAGOS_VER_HISTORIAL" />}>
                    <Route path="pagos" element={<PagosPage />} />
                  </Route>

                  {/* Subárbol protegido para personal administrativo */}
                  <Route element={<RoleMiddleware prestacionRequerida="USUARIOS_ADMIN" />}>
                    <Route path="usuarios" element={<UsuariosPage />} />
                    <Route path="membresias" element={<MembresiasPage />} />
                  </Route>

                  {/* Panel exclusivo de Gerencia para control de roles y accesos (SCRUM-107) */}
                  <Route element={<RoleMiddleware prestacionRequerida="ROLES_GESTIONAR" />}>
                    <Route path="admin/roles" element={<RolesPage />} />
                  </Route>

                  {/* Cualquier otra ruta (incluidas las viejas /rol/*) vuelve al inicio del rol */}
                  <Route path="*" element={<IndexRedirect />} />
                </Route>

              </Routes>
            </SedeProvider>
          </AuthProvider>
        </HttpErrorConnector>
      </ToastProvider>
    </BrowserRouter>
  );
}
