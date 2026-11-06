/**
 * AppLayout.tsx — Layout principal de la aplicación.
 *
 * Envuelve todas las páginas del panel de gestión.
 * Composición: Header (arriba) + Sidebar (izquierda) + <Outlet /> (contenido dinámico).
 *
 * ¿Qué es <Outlet />?
 * En react-router-dom, cuando tenés rutas anidadas (una ruta hija dentro de otra),
 * el `<Outlet />` marca el lugar donde se renderiza el componente de la ruta hija.
 * Es como un "slot" o un placeholder que el router rellena con la pantalla correspondiente.
 *
 * Estructura visual:
 * ┌──────────────────────────────────┐
 * │           Header                 │
 * ├──────────┬───────────────────────┤
 * │ Sidebar  │  <Outlet />           │
 * │ (fijo)   │  (cambia por ruta)    │
 * └──────────┴───────────────────────┘
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/ToastContainer';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-fitzone-gray-50 flex flex-col font-manrope text-slate-900">
      {/* Header pegado al top */}
      <Header
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Cuerpo: Sidebar fijo a la izquierda (o drawer en móvil) + contenido de la ruta actual */}
      <div className="flex flex-1">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Área de contenido principal — aquí se "intercalan" las páginas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Las notificaciones toast flotan sobre todo el layout */}
      <ToastContainer />
    </div>
  );
}
