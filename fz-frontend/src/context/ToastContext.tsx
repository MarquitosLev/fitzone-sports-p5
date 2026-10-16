import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastType } from '../components/ui/Toast';

/**
 * Estructura de un toast (notificación emergente).
 * `id` es único para poder eliminarlo individualmente.
 */
interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message?: string;
}

/**
 * Lo que expone el contexto hacia los componentes hijos.
 * `addToast`: dispara una notificación.
 * `removeToast`: cierra una notificación por su id.
 */
interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

// El contexto arranca como null: si intentás usarlo fuera del Provider, te avisa.
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook para usar el contexto desde cualquier componente hijo.
 * Equivalente a llamar a un @Service en Java desde un @Controller.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}

/**
 * Provider que envuelve la app y pone los toasts disponibles globalmente.
 * Se coloca en App.tsx para que todos los componentes puedan disparar notificaciones.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // useCallback evita recrear la función en cada render, lo cual es importante
  // cuando se pasa como dependencia o prop a componentes hijos.
  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    // Generamos un ID único basado en la fecha + número aleatorio
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-dismiss: el toast desaparece solo después de 5 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}
