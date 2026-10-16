/**
 * httpClient.ts — Cliente HTTP centralizado de FitZone Sports.
 *
 * ¿Por qué existe este archivo?
 * En lugar de hacer `fetch()` directamente en cada servicio (y repetir
 * la misma lógica de URL base, headers y manejo de errores), centralizamos
 * todo aquí. Es el equivalente a un HttpClient o RestTemplate en Java Spring.
 *
 * Flujo de una petición:
 *   1. El servicio llama a `httpClient.get('/v1/usuarios?idSede=1')`
 *   2. httpClient arma la URL completa y los headers
 *   3. Si el backend devuelve un error HTTP (4xx, 5xx), lo convierte a AppError
 *   4. El servicio recibe los datos tipados o lanza un AppError
 */

/**
 * Formato de error que devuelve nuestro @RestControllerAdvice (SCRUM-63).
 * El backend siempre responde así cuando algo falla.
 *
 * Ejemplo de respuesta 400 (validación):
 * { "codigo": 400, "mensaje": "Errores de validación", "detalles": { "dni": "El DNI es requerido" }, "timestamp": "..." }
 *
 * Ejemplo de respuesta 404:
 * { "codigo": "RECURSO_NO_ENCONTRADO", "mensaje": "Usuario no encontrado", "timestamp": "..." }
 */
export interface BackendErrorResponse {
  codigo: string | number;
  mensaje: string;
  /** Puede ser un mapa campo->error (400), una lista de mensajes, o un string simple */
  detalles?: Record<string, string> | string[] | string;
  timestamp: string;
}

/**
 * Error tipado que lanza el httpClient cuando el backend devuelve un código de error HTTP.
 * Extendemos la clase Error nativa de JavaScript, igual que haría una Exception en Java.
 * Nota: declaramos las propiedades explícitamente porque TypeScript no permite
 * "parameter properties" (public readonly en constructor) con erasableSyntaxOnly.
 */
export class AppError extends Error {
  readonly status: number;
  readonly backendResponse: BackendErrorResponse | undefined;

  constructor(
    message: string,
    status: number,
    backendResponse?: BackendErrorResponse
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.backendResponse = backendResponse;
  }
}

/**
 * Convierte la respuesta de error del backend en un mensaje legible para el usuario.
 * Por ejemplo, un error 400 con `detalles: { dni: "requerido" }` devuelve
 * "dni: requerido" para mostrarlo en el toast.
 */
function buildUserMessage(response: BackendErrorResponse): string {
  // El mensaje principal siempre existe
  const base = response.mensaje || 'Error inesperado';

  if (!response.detalles) return base;

  // Si los detalles son un objeto (campo: mensaje), los formateamos como lista
  if (typeof response.detalles === 'object' && !Array.isArray(response.detalles)) {
    const fieldErrors = Object.entries(response.detalles)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(', ');
    return `${base} — ${fieldErrors}`;
  }

  // Si los detalles son un array de strings
  if (Array.isArray(response.detalles)) {
    return `${base} — ${response.detalles.join(', ')}`;
  }

  // Si los detalles son un string simple
  return `${base} — ${response.detalles}`;
}

// Leemos la URL base del .env (Vite expone las variables VITE_* en import.meta.env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

// Callback opcional para disparar toasts de error globalmente.
// Se registra una sola vez en App.tsx cuando se monta el ToastProvider.
let _onError: ((message: string) => void) | null = null;

/**
 * Registra el callback que se llama cuando ocurre un error HTTP.
 * Llamar a esta función en App.tsx con `addToast` del ToastContext.
 *
 * Ejemplo:
 *   registerHttpErrorHandler((msg) => addToast({ type: 'error', title: 'Error', message: msg }));
 */
export function registerHttpErrorHandler(handler: (message: string) => void): void {
  _onError = handler;
}

/**
 * Función principal que realiza la petición HTTP.
 * Es genérica: `httpRequest<UsuarioDTO[]>('/v1/usuarios')` devuelve `Promise<UsuarioDTO[]>`.
 */
async function httpRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // Headers por defecto: JSON en request y response
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(url, { ...options, headers });

  // Si la respuesta es exitosa (2xx), parseamos y devolvemos los datos
  if (response.ok) {
    // Si el servidor devolvió un cuerpo vacío (204 No Content), retornamos null
    if (response.status === 204) return null as T;
    return response.json() as Promise<T>;
  }

  // Si hubo error HTTP (4xx, 5xx), intentamos parsear el cuerpo de error del backend
  let backendError: BackendErrorResponse | undefined;
  try {
    backendError = (await response.json()) as BackendErrorResponse;
  } catch {
    // Si el backend no devolvió JSON (muy raro), usamos un mensaje genérico
    backendError = undefined;
  }

  const userMessage = backendError
    ? buildUserMessage(backendError)
    : `Error ${response.status}: ${response.statusText}`;

  // Disparamos el toast de error si hay un handler registrado
  if (_onError) {
    _onError(userMessage);
  }

  throw new AppError(userMessage, response.status, backendError);
}

/**
 * API pública del cliente HTTP.
 * Uso:
 *   const usuarios = await httpClient.get<UsuarioDTO[]>('/v1/usuarios?idSede=1');
 *   const nuevo = await httpClient.post<UsuarioDTO>('/v1/usuarios', { body: JSON.stringify(data) });
 */
export const httpClient = {
  get: <T>(path: string, options?: RequestInit) =>
    httpRequest<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, options?: RequestInit) =>
    httpRequest<T>(path, { method: 'POST', ...options }),

  put: <T>(path: string, options?: RequestInit) =>
    httpRequest<T>(path, { method: 'PUT', ...options }),

  delete: <T>(path: string, options?: RequestInit) =>
    httpRequest<T>(path, { method: 'DELETE', ...options }),

  patch: <T>(path: string, options?: RequestInit) =>
    httpRequest<T>(path, { method: 'PATCH', ...options }),
};
