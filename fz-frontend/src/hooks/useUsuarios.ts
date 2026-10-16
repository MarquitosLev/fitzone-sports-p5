/**
 * useUsuarios.ts — Hook de datos para el módulo de Usuarios.
 *
 * ¿Por qué un hook?
 * En React, los "hooks" son funciones que encapsulan lógica reutilizable
 * (estado, efectos, etc.). Este hook actúa como el puente entre la capa de
 * servicio y el componente visual: gestiona `loading`, `error` y `data`
 * para que la página no tenga que pensar en cómo se cargan los datos.
 *
 * Equivalente en Java: un @Service que llama al @Repository y devuelve el resultado.
 */

import { useState, useEffect } from 'react';
import type { UsuarioDTO } from '../types';
import { listarUsuarios } from '../services/usuariosService';

interface UseUsuariosResult {
  data: UsuarioDTO[];
  loading: boolean;
  error: string | null;
  /** Permite recargar los datos manualmente (ej. después de una acción) */
  refetch: () => void;
}

/**
 * Hook que carga la lista de usuarios de una sede.
 * Se re-ejecuta automáticamente cuando cambia `idSede`.
 * @param idSede - ID de la sede activa (del SedeContext)
 */
export function useUsuarios(idSede: number | null): UseUsuariosResult {
  const [data, setData] = useState<UsuarioDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Un contador que al incrementarse fuerza la recarga (truco sencillo para el refetch)
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  useEffect(() => {
    // Si no hay sede activa todavía, no hacemos nada
    if (idSede === null) return;

    let cancelled = false; // Evita actualizar estado si el componente se desmontó

    const cargar = async () => {
      setLoading(true);
      setError(null);

      try {
        const resultado = await listarUsuarios(idSede);
        // Solo actualizamos si el componente sigue montado
        if (!cancelled) {
          setData(resultado);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          // El error ya fue notificado por el httpClient (toast automático).
          // Aquí guardamos el mensaje para mostrar el estado de error en la UI.
          const message = err instanceof Error ? err.message : 'Error al cargar usuarios';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void cargar();

    // Función de limpieza: se ejecuta al desmontar el componente o al cambiar las dependencias
    return () => {
      cancelled = true;
    };
  }, [idSede, refreshCounter]); // Se re-ejecuta si cambia la sede o se pide un refetch

  const refetch = () => setRefreshCounter((c) => c + 1);

  return { data, loading, error, refetch };
}
