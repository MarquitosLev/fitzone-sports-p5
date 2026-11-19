/**
 * CanchasPage.tsx — Página principal del Módulo de Canchas (RF-10, RF-11, RF-09, RF-12).
 *
 * Secciones:
 * 1. Reservar Cancha: Flujo de selección de cancha → fecha → turno → confirmar con cotización y desglose.
 * 2. Mis Reservas: Gestión de turnos reservados, estados, comprobantes y cancelación.
 * 3. Gestión de Canchas: Administración de inventario, altas, ediciones y mantenimiento.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Wrench,
  CheckCircle2,
  Calendar,
  Clock,
} from 'lucide-react';
import { Button, Modal, Spinner, Alert, EmptyState, DataTable, Badge } from '../components/ui';
import type { Column } from '../components/ui';
import {
  CanchaCard,
  CanchaForm,
  ReservaCanchaView,
  MisReservasView,
} from '../components/canchas';
import type { CanchaFormModo } from '../components/canchas';
import {
  listarCanchas,
  crearCancha,
  actualizarCancha,
  cambiarMantenimiento,
} from '../services/canchasService';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTienePrestacion } from '../hooks/usePrestaciones';
import type { CanchaDTO, CanchaFormData } from '../types';
import { formatearMonto } from '../utils/formatters';

export type CanchasTab = 'reservar' | 'mis-reservas' | 'admin';

export interface CanchasPageProps {
  initialTab?: CanchasTab;
  fechaInicial?: string;
}

export function CanchasPage({ initialTab, fechaInicial }: CanchasPageProps) {
  const { sedeActiva, sedes, setSedeActiva } = useSede();
  const { addToast } = useToast();
  const { usuario, isLoading: authLoading } = useAuth();

  const esSocio = usuario?.tipoUsuario === 'SOCIO';
  const esExterno = usuario?.tipoUsuario === 'EXTERNO';
  const esInvitado = !authLoading && !usuario;
  const esGerente = usuario?.tipoUsuario === 'GERENTE';
  const esRecepcionista = usuario?.tipoUsuario === 'RECEPCIONISTA';

  const tieneVerCanchas = useTienePrestacion('CANCHAS_VER');
  const tieneAdminCanchas = useTienePrestacion('CANCHAS_ADMIN') || esGerente;
  const puedeAdminCanchas = tieneAdminCanchas || (!usuario && initialTab === 'admin');

  // El personal directivo (GERENTE o rol con administración que no es socio) solo opera 'admin'
  const soloAdmin = puedeAdminCanchas && !esSocio;

  // Quiénes pueden ver la sección de reservas (grilla de disponibilidad y turnos):
  // Socios, invitados, clientes externos y usuarios con CANCHAS_VER que no sean solo admin (ej. recepcionistas)
  const puedeVerReservas = (tieneVerCanchas || esSocio || esExterno || esInvitado) && !soloAdmin;

  // Quiénes pueden ver "Mis Reservas": clientes (socios, externos e invitados sin sesión)
  const puedeVerMisReservas = (esSocio || esExterno || esInvitado) && !esRecepcionista && !soloAdmin;

  // Si el usuario es de gestión exclusiva de admin, forzar 'admin' aunque se proporcione initialTab="reservar"
  const tabPorDefecto: CanchasTab = soloAdmin
    ? 'admin'
    : initialTab === 'admin' && !puedeAdminCanchas
      ? 'reservar'
      : initialTab === 'mis-reservas' && !puedeVerMisReservas
        ? 'reservar'
        : (initialTab ?? 'reservar');
  const [seccionActiva, setSeccionActiva] = useState<CanchasTab>(tabPorDefecto);

  // Efecto de sincronización de permisos y rol:
  // 1. Si el rol es solo admin, forzar a 'admin'.
  // 2. Si se pierde o revoca el permiso de administración mientras se está en 'admin', volver a 'reservar'.
  // 3. Si se está en 'mis-reservas' sin permiso para esa pestaña, volver a 'reservar'.
  useEffect(() => {
    if (soloAdmin && seccionActiva !== 'admin') {
      setSeccionActiva('admin');
    } else if (!puedeAdminCanchas && seccionActiva === 'admin') {
      setSeccionActiva('reservar');
    } else if (!puedeVerMisReservas && seccionActiva === 'mis-reservas') {
      setSeccionActiva('reservar');
    }
  }, [soloAdmin, puedeAdminCanchas, puedeVerMisReservas, seccionActiva]);

  // Sincronizar la sede activa con la sede asignada del operador o gerente autenticado
  useEffect(() => {
    if (
      usuario?.idSede &&
      (esGerente || esRecepcionista) &&
      sedeActiva?.idSede !== usuario.idSede
    ) {
      const sedeDelOperador = sedes.find((s) => s.idSede === usuario.idSede);
      if (sedeDelOperador) {
        setSedeActiva(sedeDelOperador);
      }
    }
  }, [usuario, esGerente, esRecepcionista, sedeActiva, sedes, setSedeActiva]);

  // Sede efectiva para evitar consultas a otra sede durante transiciones de estado
  const sedeEfectiva = useMemo(() => {
    if (
      usuario?.idSede &&
      (esGerente || esRecepcionista)
    ) {
      return sedes.find((s) => s.idSede === usuario.idSede) ?? sedeActiva;
    }
    return sedeActiva;
  }, [usuario, esGerente, esRecepcionista, sedes, sedeActiva]);

  const [canchas, setCanchas] = useState<CanchaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros y Vista para Administración
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'DISPONIBLE' | 'MANTENIMIENTO'>('TODOS');

  // Modal Alta / Edición
  const [modalOpen, setModalOpen] = useState(false);
  const [modalModo, setModalModo] = useState<CanchaFormModo>('alta');
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<CanchaDTO | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar Canchas con protección contra race conditions al cambiar de sede
  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      if (!sedeEfectiva) return;
      setLoading(true);
      setError(null);
      try {
        const idSedePedida = sedeEfectiva.idSede;
        const data = await listarCanchas(idSedePedida);
        if (!cancelado && sedeEfectiva.idSede === idSedePedida) {
          setCanchas(data);
        }
      } catch (err: unknown) {
        if (!cancelado) {
          const mensaje = err instanceof Error ? err.message : 'Error al cargar canchas';
          setError(mensaje);
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    };

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [sedeEfectiva?.idSede]);

  // Manejo de toggle de mantenimiento
  const handleToggleMantenimiento = async (idCancha: number, nuevoEstado: boolean) => {
    try {
      const actualizada = await cambiarMantenimiento(idCancha, nuevoEstado);
      setCanchas((prev) =>
        prev.map((c) => (c.idCancha === idCancha ? actualizada : c))
      );
      addToast({
        type: 'success',
        title: nuevoEstado ? 'Cancha en mantenimiento' : 'Cancha habilitada',
        message: nuevoEstado
          ? `"${actualizada.nombre}" fue puesta en mantenimiento. Las reservas existentes se mantienen.`
          : `"${actualizada.nombre}" ahora está disponible para reservas.`,
      });
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo actualizar el estado de mantenimiento';
      addToast({
        type: 'error',
        title: 'Error de mantenimiento',
        message: mensaje,
      });
    }
  };

  // Abrir modal de alta
  const handleNuevaCancha = () => {
    setCanchaSeleccionada(null);
    setModalModo('alta');
    setFormError(null);
    setModalOpen(true);
  };

  // Abrir modal de edición
  const handleEditarCancha = (cancha: CanchaDTO) => {
    setCanchaSeleccionada(cancha);
    setModalModo('edicion');
    setFormError(null);
    setModalOpen(true);
  };

  // Submit del formulario (alta o edición)
  const handleSubmitForm = async (datos: CanchaFormData) => {
    if (!sedeEfectiva) return;
    setFormLoading(true);
    setFormError(null);

    try {
      if (modalModo === 'alta') {
        const nueva = await crearCancha(sedeEfectiva.idSede, datos, sedeEfectiva.nombre);
        setCanchas((prev) => [...prev, nueva]);
        addToast({
          type: 'success',
          title: 'Cancha creada',
          message: `La cancha "${nueva.nombre}" fue creada exitosamente en ${sedeEfectiva.nombre}.`,
        });
      } else if (canchaSeleccionada) {
        const actualizada = await actualizarCancha(canchaSeleccionada.idCancha, datos);
        setCanchas((prev) =>
          prev.map((c) => (c.idCancha === canchaSeleccionada.idCancha ? actualizada : c))
        );
        addToast({
          type: 'success',
          title: 'Cancha actualizada',
          message: `La cancha "${actualizada.nombre}" fue actualizada correctamente.`,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'Error al guardar los datos de la cancha';
      setFormError(mensaje);
    } finally {
      setFormLoading(false);
    }
  };

  // Canchas filtradas
  const canchasFiltradas = useMemo(() => {
    return canchas.filter((c) => {
      const matchTipo = filtroTipo === 'TODOS' || c.tipo === filtroTipo;
      const matchEstado =
        filtroEstado === 'TODOS' ||
        (filtroEstado === 'DISPONIBLE' && !c.enMantenimiento) ||
        (filtroEstado === 'MANTENIMIENTO' && c.enMantenimiento);
      return matchTipo && matchEstado;
    });
  }, [canchas, filtroTipo, filtroEstado]);

  // Resumen métricas
  const totalCanchas = canchas.length;
  const canchasDisponibles = canchas.filter((c) => !c.enMantenimiento).length;
  const canchasMantenimiento = canchas.filter((c) => c.enMantenimiento).length;

  // Columnas para DataTable
  const TABLE_COLUMNS: Column<CanchaDTO>[] = [
    { key: 'idCancha', header: 'ID', width: 60, align: 'center' },
    {
      header: 'Nombre de la cancha',
      render: (row) => (
        <div>
          <span className="font-bold text-[#1B2A55] block">{row.nombre}</span>
          <span className="text-xs text-slate-400">{row.sede?.nombre}</span>
        </div>
      ),
    },
    {
      header: 'Deporte / Tipo',
      align: 'center',
      render: (row) => (
        <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
          {row.tipo ?? 'Otro'}
        </span>
      ),
    },
    {
      header: 'Precio / Hora',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-[#1B2A55] font-outfit">
          {formatearMonto(row.precioBaseHora)}
        </span>
      ),
    },
    {
      header: 'Estado',
      align: 'center',
      render: (row) => (
        <Badge variant={row.enMantenimiento ? 'red-soft' : 'green-soft'}>
          {row.enMantenimiento ? 'En mantenimiento' : 'Disponible'}
        </Badge>
      ),
    },
    {
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleEditarCancha(row)}
        >
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Pestañas de Navegación del Módulo.
          - Reservar / Mis Reservas: socios, externos e invitados (puedeVerReservas).
          - Gestión de Canchas: roles con CANCHAS_ADMIN o GERENTE (puedeAdminCanchas, solo mientras sea true).
          - Recepcionistas (CANCHAS_VER, sin admin): ven Reservar Cancha para consultar disponibilidad. */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto scrollbar-none">

        {/* Pestaña Reservar — disponible cuando no es rol exclusivo de gestión */}
        {puedeVerReservas && (
          <button
            type="button"
            role="tab"
            aria-selected={seccionActiva === 'reservar'}
            onClick={() => setSeccionActiva('reservar')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              seccionActiva === 'reservar'
                ? 'bg-fitzone-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-fitzone-navy hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-fitzone-coral" />
            <span>Reservar Cancha</span>
          </button>
        )}

        {/* Pestaña Mis Reservas — solo para clientes (socios, externos e invitados) */}
        {puedeVerMisReservas && (
          <button
            type="button"
            role="tab"
            aria-selected={seccionActiva === 'mis-reservas'}
            onClick={() => setSeccionActiva('mis-reservas')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              seccionActiva === 'mis-reservas'
                ? 'bg-fitzone-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-fitzone-navy hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#F0B429]" />
            <span>Mis Reservas</span>
          </button>
        )}

        {/* Pestaña Gestión — solo mientras puedeAdminCanchas sea true (revocación reactiva) */}
        {puedeAdminCanchas && (
          <button
            type="button"
            role="tab"
            aria-selected={seccionActiva === 'admin'}
            onClick={() => setSeccionActiva('admin')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              seccionActiva === 'admin'
                ? 'bg-fitzone-navy text-white shadow-xs'
                : 'text-slate-600 hover:text-fitzone-navy hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Gestión de Canchas</span>
          </button>
        )}
      </div>

      {/* SECCIÓN 1: RESERVAR CANCHA
          Acceso: socios (con cuenta), externos (con cuenta) e invitados confirmados (!authLoading && !usuario).
          Los recepcionistas con CANCHAS_VER también pueden ver disponibilidad (puedeVerReservas=true,
          pero onVerMisReservas=undefined y onReservaExitosa=undefined porque no tienen 'mis-reservas'). */}
      {seccionActiva === 'reservar' && puedeVerReservas && (
        <ReservaCanchaView
          fechaInicial={fechaInicial}
          onVerMisReservas={(esSocio || esExterno) && puedeVerMisReservas
            ? () => setSeccionActiva('mis-reservas')
            : undefined}
          onReservaExitosa={puedeVerMisReservas
            ? () => setSeccionActiva('mis-reservas')
            : undefined}
        />
      )}

      {/* SECCIÓN 2: MIS RESERVAS
          Acceso: socios, externos e invitados confirmados. */}
      {seccionActiva === 'mis-reservas' && puedeVerMisReservas && (
        <MisReservasView
          onNuevaReserva={() => setSeccionActiva('reservar')}
        />
      )}

      {/* SECCIÓN 3: GESTIÓN DE CANCHAS Y MANTENIMIENTO (SCRUM-80)
          Solo se renderiza si puedeAdminCanchas es TRUE y la sección activa es 'admin'.
          Si puedeAdminCanchas se revoca, el useEffect mueve seccionActiva y este bloque
          deja de renderizarse: controles admin desaparecen aunque la URL no cambie. */}
      {seccionActiva === 'admin' && puedeAdminCanchas && (
        <div className="space-y-6 animate-fade-in">
          {/* Encabezado Principal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F26D6D]/10 text-fitzone-coral flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-fitzone-navy font-outfit">
                    Gestión de Canchas
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Sede activa: <strong className="text-fitzone-navy">{sedeEfectiva?.nombre ?? 'Sin sede'}</strong>
                  </p>
                </div>
              </div>
            </div>

            {puedeAdminCanchas && (
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <Button
                type="button"
                variant="coral"
                leftIcon={Plus}
                onClick={handleNuevaCancha}
              >
                Nueva Cancha
              </Button>
            </div>
            )}
          </div>

          {/* Tarjetas de Métricas Rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total Canchas
                </span>
                <span className="text-2xl font-black text-[#1B2A55] font-outfit mt-0.5 block">
                  {totalCanchas}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#1B2A55] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#2E9E5B] uppercase tracking-wider block">
                  Habilitadas
                </span>
                <span className="text-2xl font-black text-[#2E9E5B] font-outfit mt-0.5 block">
                  {canchasDisponibles}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] text-[#2E9E5B] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#B7791F] uppercase tracking-wider block">
                  En Mantenimiento
                </span>
                <span className="text-2xl font-black text-[#B7791F] font-outfit mt-0.5 block">
                  {canchasMantenimiento}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FEF7E6] text-[#B7791F] flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Modo de Vista */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 pl-1 mr-2">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar:</span>
              </div>

              {/* Filtro por Estado */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFiltroEstado('TODOS')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    filtroEstado === 'TODOS'
                      ? 'bg-white text-[#1B2A55] shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('DISPONIBLE')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    filtroEstado === 'DISPONIBLE'
                      ? 'bg-white text-[#2E9E5B] shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Disponibles
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('MANTENIMIENTO')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    filtroEstado === 'MANTENIMIENTO'
                      ? 'bg-white text-[#B7791F] shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mantenimiento
                </button>
              </div>

              {/* Filtro por Deporte */}
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="text-xs font-semibold text-[#1B2A55] bg-slate-100 border border-transparent rounded-xl px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A55]/20 cursor-pointer"
                aria-label="Filtrar por deporte"
              >
                <option value="TODOS">Todos los deportes</option>
                <option value="PADEL">Pádel</option>
                <option value="FUTBOL_5">Fútbol 5</option>
                <option value="FUTBOL_7">Fútbol 7</option>
                <option value="TENIS">Tenis</option>
                <option value="BASQUET">Básquetbol</option>
                <option value="OTRO">Otro deporte</option>
              </select>
            </div>

            {/* Toggle Vista Grid vs Tabla */}
            <div className="flex items-center gap-1 self-end md:self-auto border-l border-slate-100 pl-3">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Vista de Tarjetas"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#1B2A55] text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Vista de Tabla"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#1B2A55] text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error de carga */}
          {error && <Alert type="error" title="Error al cargar canchas" message={error} />}

          {/* Estado de carga */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" />
              <p className="text-xs text-slate-500 font-semibold mt-3">
                Cargando canchas de la sede...
              </p>
            </div>
          )}

          {/* Contenido Principal */}
          {!loading && !error && (
            <>
              {canchasFiltradas.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  title="No se encontraron canchas"
                  description={
                    canchas.length === 0
                      ? 'Esta sede aún no tiene canchas registradas. Comenzá creando la primera con el botón "Nueva Cancha".'
                      : 'No hay ninguna cancha que coincida con los filtros seleccionados.'
                  }
                  actionLabel={canchas.length === 0 ? 'Crear primera cancha' : 'Limpiar filtros'}
                  actionIcon={canchas.length === 0 ? Plus : undefined}
                  onAction={() => {
                    if (canchas.length === 0) {
                      handleNuevaCancha();
                    } else {
                      setFiltroTipo('TODOS');
                      setFiltroEstado('TODOS');
                    }
                  }}
                />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {canchasFiltradas.map((cancha) => (
                    <CanchaCard
                      key={cancha.idCancha}
                      cancha={cancha}
                      onEditar={handleEditarCancha}
                      onToggleMantenimiento={handleToggleMantenimiento}
                      showAdminControls={puedeAdminCanchas}
                    />
                  ))}
                </div>
              ) : (
                <DataTable<CanchaDTO>
                  columns={TABLE_COLUMNS}
                  data={canchasFiltradas}
                  keyExtractor={(row) => row.idCancha}
                  emptyTitle="Sin canchas"
                  emptyMessage="No hay canchas para mostrar con los filtros aplicados."
                />
              )}
            </>
          )}

          {/* Modal de Alta / Edición */}
          <Modal
            isOpen={modalOpen}
            onClose={() => {
              if (!formLoading) setModalOpen(false);
            }}
            size="md"
            title={modalModo === 'alta' ? 'Nueva Cancha' : 'Editar Cancha'}
            subtitle={
              modalModo === 'alta'
                ? `Registrar una nueva cancha para ${sedeEfectiva?.nombre ?? 'la sede activa'}`
                : `Modificar datos de "${canchaSeleccionada?.nombre ?? ''}"`
            }
          >
            <CanchaForm
              modo={modalModo}
              valoresIniciales={canchaSeleccionada ?? undefined}
              onSubmit={handleSubmitForm}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
              errorNegocio={formError}
            />
          </Modal>
        </div>
      )}
    </div>
  );
}
