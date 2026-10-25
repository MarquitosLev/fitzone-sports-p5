import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  UsuarioDTO,
  LoginCredentialsDTO,
  RegistroUsuarioDTO,
  AuthResponseDTO,
} from '../types';
import {
  iniciarSesion,
  registrarUsuario,
  cerrarSesion,
  obtenerSesionActual,
} from '../services/authService';

export interface AuthContextType {
  usuario: UsuarioDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentialsDTO) => Promise<AuthResponseDTO>;
  register: (datos: RegistroUsuarioDTO) => Promise<AuthResponseDTO>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Proveedor del contexto de autenticación (SCRUM-89).
 * Mantiene la sesión global del usuario y el token sincronizado.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializa la sesión almacenada en el arranque
  useEffect(() => {
    try {
      const sesion = obtenerSesionActual();
      if (sesion) {
        setUsuario(sesion.usuario);
        setToken(sesion.token);
      }
    } finally {
      setIsLoading(false);
    }
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

  const register = useCallback(async (datos: RegistroUsuarioDTO): Promise<AuthResponseDTO> => {
    setIsLoading(true);
    try {
      const sesion = await registrarUsuario(datos);
      setUsuario(sesion.usuario);
      setToken(sesion.token);
      return sesion;
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
