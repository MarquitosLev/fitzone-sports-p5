/**
 * ClasesPage.tsx — Módulo Clases Grupales (RF-06 + RF-08 / SCRUM-83).
 *
 * Tabs disponibles:
 * 1. "Clases Disponibles" (vista SOCIO): lista de ClaseCard con reserva/lista de espera.
 * 2. "Mis Reservas" (vista SOCIO): lista de ReservaClaseItem con cancelación.
 * 3. "Agenda (Admin)": AgendaSemanal para GERENTE/RECEPCIONISTA — intacta.
 *
 * Socio mock: idUsuario = 2 (Valentina García, membresía ACTIVO),
 * alineado con membresiasService.ts. Filtra clases por sedeActiva de SedeContext.
 */

import { useState, useEffect, useCallback } from 'react';
import { Dumbbell, CalendarDays, ClipboardList } from 'lucide-react';
import { Spinner, Alert, Badge, Button, Modal, ConfirmDialog, EmptyState } from '../components/ui';
import type { Column } from '../components/ui';
import {
  listarClases,
  crearClase,
  actualizarClase,
  eliminarClase,
  listarReservasSocio,
  listarEsperaSocio,
  reservarClase,
  anotarseEnEspera,
  cancelarReservaClase,
} from '../services/clasesService';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import type { ClaseGrupalDTO, ReservaClaseDTO, ListaEsperaDTO } from '../types';
import { formatearFechaHora } from '../utils/formatters';
import { AgendaSemanal } from '../components/clases/AgendaSemanal';
import { ClaseForm } from '../components/clases/ClaseForm';
import type { ClaseFormPayload } from '../components/clases/ClaseForm';
import { ClaseCard } from '../components/clases/ClaseCard';
import { ReservaClaseItem } from '../components/clases/ReservaClaseItem';

// ── Socio mock (Valentina García, ACTIVO). Se usa hasta integrar AuthContext. ─
// idUsuario = 2 está alineado con membresiasService.ts: el único socio activo.
const SOCIO_MOCK_ID = 2;

// Column definition kept for reference (not rendered, but exported for type safety)
export const CLASES_COLUMNS: Column<ClaseGrupalDTO>[] = [
  { key: 'idClase', header: 'ID', width: 60, align: 'center' },
  { key: 'nombreActividad', header: 'Actividad' },
  {
    header: 'Inicio',
    render: (row) => formatearFechaHora(row.fechaHoraInicio),
  },
  {
    header: 'Duración',
    render: (row) => `${row.duracionMinutos} min`,
    align: 'center',
  },
  {
    header: 'Cupos',
    align: 'center',
    render: (row) => (
      <Badge variant={row.cupoDisponible === 0 ? 'red-soft' : 'green-soft'}>
        {row.cupoDisponible} / {row.cupoMaximo}
      </Badge>
    ),
  },
];

// ── Tipos de tab ──────────────────────────────────────────────────────────────
type TabClases = 'disponibles' | 'mis-reservas' | 'agenda-admin';

