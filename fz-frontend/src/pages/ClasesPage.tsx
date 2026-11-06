/**
 * ClasesPage.tsx — Módulo Clases Grupales (RF-06 + RF-08 / SCRUM-83 / SCRUM-102).
 *
 * Tabs disponibles:
 * 1. "Clases Disponibles" (SOCIO): ClaseCard con el estado que devuelve la agenda
 *    del backend (`yaReservada`, `posicionEspera`): reservar, anotarse o salir de la espera.
 * 2. "Mis Reservas" (SOCIO): `GET /v1/usuarios/me/reservas-clase`, con cancelación.
 * 3. "Agenda (Admin)": prestación CLASES_ADMIN. El backend solo permite alta, edición
 *    y baja al GERENTE; RECEPCIONISTA ve la agenda con inscriptos y lista de espera.
 *
 * El socio siempre sale del token: los servicios no reciben `idUsuario`.
 * Los errores del backend ya los muestra httpClient como toast; acá solo se
 * notifican los errores que no vienen del backend y se deja fijo el bloqueo del moroso.
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
  listarMisReservas,
  listarMiListaEspera,
  reservarClase,
  anotarseEnEspera,
  salirDeEspera,
  cancelarReservaClase,
} from '../services/clasesService';
import { AppError } from '../services/httpClient';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTienePrestacion } from '../hooks/usePrestaciones';
import type { ClaseGrupalDTO, ClaseGrupalRequest, ReservaClaseDTO, ListaEsperaDTO } from '../types';
import { formatearFechaHora } from '../utils/formatters';
import { AgendaSemanal } from '../components/clases/AgendaSemanal';
import { ClaseForm } from '../components/clases/ClaseForm';
import type { ClaseFormPayload } from '../components/clases/ClaseForm';
import { ClaseCard } from '../components/clases/ClaseCard';
import { ReservaClaseItem } from '../components/clases/ReservaClaseItem';
import { InscriptosClase } from '../components/clases/InscriptosClase';

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

/** Código de error del backend cuando el socio no tiene membresía activa (moroso). */
const CODIGO_MEMBRESIA_INACTIVA = 'MEMBRESIA_INACTIVA';

