/**
 * DTO de Sede.
 * Refleja exactamente los campos que serializa Jackson desde la entidad Sede del backend.
 * No incluye campos de auditoría (createdAt, updatedAt, etc.).
 */
export interface SedeDTO {
  idSede: number;
  nombre: string;
  aforoMaximo: number;
}