export function ClasesPage() {
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  // ── Tab activo ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabClases>('disponibles');

  // ── Data: clases, reservas del socio y lista de espera ───────────────────
  const [clases, setClases] = useState<ClaseGrupalDTO[]>([]);
  const [reservasSocio, setReservasSocio] = useState<ReservaClaseDTO[]>([]);
  const [esperaSocio, setEsperaSocio] = useState<ListaEsperaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Estado de acción sobre una clase (loading individual) ────────────────
  const [accionLoadingId, setAccionLoadingId] = useState<number | null>(null);

  // ── Form / modal state (admin) ───────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [selectedClase, setSelectedClase] = useState<ClaseGrupalDTO | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Confirm delete state (admin) ─────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);
  const [claseToDelete, setClaseToDelete] = useState<ClaseGrupalDTO | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Carga de datos: clases + reservas/espera del socio ───────────────────
  const cargarDatos = useCallback(async () => {
    if (!sedeActiva) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    try {
      // Cargamos en paralelo: clases de la sede + reservas + espera del socio mock
      const [resultClases, resultReservas, resultEspera] = await Promise.all([
        listarClases(sedeActiva.idSede),
        listarReservasSocio(SOCIO_MOCK_ID),
        listarEsperaSocio(SOCIO_MOCK_ID),
      ]);
      if (!cancelled) {
        setClases(resultClases);
        setReservasSocio(resultReservas);
        setEsperaSocio(resultEspera);
      }
    } catch (err: unknown) {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar los datos de clases');
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, [sedeActiva]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // ── Helpers: lookups de estado del socio respecto a cada clase ───────────
  /** Devuelve la reserva CONFIRMADA del socio para una clase, si existe. */
  const getReserva = (idClase: number): ReservaClaseDTO | undefined =>
    reservasSocio.find((r) => r.clase.idClase === idClase && r.estado === 'CONFIRMADA');

  /** Devuelve la entrada en lista de espera del socio para una clase, si existe. */
  const getEspera = (idClase: number): ListaEsperaDTO | undefined =>
    esperaSocio.find((e) => e.clase.idClase === idClase);

  // ── Acciones SOCIO ────────────────────────────────────────────────────────

  const handleReservar = async (idClase: number) => {
    setAccionLoadingId(idClase);
    try {
      const nuevaReserva = await reservarClase(idClase, SOCIO_MOCK_ID);
      setReservasSocio((prev) => [...prev, nuevaReserva]);
      // Actualizar cupoDisponible en la lista local
      setClases((prev) =>
        prev.map((c) =>
          c.idClase === idClase ? { ...c, cupoDisponible: Math.max(0, c.cupoDisponible - 1) } : c
        )
      );
      addToast({ type: 'success', title: 'Reserva confirmada', message: '¡Tu lugar fue reservado exitosamente!' });
    } catch (err: unknown) {
      // httpClient ya muestra toast de error si los PRs del backend están activos.
      // En modo mock también mostramos el error aquí.
      const msg = err instanceof Error ? err.message : 'No se pudo reservar la clase';
      addToast({ type: 'error', title: 'Error al reservar', message: msg });
    } finally {
      setAccionLoadingId(null);
    }
  };

  const handleAnotarseEnEspera = async (idClase: number) => {
    setAccionLoadingId(idClase);
    try {
      const nuevaEspera = await anotarseEnEspera(idClase, SOCIO_MOCK_ID);
      setEsperaSocio((prev) => [...prev, nuevaEspera]);
      addToast({ type: 'info', title: 'Anotado en lista de espera', message: `Estás en la posición #${nuevaEspera.ordenPosicion}. Te avisaremos cuando se libere un cupo.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo anotar en la lista de espera';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setAccionLoadingId(null);
    }
  };

  const handleCancelarReserva = async (idReservaClase: number) => {
    setAccionLoadingId(idReservaClase);
    try {
      await cancelarReservaClase(idReservaClase);
      // Actualizamos el estado local: cambiamos el estado de la reserva a CANCELADA
      setReservasSocio((prev) =>
        prev.map((r) =>
          r.idReservaClase === idReservaClase ? { ...r, estado: 'CANCELADA' as const } : r
        )
      );
      // Liberamos el cupo en la clase correspondiente
      const reservaCancelada = reservasSocio.find((r) => r.idReservaClase === idReservaClase);
      if (reservaCancelada) {
        setClases((prev) =>
          prev.map((c) =>
            c.idClase === reservaCancelada.clase.idClase
              ? { ...c, cupoDisponible: c.cupoDisponible + 1 }
              : c
          )
        );
      }
      addToast({ type: 'info', title: 'Reserva cancelada', message: 'Tu lugar fue liberado para el próximo socio en lista de espera.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo cancelar la reserva';
      addToast({ type: 'error', title: 'Error al cancelar', message: msg });
    } finally {
      setAccionLoadingId(null);
    }
  };

  // ── Helpers admin ─────────────────────────────────────────────────────────
  const handleOpenNew = () => { setSelectedClase(undefined); setFormError(null); setShowForm(true); };
  const handleOpenEdit = (clase: ClaseGrupalDTO) => { setSelectedClase(clase); setFormError(null); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setSelectedClase(undefined); setFormError(null); };

  const handleSubmitForm = async (payload: ClaseFormPayload) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (selectedClase) {
        const claseActualizada: ClaseGrupalDTO = { ...selectedClase, ...payload, sede: selectedClase.sede };
        const updated = await actualizarClase(claseActualizada);
        setClases((prev) => prev.map((c) => (c.idClase === updated.idClase ? updated : c)));
        addToast({ type: 'success', title: 'Clase actualizada', message: `"${updated.nombreActividad}" fue actualizada correctamente.` });
      } else {
        const nuevaClase: Omit<ClaseGrupalDTO, 'idClase'> = {
          nombreActividad: payload.nombreActividad,
          fechaHoraInicio: payload.fechaHoraInicio,
          duracionMinutos: payload.duracionMinutos,
          cupoMaximo: payload.cupoMaximo,
          cupoDisponible: payload.cupoMaximo,
          sede: sedeActiva!,
        };
        const creada = await crearClase(nuevaClase);
        setClases((prev) => [...prev, creada]);
        addToast({ type: 'success', title: 'Clase programada', message: `"${creada.nombreActividad}" fue programada exitosamente.` });
      }
      handleCloseForm();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar la clase');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRequestDelete = (clase: ClaseGrupalDTO) => { setClaseToDelete(clase); setShowConfirm(true); };
  const handleConfirmDelete = async () => {
    if (!claseToDelete) return;
    setDeleteLoading(true);
    try {
      await eliminarClase(claseToDelete.idClase);
      setClases((prev) => prev.filter((c) => c.idClase !== claseToDelete.idClase));
      addToast({ type: 'info', title: 'Clase eliminada', message: `"${claseToDelete.nombreActividad}" fue eliminada de la agenda.` });
    } catch (e: unknown) {
      addToast({ type: 'error', title: 'Error al eliminar', message: e instanceof Error ? e.message : 'No se pudo eliminar la clase.' });
    } finally {
      setDeleteLoading(false);
      setShowConfirm(false);
      setClaseToDelete(undefined);
    }
  };

  // ── Datos derivados para "Mis Reservas" ───────────────────────────────────
  // Mostramos todas las reservas (incluyendo CANCELADA, ASISTIO, NO_ASISTIO)
  // para que el socio pueda ver su historial
  const reservasParaMostrar = reservasSocio;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Dumbbell className="w-6 h-6 text-fitzone-coral" />
          <div>
            <h1 className="text-2xl font-black text-fitzone-navy font-outfit">Clases Grupales</h1>
            {sedeActiva && (
              <p className="text-xs text-slate-500">{sedeActiva.nombre}</p>
            )}
          </div>
        </div>

        {/* Botón "Nueva clase" solo visible en el tab Admin */}
        {activeTab === 'agenda-admin' && (
          <Button id="btn-programar-nueva-clase" variant="coral" onClick={handleOpenNew}>
            Programar Nueva Clase
          </Button>
        )}
      </div>

      {/* ── Tab selector ───────────────────────────────────────────────────── */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit gap-1">
        <button
          id="tab-clases-disponibles"
          onClick={() => setActiveTab('disponibles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'disponibles' ? 'bg-white text-fitzone-navy shadow-sm' : 'text-slate-600 hover:text-fitzone-navy'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          Clases Disponibles
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'disponibles' ? 'bg-fitzone-navy text-white' : 'bg-slate-200 text-slate-600'}`}>
            {clases.length}
          </span>
        </button>

        <button
          id="tab-mis-reservas"
          onClick={() => setActiveTab('mis-reservas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'mis-reservas' ? 'bg-white text-fitzone-navy shadow-sm' : 'text-slate-600 hover:text-fitzone-navy'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Mis Reservas
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'mis-reservas' ? 'bg-fitzone-navy text-white' : 'bg-slate-200 text-slate-600'}`}>
            {reservasSocio.filter((r) => r.estado === 'CONFIRMADA').length}
          </span>
        </button>

        <button
          id="tab-agenda-admin"
          onClick={() => setActiveTab('agenda-admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'agenda-admin' ? 'bg-white text-fitzone-navy shadow-sm' : 'text-slate-600 hover:text-fitzone-navy'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          Agenda (Admin)
        </button>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && <Alert type="error" title="Error al cargar" message={error} />}

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          TAB 1: CLASES DISPONIBLES (SOCIO)
          Muestra ClaseCard por cada clase con estado del socio calculado.
      ──────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'disponibles' && (
        <>
          {clases.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="Sin clases disponibles"
              description="No hay clases programadas para esta sede en este momento."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clases.map((clase) => {
                const reserva = getReserva(clase.idClase);
                const espera = getEspera(clase.idClase);
                return (
                  <ClaseCard
                    key={clase.idClase}
                    clase={clase}
                    estaReservada={Boolean(reserva)}
                    estaEnEspera={Boolean(espera)}
                    ordenEnEspera={espera?.ordenPosicion}
                    isLoading={accionLoadingId === clase.idClase}
                    onReservar={() => void handleReservar(clase.idClase)}
                    onAnotarEnEspera={() => void handleAnotarseEnEspera(clase.idClase)}
                  />
                );
              })}
            </div>
          )}

          {/* Aviso de política de clases */}
          <div className="bg-slate-100/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600 mt-2">
            <span className="text-fitzone-navy font-bold shrink-0">ℹ</span>
            <p className="leading-relaxed">
              <strong>Política de reserva:</strong> Podés reservar hasta 48 hs antes del inicio.
              Si no podés asistir, cancelá hasta 2 hs antes para liberar el lugar al siguiente socio en lista de espera.
              Las clases grupales están incluidas en tu membresía activa sin costo adicional.
            </p>
          </div>
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          TAB 2: MIS RESERVAS (SOCIO)
          Muestra ReservaClaseItem por cada reserva.
      ──────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'mis-reservas' && (
        <>
          {reservasParaMostrar.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin reservas aún"
              description="Todavía no tenés ninguna reserva de clase. ¡Explorá la agenda y reservá tu lugar!"
              actionLabel="Ver clases disponibles"
              onAction={() => setActiveTab('disponibles')}
            />
          ) : (
            <div className="space-y-3">
              {reservasParaMostrar.map((reserva) => {
                // La lista de espera del socio es para otra clase; acá mostramos
                // la del item si el socio también está esperando en esa misma clase
                const espera = getEspera(reserva.clase.idClase);
                return (
                  <ReservaClaseItem
                    key={reserva.idReservaClase}
                    reserva={reserva}
                    listaEspera={espera}
                    isLoading={accionLoadingId === reserva.idReservaClase}
                    onCancelar={(id) => void handleCancelarReserva(id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          TAB 3: AGENDA ADMIN (AgendaSemanal — intacta)
      ──────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'agenda-admin' && (
        <AgendaSemanal
          clases={clases}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}

      {/* ── Modal: Create / Edit (admin) ───────────────────────────────────── */}
      <Modal
        isOpen={showForm}
        onClose={formLoading ? undefined : handleCloseForm}
        title={selectedClase ? 'Editar Clase' : 'Programar Nueva Clase'}
        subtitle={selectedClase ? `Modificando: ${selectedClase.nombreActividad}` : 'Completá los datos para agregar una nueva clase a la agenda'}
        icon={Dumbbell}
        size="md"
        closeOnBackdrop={!formLoading}
        closeOnEsc={!formLoading}
      >
        <ClaseForm
          modo={selectedClase ? 'edicion' : 'alta'}
          valoresIniciales={selectedClase}
          loading={formLoading}
          onSubmit={handleSubmitForm}
          errorNegocio={formError}
        />
      </Modal>

      {/* ── Confirm Delete Dialog (admin) ──────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setClaseToDelete(undefined); }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Clase"
        description={
          claseToDelete
            ? `¿Estás seguro de que querés eliminar "${claseToDelete.nombreActividad}"? Esta acción no se puede deshacer y se cancelarán todas las reservas asociadas.`
            : '¿Estás seguro de que querés eliminar esta clase?'
        }
        confirmText="Sí, eliminar clase"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
