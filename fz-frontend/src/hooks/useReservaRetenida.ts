import { useEffect, useState } from 'react';

/**
 * Retención de 5 minutos del turno que eligió el cliente externo (ADR-018).
 * Vive solo en el localStorage de su navegador: no bloquea el turno para otros. Si recarga la página
 * dentro del plazo, se recupera; al vencer se borra todo.
 */
const CLAVE = 'fz_reserva_invitado';
export const DURACION_RETENCION_MS = 5 * 60 * 1000;

export interface ReservaRetenida {
  idCancha: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  /** Epoch en ms en que vence la retención */
  venceEn: number;
}

export function liberarReservaRetenida(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Sin localStorage (modo privado): no hay nada que borrar
  }
}

/** Devuelve la retención vigente, o null si no hay o ya venció (en ese caso la borra). */
export function leerReservaRetenida(): ReservaRetenida | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const retenida = JSON.parse(crudo) as ReservaRetenida;
    if (typeof retenida.venceEn !== 'number' || retenida.venceEn <= Date.now()) {
      liberarReservaRetenida();
      return null;
    }
    return retenida;
  } catch {
    liberarReservaRetenida();
    return null;
  }
}

export function retenerReserva(turno: Omit<ReservaRetenida, 'venceEn'>): ReservaRetenida {
  const retenida = { ...turno, venceEn: Date.now() + DURACION_RETENCION_MS };
  try {
    localStorage.setItem(CLAVE, JSON.stringify(retenida));
  } catch {
    // Sin localStorage la cuenta regresiva sigue en memoria; solo se pierde al recargar
  }
  return retenida;
}

/** Segundos que le quedan a la retención; llama a `onVencer` una vez cuando llega a cero. */
export function useSegundosRestantes(venceEn: number | null, onVencer: () => void): number {
  const calcular = () => (venceEn ? Math.max(0, Math.ceil((venceEn - Date.now()) / 1000)) : 0);
  const [segundos, setSegundos] = useState(calcular);

  useEffect(() => {
    if (!venceEn) {
      setSegundos(0);
      return;
    }
    const tick = () => {
      const restantes = Math.max(0, Math.ceil((venceEn - Date.now()) / 1000));
      setSegundos(restantes);
      if (restantes === 0) {
        clearInterval(id);
        onVencer();
      }
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
    // onVencer cambia en cada render del padre; el intervalo depende solo del vencimiento
  }, [venceEn]);

  return segundos;
}
