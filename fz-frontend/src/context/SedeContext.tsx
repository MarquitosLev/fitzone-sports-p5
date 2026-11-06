import React, { createContext, useContext, useState } from 'react';
import type { SedeDTO } from '../types';

/**
 * Lo que expone el SedeContext hacia los componentes hijos.
 * `sedeActiva`: la sede seleccionada actualmente (null si aún no se eligió ninguna).
 * `sedes`: lista completa de sedes disponibles (para el selector del Header).
 * `setSedeActiva`: función para cambiar la sede activa globalmente.
 */
interface SedeContextValue {
  sedeActiva: SedeDTO | null;
  sedes: SedeDTO[];
  setSedeActiva: (sede: SedeDTO) => void;
}

const SedeContext = createContext<SedeContextValue | null>(null);

/**
 * Hook para acceder al contexto de sede desde cualquier componente hijo.
 */
export function useSede(): SedeContextValue {
  const ctx = useContext(SedeContext);
  if (!ctx) {
    throw new Error('useSede debe usarse dentro de <SedeProvider>');
  }
  return ctx;
}

/**
 * Props del SedeProvider: recibe la lista de sedes y (opcionalmente) una sede inicial.
 */
interface SedeProviderProps {
  children: React.ReactNode;
  sedes: SedeDTO[];
  sedeInicial?: SedeDTO;
}

/**
 * Provider de sede activa.
 * La sede activa determina qué datos se cargan en las tablas de cada módulo.
 * Por defecto, la primera de la lista es la activa al iniciar.
 */
export function SedeProvider({ children, sedes, sedeInicial }: SedeProviderProps) {
  // Si hay una sede inicial, la usamos; si no, usamos la primera de la lista.
  const [sedeActiva, setSedeActiva] = useState<SedeDTO | null>(
    sedeInicial ?? sedes[0] ?? null
  );

  return (
    <SedeContext.Provider value={{ sedeActiva, sedes, setSedeActiva }}>
      {children}
    </SedeContext.Provider>
  );
}
