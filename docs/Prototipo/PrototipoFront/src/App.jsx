import React from 'react';
import { useApp, ROLES } from './context/AppContext';

// Layout
import { RoleSwitcher } from './components/layout/RoleSwitcher';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { ToastContainer } from './components/ui/ToastContainer';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Socio Pages
import { SocioHomePage } from './pages/socio/SocioHomePage';
import { SocioAccessQRPage } from './pages/socio/SocioAccessQRPage';
import { SocioClassesAgendaPage } from './pages/socio/SocioClassesAgendaPage';
import { SocioClassDetailPage } from './pages/socio/SocioClassDetailPage';
import { SocioWaitlistPage } from './pages/socio/SocioWaitlistPage';
import { SocioCourtsGridPage } from './pages/socio/SocioCourtsGridPage';
import { SocioMyReservationsPage } from './pages/socio/SocioMyReservationsPage';
import { SocioProfilePage } from './pages/socio/SocioProfilePage';
import { SocioHistoryPage } from './pages/socio/SocioHistoryPage';
import { SocioSedesPage } from './pages/socio/SocioSedesPage';

// Externo Pages
import { ExternoHomePage } from './pages/externo/ExternoHomePage';
import { ExternoProfilePage } from './pages/externo/ExternoProfilePage';

// Checkout & Voucher Pages
import { CourtConfirmPage } from './pages/checkout/CourtConfirmPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { VoucherPage } from './pages/checkout/VoucherPage';

// Recepción Pages
import { RecepcionDashboardPage } from './pages/recepcion/RecepcionDashboardPage';
import { RecepcionAccessValidationPage } from './pages/recepcion/RecepcionAccessValidationPage';
import { RecepcionAforoDashboardPage } from './pages/recepcion/RecepcionAforoDashboardPage';
import { RecepcionAgendaPage } from './pages/recepcion/RecepcionAgendaPage';
import { RecepcionAttendancePage } from './pages/recepcion/RecepcionAttendancePage';
import { RecepcionCourtsManagementPage } from './pages/recepcion/RecepcionCourtsManagementPage';
import { RecepcionCashRegisterPage } from './pages/recepcion/RecepcionCashRegisterPage';

// Gerente Central Pages
import { GerenteDashboardPage } from './pages/gerente/GerenteDashboardPage';

// More Options Page
import { MoreOptionsPage } from './pages/MoreOptionsPage';

// UI Kit Playground Page
import { PlaygroundPage } from './pages/PlaygroundPage';

export default function App() {
  const { currentRoute, currentRole } = useApp();

  // Standalone Auth Screens (No sidebar / navbar)
  if (currentRoute === 'login') {
    return (
      <div className="min-h-screen bg-[#1B2A55] flex flex-col justify-between">
        <RoleSwitcher />
        <LoginPage />
        <ToastContainer />
      </div>
    );
  }

  if (currentRoute === 'register') {
    return (
      <div className="min-h-screen bg-[#1B2A55] flex flex-col justify-between">
        <RoleSwitcher />
        <RegisterPage />
        <ToastContainer />
      </div>
    );
  }

  // Dynamic Route Resolver
  const renderCurrentView = () => {
    // Universal routes accessible from all roles
    if (currentRoute === 'playground') {
      return <PlaygroundPage />;
    }
    // Reception Views
    if (currentRole === ROLES.RECEPCION) {
      switch (currentRoute) {
        case 'recepcion-dashboard':
          return <RecepcionDashboardPage />;
        case 'recepcion-scanner':
          return <RecepcionAccessValidationPage />;
        case 'recepcion-aforo':
          return <RecepcionAforoDashboardPage />;
        case 'recepcion-agenda':
          return <RecepcionAgendaPage />;
        case 'recepcion-attendance':
          return <RecepcionAttendancePage />;
        case 'recepcion-courts':
          return <RecepcionCourtsManagementPage />;
        case 'recepcion-cash':
          return <RecepcionCashRegisterPage />;
        case 'sedes':
          return <SocioSedesPage />;
        case 'profile':
          return <RecepcionDashboardPage />;
        case 'more':
          return <MoreOptionsPage />;
        default:
          return <RecepcionDashboardPage />;
      }
    }

    // Gerente Central Views
    if (currentRole === ROLES.GERENTE_CENTRAL) {
      switch (currentRoute) {
        case 'gerente-dashboard':
        case 'gerente-reportes':
        case 'gerente-reportes-pdf':
        case 'gerente-parametros':
          return <GerenteDashboardPage />;
        case 'sedes':
          return <SocioSedesPage />;
        case 'profile':
          return <GerenteDashboardPage />;
        case 'more':
          return <MoreOptionsPage />;
        default:
          return <GerenteDashboardPage />;
      }
    }

    // Cliente Externo Views
    if (currentRole === ROLES.EXTERNO) {
      switch (currentRoute) {
        case 'home':
          return <ExternoHomePage />;
        case 'courts':
          return <SocioCourtsGridPage isExterno={true} />;
        case 'court-confirm':
          return <CourtConfirmPage />;
        case 'checkout':
          return <CheckoutPage />;
        case 'voucher':
          return <VoucherPage />;
        case 'reservations':
          return <SocioMyReservationsPage />;
        case 'sedes':
          return <SocioSedesPage />;
        case 'profile':
          return <ExternoProfilePage />;
        case 'more':
          return <MoreOptionsPage />;
        default:
          return <ExternoHomePage />;
      }
    }

    // Socio Activo / Socio Vencido Views
    switch (currentRoute) {
      case 'home':
        return <SocioHomePage />;
      case 'classes':
        return <SocioClassesAgendaPage />;
      case 'class-detail':
        return <SocioClassDetailPage />;
      case 'waitlist':
        return <SocioWaitlistPage />;
      case 'courts':
        return <SocioCourtsGridPage isExterno={false} />;
      case 'court-confirm':
        return <CourtConfirmPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'voucher':
        return <VoucherPage />;
      case 'reservations':
        return <SocioMyReservationsPage />;
      case 'history':
        return <SocioHistoryPage />;
      case 'sedes':
        return <SocioSedesPage />;
      case 'qr':
        return <SocioAccessQRPage />;
      case 'profile':
        return <SocioProfilePage />;
      case 'more':
        return <MoreOptionsPage />;
      default:
        return <SocioHomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#F26D6D] selection:text-white">
      {/* Top Interactive Role & Screen Switcher Bar */}
      <RoleSwitcher />

      {/* Main Navigation Bar */}
      <Navbar />

      {/* Body Area with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
}
