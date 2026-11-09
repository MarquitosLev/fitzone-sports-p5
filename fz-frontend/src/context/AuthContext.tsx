import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  UsuarioDTO,
  LoginCredentialsDTO,
  AltaSocioDTO,
  AltaSocioResultadoDTO,
  AuthResponseDTO,
} from '../types';
import {
  iniciarSesion,
  darAltaSocio,
  cerrarSesion,
  obtenerSesionActual,
  obtenerUsuarioActual,
} from '../services/authService';
import { AppError } from '../services/httpClient';
import { USE_MOCK } from '../config';

export interface AuthContextType {
  usuario: UsuarioDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentialsDTO) => Promise<AuthResponseDTO>;
  /** Alta de socio con el pago de la suscripción. Con token en el resultado, la sesión queda iniciada. */
  register: (datos: AltaSocioDTO) => Promise<AltaSocioResultadoDTO>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Proveedor del contexto de autenticación (SCRUM-89 / SCRUM-92).
 * Mantiene la sesión global del usuario y el token sincronizado.
 *
 * Al arrancar:
 *   1. Restaura la sesión guardada en sessionStorage (para no parpadear).
 *   2. Con la API real, confirma el usuario con `GET /v1/usuarios/me`.
 *      Mientras tanto `isLoading` queda en true, así las rutas protegidas
 *      esperan en vez de mostrar contenido con un token que podría estar vencido.
 *   3. Si el backend responde 401, la sesión se descarta (el httpClient además
 *      redirige a /login). Otros errores (red caída) conservan la sesión guardada.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializa la sesión almacenada en el arranque y la valida contra /v1/usuarios/me
  useEffect(() => {
    let activo = true;
    const sesion = obtenerSesionActual();

    if (!sesion) {
      setIsLoading(false);
      return;
    }

    setUsuario(sesion.usuario);
    setToken(sesion.token);

    if (USE_MOCK) {
      setIsLoading(false);
      return;
    }

    obtenerUsuarioActual()
      .then((usuarioActual) => {
        if (activo) setUsuario(usuarioActual);
      })
      .catch((err: unknown) => {
        if (!activo) return;
        if (err instanceof AppError && err.status === 401) {
          cerrarSesion();
          setUsuario(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (activo) setIsLoading(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentialsDTO): Promise<AuthResponseDTO> => {
    setIsLoading(true);
    try {
      const sesion = await iniciarSesion(credentials);
      setUsuario(sesion.usuario);
      setToken(sesion.token);
      return sesion;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (datos: AltaSocioDTO): Promise<AltaSocioResultadoDTO> => {
    setIsLoading(true);
    try {
      const resultado = await darAltaSocio(datos);
      if (resultado.token) {
        setUsuario(resultado.usuario);
        setToken(resultado.token);
      }
      return resultado;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    cerrarSesion();
    setUsuario(null);
    setToken(null);
  }, []);

  const value: AuthContextType = {
    usuario,
    token,
    isAuthenticated: Boolean(token && usuario),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder a la sesión actual y operaciones de autenticación.
 */
const FALLBACK_AUTH: AuthContextType = {
  usuario: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => { throw new Error('Fuera de AuthProvider'); },
  register: async () => { throw new Error('Fuera de AuthProvider'); },
  logout: () => {},
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context ?? FALLBACK_AUTH;
}
