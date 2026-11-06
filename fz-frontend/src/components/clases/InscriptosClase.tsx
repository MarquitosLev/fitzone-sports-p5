/**
 * InscriptosClase.tsx — Detalle de una clase para GERENTE y RECEPCIONISTA (GER-07).
 * Muestra los socios con reserva confirmada (`GET /v1/clases/{id}/reservas`)
 * y la cola de espera en orden (`GET /v1/clases/{id}/lista-espera`).
 */

import { useEffect, useState } from 'react';
import { Users, Hourglass } from 'lucide-react';
import { Spinner, Alert, Badge } from '../ui';
import { listarInscriptos, listarEsperaDeClase } from '../../services/clasesService';
import type { ClaseGrupalDTO, InscriptoClaseDTO, ListaEsperaDTO } from '../../types';
import { formatearFechaHora } from '../../utils/formatters';

interface InscriptosClaseProps {
  clase: ClaseGrupalDTO;
}

export function InscriptosClase({ clase }: InscriptosClaseProps) {
  const [inscriptos, setInscriptos] = useState<InscriptoClaseDTO[]>([]);
  const [espera, setEspera] = useState<ListaEsperaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);
    Promise.all([listarInscriptos(clase.idClase), listarEsperaDeClase(clase.idClase)])
      .then(([resultInscriptos, resultEspera]) => {
        if (cancelado) return;
        setInscriptos(resultInscriptos);
        setEspera([...resultEspera].sort((a, b) => a.ordenPosicion - b.ordenPosicion));
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : 'No se pudieron cargar los inscriptos');
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [clase.idClase]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title="Error al cargar" message={error} />;
  }

  return (
    <div className="space-y-5" data-testid={`inscriptos-clase-${clase.idClase}`}>
      <p className="text-xs text-slate-500">
        {formatearFechaHora(clase.fechaHoraInicio)} · {clase.cupoMaximo - clase.cupoDisponible} / {clase.cupoMaximo} cupos ocupados
      </p>

      <section>
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-fitzone-navy mb-2">
          <Users className="w-4 h-4 text-fitzone-coral" />
          Inscriptos ({inscriptos.length})
        </h4>
        {inscriptos.length === 0 ? (
          <p className="text-xs text-slate-400">Todavía no hay reservas confirmadas.</p>
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {inscriptos.map((i) => (
              <li key={i.idReservaClase} className="px-3 py-2 text-sm text-slate-700">
                {i.apellido}, {i.nombre}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-fitzone-navy mb-2">
          <Hourglass className="w-4 h-4 text-amber-500" />
          Lista de espera ({espera.length})
        </h4>
        {espera.length === 0 ? (
          <p className="text-xs text-slate-400">Nadie en lista de espera.</p>
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {espera.map((e) => (
              <li key={e.idEspera} className="px-3 py-2 text-sm text-slate-700 flex items-center justify-between gap-2">
                <span>
                  {e.usuario.apellido}, {e.usuario.nombre}
                </span>
                <Badge variant="gold-soft" size="xs">#{e.ordenPosicion}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
