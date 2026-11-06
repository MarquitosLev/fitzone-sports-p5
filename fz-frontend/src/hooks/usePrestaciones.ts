import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerPrestacionesPorRol } from '../services/rolesService';
import type { Prestacion } from '../types/rol';

export function usePrestacionesUsuario(): Prestacion[] {
  const { usuario } = useAuth();

  return useMemo(() => {
    if (!usuario?.tipoUsuario) return [];
    return obtenerPrestacionesPorRol(usuario.tipoUsuario);
  }, [usuario?.tipoUsuario]);
}

export function useTienePrestacion(prestacion: Prestacion): boolean {
  const prestaciones = usePrestacionesUsuario();
  return prestaciones.includes(prestacion);
}
