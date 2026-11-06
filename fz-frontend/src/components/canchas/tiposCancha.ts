/** Nombres visibles de los tipos de cancha (enum TipoCancha del backend). */
export const TIPO_LABELS: Record<string, string> = {
  PADEL: 'Pádel',
  FUTBOL_5: 'Fútbol 5',
  FUTBOL_7: 'Fútbol 7',
  TENIS: 'Tenis',
  BASQUET: 'Básquet',
  OTRO: 'Deporte',
};

/** Nombre visible de un tipo de cancha. */
export function etiquetaTipo(tipo: string): string {
  return TIPO_LABELS[tipo] ?? tipo;
}