export function ClasesPage() {
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  // ── Permisos ──────────────────────────────────────────────────────────────
  const { usuario } = useAuth();
  // CLASES_ADMIN abre la agenda administrativa (GERENTE y RECEPCIONISTA)...
  const puedeVerAgendaAdmin = useTienePrestacion('CLASES_ADMIN');
  // ...pero el backend solo permite alta, edición y baja al GERENTE.
  const puedeGestionarClases = puedeVerAgendaAdmin && usuario?.tipoUsuario === 'GERENTE';
  const esSocio = usuario?.tipoUsuario === 'SOCIO';
  const [activeTab, setActiveTab] = useState<TabClases>(
    puedeVerAgendaAdmin ? 'agenda-admin' : 'disponibles'
  );

  // ── Data: clases, reservas del socio y lista de espera ───────────────────
  const [clases, setClases] = useState<ClaseGrupalDTO[]>([]);
  const [reservasSocio, setReservasSocio] = useState<ReservaClaseDTO[]>([]);
  const [esperaSocio, setEsperaSocio] = useState<ListaEsperaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Motivo por el que el backend bloquea las reservas del socio (moroso). */
  const [motivoBloqueo, setMotivoBloqueo] = useState<string | null>(null);

  // ── Estados de acción (loading individuales para evitar colisión de IDs) ───
  const [claseLoadingId, setClaseLoadingId] = useState<number | null>(null);
  const [reservaLoadingId, setReservaLoadingId] = useState<number | null>(null);

  // ── Form / modal state (admin) ───────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [selectedClase, setSelectedClase] = useState<ClaseGrupalDTO | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Confirm delete state (admin) ─────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);
  const [claseToDelete, setClaseToDelete] = useState<ClaseGrupalDTO | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Inscriptos y lista de espera (admin) ─────────────────────────────────
  const [claseInscriptos, setClaseInscriptos] = useState<ClaseGrupalDTO | undefined>(undefined);

  // ── Carga de datos: agenda + reservas/espera del socio ───────────────────
  // `silencioso` recarga sin el spinner de pantalla completa (después de una acción).
  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!sedeActiva) return;
    if (!silencioso) setLoading(true);
    setError(null);
    try {
      const [resultClases, resultReservas, resultEspera] = await Promise.all([
        listarClases(sedeActiva.idSede),
        esSocio ? listarMisReservas() : Promise.resolve<ReservaClaseDTO[]>([]),
        esSocio ? listarMiListaEspera() : Promise.resolve<ListaEsperaDTO[]>([]),
      ]);
      setClases(resultClases);
      setReservasSocio(resultReservas);
      setEsperaSocio(resultEspera);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de clases');
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [sedeActiva, esSocio]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  /**
   * Notifica un error de acción. Un AppError ya lo mostró httpClient con el
   * mensaje del backend (48 hs, 2 hs, sin cupo...), así que no se duplica el toast.
   * Si es el bloqueo del moroso, además se deja el motivo fijo en pantalla.
   */
  const notificarError = (titulo: string, err: unknown, porDefecto: string) => {
    if (err instanceof AppError) {
      if (err.backendResponse?.codigo === CODIGO_MEMBRESIA_INACTIVA) {
        setMotivoBloqueo(err.backendResponse.mensaje);
      }
      return;
    }
    addToast({ type: 'error', title: titulo, message: err instanceof Error ? err.message : porDefecto });
  };

  /** Entrada en lista de espera del socio para una clase (para salir con su id). */
  const getEspera = (idClase: number): ListaEsperaDTO | undefined =>
    esperaSocio.find((e) => e.clase.idClase === idClase);

  // ── Acciones SOCIO ────────────────────────────────────────────────────────

  const avisarSoloSocios = () =>
    addToast({
      type: 'warning',
      title: 'Solo para socios',
      message: 'Las reservas de clases son para socios con membresía activa.',
    });

  const handleReservar = async (idClase: number) => {
    if (!esSocio) return avisarSoloSocios();
    setClaseLoadingId(idClase);
    try {
      await reservarClase(idClase);
      addToast({ type: 'success', title: 'Reserva confirmada', message: '¡Tu lugar fue reservado exitosamente!' });
      await cargarDatos(true);
    } catch (err: unknown) {
      notificarError('Error al reservar', err, 'No se pudo reservar la clase');
    } finally {
      setClaseLoadingId(null);
    }
  };

  const handleAnotarseEnEspera = async (idClase: number) => {
    if (!esSocio) return avisarSoloSocios();
    setClaseLoadingId(idClase);
    try {
      const nuevaEspera = await anotarseEnEspera(idClase);
      addToast({
        type: 'info',
        title: 'Anotado en lista de espera',
        message: `Estás en la posición #${nuevaEspera.ordenPosicion}. Te avisaremos cuando se libere un cupo.`,
      });
      await cargarDatos(true);
    } catch (err: unknown) {
      notificarError('Error al anotarse', err, 'No se pudo anotar en la lista de espera');
    } finally {
      setClaseLoadingId(null);
    }
  };

  const handleSalirDeEspera = async (idClase: number) => {
    const espera = getEspera(idClase);
    if (!espera) {
      // La agenda dice que está en espera pero no tenemos su id: recargamos
      await cargarDatos(true);
      return;
    }
    setClaseLoadingId(idClase);
    try {
      await salirDeEspera(espera.idEspera);
      addToast({
        type: 'info',
        title: 'Saliste de la lista de espera',
        message: `Ya no estás en la cola de "${espera.clase.nombreActividad}".`,
      });
      await cargarDatos(true);
    } catch (err: unknown) {
      notificarError('Error', err, 'No se pudo salir de la lista de espera');
    } finally {
      setClaseLoadingId(null);
    }
  };

  const handleCancelarReserva = async (idReservaClase: number) => {
    setReservaLoadingId(idReservaClase);
    try {
      await cancelarReservaClase(idReservaClase);
      addToast({ type: 'info', title: 'Reserva cancelada', message: 'Tu lugar fue liberado para el próximo socio en lista de espera.' });
      await cargarDatos(true);
    } catch (err: unknown) {
      notificarError('Error al cancelar', err, 'No se pudo cancelar la reserva');
    } finally {
      setReservaLoadingId(null);
    }
  };

  // ── Helpers admin ─────────────────────────────────────────────────────────
  const handleOpenNew = () => { setSelectedClase(undefined); setFormError(null); setShowForm(true); };
  const handleOpenEdit = (clase: ClaseGrupalDTO) => { setSelectedClase(clase); setFormError(null); setShowForm(true); };
  const handleCloseForm = () => { setShowForm(false); setSelectedClase(undefined); setFormError(null); };

  const handleSubmitForm = async (payload: ClaseFormPayload) => {
    const idSede = selectedClase?.sede.idSede ?? sedeActiva?.idSede;
    if (!idSede) {
      setFormError('Seleccioná una sede antes de programar la clase');
      return;
    }
    const datos: ClaseGrupalRequest = {
      idSede,
      nombreActividad: payload.nombreActividad,
      fechaHoraInicio: payload.fechaHoraInicio,
      duracionMinutos: payload.duracionMinutos,
      cupoMaximo: payload.cupoMaximo,
    };
    setFormLoading(true);
    setFormError(null);
    try {
      if (selectedClase) {
        const updated = await actualizarClase(selectedClase.idClase, datos);
        addToast({ type: 'success', title: 'Clase actualizada', message: `"${updated.nombreActividad}" fue actualizada correctamente.` });
      } else {
        const creada = await crearClase(datos);
        addToast({ type: 'success', title: 'Clase programada', message: `"${creada.nombreActividad}" fue programada exitosamente.` });
      }
      handleCloseForm();
      await cargarDatos(true);
    } catch (e: unknown) {
      // El formulario muestra el mensaje del backend (ej. cupo por debajo de las reservas)
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
      notificarError('Error al eliminar', e, 'No se pudo eliminar la clase.');
    } finally {
      setDeleteLoading(false);
      setShowConfirm(false);
      setClaseToDelete(undefined);
    }
  };

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

        {/* Botón "Nueva clase": solo GERENTE, en el tab Admin */}
        {activeTab === 'agenda-admin' && puedeGestionarClases && (
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

        {puedeVerAgendaAdmin && (
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
        )}
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
          El estado de cada tarjeta viene de la agenda (yaReservada, posicionEspera).
      ──────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'disponibles' && (
        <>
          {motivoBloqueo && (
            <Alert
              type="warning"
              title="No podés reservar clases"
              message={`${motivoBloqueo}. Regularizá tu membresía en recepción para volver a reservar.`}
              onClose={() => setMotivoBloqueo(null)}
            />
          )}

          {clases.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="Sin clases disponibles"
              description="No hay clases programadas para esta sede en este momento."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clases.map((clase) => (
                <ClaseCard
                  key={clase.idClase}
                  clase={clase}
                  isLoading={claseLoadingId === clase.idClase}
                  onReservar={() => void handleReservar(clase.idClase)}
                  onAnotarEnEspera={() => void handleAnotarseEnEspera(clase.idClase)}
                  onSalirDeEspera={esSocio ? () => void handleSalirDeEspera(clase.idClase) : undefined}
                />
              ))}
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
          Todas las reservas (incluye CANCELADA, ASISTIO, NO_ASISTIO) como historial.
      ──────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'mis-reservas' && (
        <>
          {!esSocio ? (
            <EmptyState
              icon={ClipboardList}
              title="Iniciá sesión como socio"
              description="Necesitás una cuenta de socio activa para ver y gestionar tus reservas de clases."
            />
          ) : reservasSocio.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin reservas aún"
              description="Todavía no tenés ninguna reserva de clase. ¡Explorá la agenda y reservá tu lugar!"
              actionLabel="Ver clases disponibles"
              onAction={() => setActiveTab('disponibles')}
            />
          ) : (
            <div className="space-y-3">
              {reservasSocio.map((reserva) => (
                <ReservaClaseItem
                  key={reserva.idReservaClase}
                  reserva={reserva}
                  listaEspera={getEspera(reserva.clase.idClase)}
                  isLoading={reservaLoadingId === reserva.idReservaClase}
                  onCancelar={(id) => void handleCancelarReserva(id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          TAB 3: AGENDA ADMIN
          GERENTE edita y elimina; GERENTE y RECEPCIONISTA ven inscriptos y espera.
      ──────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'agenda-admin' && (
        <AgendaSemanal
          clases={clases}
          onEdit={puedeGestionarClases ? handleOpenEdit : undefined}
          onDelete={puedeGestionarClases ? handleRequestDelete : undefined}
          onVerInscriptos={setClaseInscriptos}
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

      {/* ── Modal: Inscriptos y lista de espera (admin) ────────────────────── */}
      <Modal
        isOpen={Boolean(claseInscriptos)}
        onClose={() => setClaseInscriptos(undefined)}
        title={claseInscriptos?.nombreActividad ?? 'Inscriptos'}
        subtitle="Inscriptos y lista de espera"
        icon={Dumbbell}
        size="md"
      >
        {claseInscriptos && <InscriptosClase clase={claseInscriptos} />}
      </Modal>

      {/* ── Confirm Delete Dialog (admin) ──────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setClaseToDelete(undefined); }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Clase"
        description={
          claseToDelete
            ? `¿Estás seguro de que querés eliminar "${claseToDelete.nombreActividad}"? Esta acción no se puede deshacer y no está permitida si la clase tiene reservas confirmadas.`
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
