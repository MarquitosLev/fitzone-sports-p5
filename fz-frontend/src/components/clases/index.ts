/**
 * Barrel file for clases module components.
 * Importá todos los componentes del módulo desde un único punto:
 *   import { AgendaSemanal, ClaseCard, ReservaClaseItem, PosicionEsperaBadge } from '../components/clases';
 */
export { AgendaSemanal } from './AgendaSemanal';
export { ClaseForm } from './ClaseForm';
export type { ClaseFormProps, ClaseFormModo, ClaseFormPayload } from './ClaseForm';
export { CupoIndicator } from './CupoIndicator';
// ── SCRUM-83: Componentes de vista Socio ─────────────────────────────────────
export { ClaseCard } from './ClaseCard';
export { ReservaClaseItem } from './ReservaClaseItem';
export { PosicionEsperaBadge } from './PosicionEsperaBadge';
