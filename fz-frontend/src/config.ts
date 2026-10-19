/**
 * config.ts — Configuración global del frontend.
 *
 * Fuente única de verdad para el modo mock:
 * Solo se activa cuando VITE_USE_MOCK es explícitamente 'true'.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
