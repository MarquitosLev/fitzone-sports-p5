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
import { AppProvider } from './context/AppContext';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { MembresiasPage } from './pages/MembresiasPage';
import { AccesoPage } from './pages/AccesoPage';
import { ClasesPage } from './pages/ClasesPage';
import { CanchasPage } from './pages/CanchasPage';
import { PagosPage } from './pages/PagosPage';
import { httpClient, registerHttpErrorHandler } from './services/httpClient';
import { Spinner } from './components/ui';
import { USE_MOCK } from './config';
import type { SedeDTO } from './types';
import './App.css';

// Sedes mock para el SedeProvider (usadas únicamente cuando USE_MOCK === true)
const SEDES_MOCK: SedeDTO[] = [
  { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
  { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
  { idSede: 3, nombre: 'FitZone Caballito', aforoMaximo: 50 },
];

/**
 * Componente interno que conecta el httpClient con el ToastContext.
 * Tiene que estar DENTRO del ToastProvider para poder usar el hook useToast.
 */
function HttpErrorConnector({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();

  useEffect(() => {
    // Registramos el callback UNA SOLA VEZ al montar la app.
    // Ahora el httpClient puede disparar toasts sin saber nada de React.
    registerHttpErrorHandler((message) => {
      addToast({ type: 'error', title: 'Error de servidor', message });
    });
  }, [addToast]);

  return <>{children}</>;
}

export default function App() {
  const [sedes, setSedes] = useState<SedeDTO[] | null>(USE_MOCK ? SEDES_MOCK : null);
  const [loading, setLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (!USE_MOCK) {
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
    }
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
          {/* SedeProvider: la sede activa está disponible en toda la app */}
          <SedeProvider sedes={USE_MOCK ? SEDES_MOCK : (sedes ?? [])}>
            <Routes>
              {/* 
                AppLayout actúa como "layout raíz":
                todas las rutas dentro de él comparten Header + Sidebar.
                Las rutas hijas se renderizan en el <Outlet /> de AppLayout.
              */}
              <Route path="/" element={<AppLayout />}>
                {/* Ruta índice: redirige / → /usuarios automáticamente */}
                <Route index element={<Navigate to="/usuarios" replace />} />
                <Route path="usuarios" element={<UsuariosPage />} />
                <Route path="membresias" element={<MembresiasPage />} />
                <Route path="acceso" element={<AccesoPage />} />
                <Route path="clases" element={<ClasesPage />} />
                <Route path="canchas" element={<CanchasPage />} />
                <Route path="pagos" element={<PagosPage />} />
              </Route>

              {/* Playground fuera del AppLayout (sin Sidebar ni Header) */}
              <Route
                path="/playground"
                element={
                  <AppProvider>
                    <PlaygroundPage />
                  </AppProvider>
                }
              />
            </Routes>
          </SedeProvider>
        </HttpErrorConnector>
      </ToastProvider>
    </BrowserRouter>
  );
}
