/**
 * MembresiasPage.tsx — Pantalla de Gestión de Membresías (Historia de Usuario RF-02).
 *
 * Funcionalidades:
 *   1. Catálogo de Planes: Visualización de las tarifas vigentes con PlanCard y botón de acción.
 *   2. Estado de Membresía de Socio: Búsqueda por DNI con BuscadorDni y despliegue del estado actual
 *      con UsuarioPerfilHeader, MembresiaEstadoCard (StatusBadge, vencimiento, días restantes y alerta si < 7 días).
 *   3. Transiciones y Acciones: Barra AccionesMembresia con transiciones válidas según estado (Renovar,
 *      Suspender, Reactivar, Cancelar) y ConfirmDialog.
 *   4. Alta / Renovación: Flujo modal para asociar o renovar un plan a un socio.
 *   5. Listado General: DataTable con las membresías registradas en la sede activa.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CreditCard, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DataTable, Spinner, Alert, Button, Modal, TextField, StatusBadge } from '../components/ui';
import type { Column } from '../components/ui';
import { PlanCard, MembresiaEstadoCard, AccionesMembresia } from '../components/membresias';
import { BuscadorDni, UsuarioPerfilHeader } from '../components/usuarios';
import {
  listarMembresias,
  listarPlanes,
  obtenerMembresiaPorUsuario,
  renovarMembresia,
  cambiarEstadoMembresia,
  crearMembresia,
} from '../services/membresiasService';
import { buscarUsuariosPorDni } from '../services/usuariosService';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import type { MembresiaDTO, PlanDTO, UsuarioDTO, EstadoMembresia } from '../types';
import { formatearFecha, formatearMonto } from '../utils/formatters';

export function MembresiasPage() {
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  // Estados de datos
  const [planes, setPlanes] = useState<PlanDTO[]>([]);
  const [membresias, setMembresias] = useState<MembresiaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Socio actualmente seleccionado para gestión individual
  const [socioSeleccionado, setSocioSeleccionado] = useState<UsuarioDTO | null>(null);
  const [membresiaSocio, setMembresiaSocio] = useState<MembresiaDTO | null>(null);
  const [cargandoSocio, setCargandoSocio] = useState(false);

  // Estados de Modal de Alta / Renovación
  const [isModalAltaOpen, setIsModalAltaOpen] = useState(false);
  const [modalSocio, setModalSocio] = useState<UsuarioDTO | null>(null);
  const [modalIdPlan, setModalIdPlan] = useState<number>(1);
  const [modalFechaInicio, setModalFechaInicio] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [busquedaModalSocios, setBusquedaModalSocios] = useState<UsuarioDTO[]>([]);
  const [buscandoSociosModal, setBuscandoSociosModal] = useState(false);

  // Carga inicial de catálogo de planes y membresías de la sede activa
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [planesData, membresiasData] = await Promise.all([
        listarPlanes(),
        listarMembresias(sedeActiva?.idSede),
      ]);
      setPlanes(planesData);
      setMembresias(membresiasData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar información de membresías');
    } finally {
      setLoading(false);
    }
  }, [sedeActiva]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Cargar la membresía del socio seleccionado cuando cambia
  const refrescarMembresiaSocio = useCallback(async (usuario: UsuarioDTO) => {
    setCargandoSocio(true);
    try {
      const m = await obtenerMembresiaPorUsuario(usuario.idUsuario);
      setMembresiaSocio(m);
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error al consultar membresía',
        message: err instanceof Error ? err.message : 'No se pudo obtener el estado actual.',
      });
    } finally {
      setCargandoSocio(false);
    }
  }, [addToast]);

  const handleSeleccionarSocio = (usuario: UsuarioDTO) => {
    setSocioSeleccionado(usuario);
    void refrescarMembresiaSocio(usuario);
  };

  const handleDeseleccionarSocio = () => {
    setSocioSeleccionado(null);
    setMembresiaSocio(null);
  };

  // Búsqueda de socio por DNI en la vista principal
  const handleBuscarDni = async (dni: string) => {
    if (!dni.trim()) return;
    setCargandoSocio(true);
    try {
      const usuarios = await buscarUsuariosPorDni(dni);
      const socioEncontrado = usuarios.find((u) => u.dni.trim() === dni.trim()) || usuarios[0];
      if (socioEncontrado) {
        handleSeleccionarSocio(socioEncontrado);
        addToast({
          type: 'info',
          title: 'Socio localizado',
          message: `${socioEncontrado.nombre} ${socioEncontrado.apellido} (DNI ${socioEncontrado.dni})`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Socio no encontrado',
          message: `No se encontró ningún usuario con DNI ${dni}.`,
        });
      }
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error en la búsqueda',
        message: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setCargandoSocio(false);
    }
  };

  // Acciones sobre la membresía del socio
  const handleRenovar = async () => {
    if (!membresiaSocio) return;
    try {
      const renovada = await renovarMembresia(membresiaSocio.idMembresia);
      setMembresiaSocio(renovada);
      void cargarDatos();
      addToast({
        type: 'success',
        title: 'Membresía renovada',
        message: `Se renovó exitosamente el ${renovada.plan.nombre}. Nuevo vencimiento: ${formatearFecha(renovada.fechaVencimiento)}.`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'No se pudo renovar',
        message: err instanceof Error ? err.message : 'Ocurrió un error al procesar la renovación.',
      });
    }
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoMembresia) => {
    if (!membresiaSocio) return;
    try {
      const actualizada = await cambiarEstadoMembresia(membresiaSocio.idMembresia, nuevoEstado);
      setMembresiaSocio(actualizada);
      void cargarDatos();
      addToast({
        type: 'success',
        title: 'Estado actualizado',
        message: `La membresía ahora se encuentra en estado: ${nuevoEstado}.`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'No se pudo cambiar el estado',
        message: err instanceof Error ? err.message : 'Ocurrió un error al actualizar la membresía.',
      });
    }
  };

  // Abrir modal de alta / renovación
  const handleAbrirModalAlta = (planInicial?: PlanDTO) => {
    if (planInicial) {
      setModalIdPlan(planInicial.idPlan);
    } else if (planes.length > 0) {
      setModalIdPlan(planes[0].idPlan);
    }
    setModalSocio(socioSeleccionado);
    setModalFechaInicio(new Date().toISOString().split('T')[0]);
    setBusquedaModalSocios([]);
    setIsModalAltaOpen(true);
  };

  // Buscar socio dentro del modal
  const handleBuscarSocioModal = async (dni: string) => {
    if (!dni.trim()) {
      setBusquedaModalSocios([]);
      return;
    }
    setBuscandoSociosModal(true);
    try {
      const resultados = await buscarUsuariosPorDni(dni);
      setBusquedaModalSocios(resultados);
    } catch {
      setBusquedaModalSocios([]);
    } finally {
      setBuscandoSociosModal(false);
    }
  };

  // Enviar alta o renovación desde el modal
  const handleConfirmarModal = async () => {
    if (!modalSocio) {
      addToast({
        type: 'warning',
        title: 'Socio requerido',
        message: 'Por favor, busque y seleccione el socio que recibirá la membresía.',
      });
      return;
    }

    setIsSubmittingModal(true);
    try {
      const tieneMembresiaRenovable =
        membresiaSocio &&
        membresiaSocio.usuario.idUsuario === modalSocio.idUsuario &&
        membresiaSocio.estado !== 'CANCELADO';

      const nueva = tieneMembresiaRenovable
        ? await renovarMembresia(membresiaSocio.idMembresia, modalIdPlan)
        : await crearMembresia({
            idUsuario: modalSocio.idUsuario,
            idPlan: modalIdPlan,
            fechaInicio: modalFechaInicio,
          });

      setIsModalAltaOpen(false);
      setSocioSeleccionado(modalSocio);
      setMembresiaSocio(nueva);
      void cargarDatos();

      addToast({
        type: 'success',
        title: 'Membresía asignada con éxito',
        message: `${modalSocio.nombre} ${modalSocio.apellido} ahora tiene asignado el ${nueva.plan.nombre}.`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error al asociar membresía',
        message: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // Columnas para el DataTable general de membresías de la sede
  const columnasTabla: Column<MembresiaDTO>[] = useMemo(
    () => [
      {
        key: 'idMembresia',
        header: 'ID',
        width: 70,
        align: 'center',
        render: (row) => (
          <span className="font-mono text-xs font-bold text-slate-500">
            #{row.idMembresia}
          </span>
        ),
      },
      {
        header: 'Socio',
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-fitzone-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
              {row.usuario.nombre[0]}
              {row.usuario.apellido[0]}
            </div>
            <div>
              <div className="font-bold text-fitzone-navy text-sm">
                {row.usuario.nombre} {row.usuario.apellido}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                DNI {row.usuario.dni}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: 'Plan Contratado',
        render: (row) => (
          <div>
            <span className="font-bold text-fitzone-navy text-sm block">
              {row.plan.nombre}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {formatearMonto(row.plan.precioBase)}
            </span>
          </div>
        ),
      },
      {
        header: 'Inicio',
        render: (row) => (
          <span className="text-xs font-medium text-slate-600">
            {formatearFecha(row.fechaInicio)}
          </span>
        ),
      },
      {
        header: 'Vencimiento',
        render: (row) => (
          <span className="text-xs font-bold text-fitzone-navy">
            {formatearFecha(row.fechaVencimiento)}
          </span>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        align: 'center',
        render: (row) => <StatusBadge status={row.estado} showDot size="xs" />,
      },
      {
        header: 'Acción',
        align: 'right',
        render: (row) => (
          <Button
            type="button"
            size="xs"
            variant="secondary"
            onClick={() => handleSeleccionarSocio(row.usuario)}
          >
            Gestionar
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. Cabecera Institucional ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-fitzone-coral/10 text-fitzone-coral flex items-center justify-center shadow-xs">
            <CreditCard className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-fitzone-navy font-outfit tracking-tight">
              Membresías del Socio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Consulta de vigencia, renovaciones, catálogo de planes y administración de estado (RF-02).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="coral"
            size="md"
            leftIcon={Plus}
            onClick={() => handleAbrirModalAlta()}
            className="shadow-sm"
          >
            Asociar / Renovar Plan
          </Button>
        </div>
      </div>

      {error && <Alert type="error" title="Error" message={error} />}

      {/* ── 2. Consulta y Gestión Individual de Socio ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-fitzone-navy font-outfit">
              Gestión de Membresía por Socio
            </h2>
            <p className="text-xs text-slate-500">
              Buscá un socio por su DNI para consultar su estado, vencimiento y realizar renovaciones o cambios de estado.
            </p>
          </div>

          {/* Barra de búsqueda por DNI */}
          <div className="w-full sm:w-80">
            <BuscadorDni
              onSearch={handleBuscarDni}
              placeholder="Buscar socio por DNI (ej: 30123456)..."
            />
          </div>
        </div>

        {cargandoSocio && (
          <div className="flex items-center justify-center p-8 bg-white rounded-3xl border border-slate-100">
            <Spinner size="md" />
            <span className="ml-3 text-xs font-semibold text-slate-500">
              Cargando información del socio...
            </span>
          </div>
        )}

        {!cargandoSocio && socioSeleccionado && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Cabecera del socio seleccionado */}
            <UsuarioPerfilHeader
              usuario={socioSeleccionado}
              sedeNombre={sedeActiva?.nombre}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeseleccionarSocio}
                  >
                    Cambiar Socio
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={RefreshCw}
                    onClick={() => handleAbrirModalAlta()}
                  >
                    Cambiar Plan
                  </Button>
                </div>
              }
            />

            {/* Tarjeta de estado de membresía */}
            <MembresiaEstadoCard
              membresia={membresiaSocio}
              socio={socioSeleccionado}
              onRenovarClick={membresiaSocio ? handleRenovar : () => handleAbrirModalAlta()}
            />

            {/* Barra de acciones si posee membresía */}
            {membresiaSocio && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-fitzone-navy text-sm font-outfit">
                    Acciones de Membresía
                  </h4>
                  <p className="text-xs text-slate-500">
                    Transiciones permitidas según el estado actual ({membresiaSocio.estado}).
                  </p>
                </div>

                <AccionesMembresia
                  estado={membresiaSocio.estado}
                  onRenovar={handleRenovar}
                  onSuspender={() => handleCambiarEstado('SUSPENDIDO')}
                  onReactivar={() => handleCambiarEstado('ACTIVO')}
                  onCancelar={() => handleCambiarEstado('CANCELADO')}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 3. Catálogo de Planes Disponibles ─────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-fitzone-navy font-outfit">
            Catálogo de Planes Vigentes
          </h2>
          <p className="text-xs text-slate-500">
            Tarifas institucionales configuradas para la sede activa. Seleccioná un plan para asociarlo a un socio.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planes.map((plan) => (
              <PlanCard
                key={plan.idPlan}
                plan={plan}
                onSeleccionar={(p) => handleAbrirModalAlta(p)}
                actionLabel="Elegir este Plan"
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Listado General de Membresías en Sede Activa ───────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-fitzone-navy font-outfit">
              Registro General de Membresías ({sedeActiva?.nombre || 'Todas las sedes'})
            </h2>
            <p className="text-xs text-slate-500">
              Historial de socios con membresías registradas. Podés hacer clic en &quot;Gestionar&quot; para abrir el detalle.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <DataTable<MembresiaDTO>
            columns={columnasTabla}
            data={membresias}
            keyExtractor={(row) => row.idMembresia}
            emptyTitle="Sin membresías registradas"
            emptyMessage="No se encontraron socios con membresías en la sede activa."
          />
        )}
      </section>

      {/* ── 5. Modal de Alta / Renovación de Plan ────────────────────────────── */}
      <Modal
        isOpen={isModalAltaOpen}
        onClose={() => !isSubmittingModal && setIsModalAltaOpen(false)}
        size="lg"
      >
        <div className="p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-fitzone-coral/10 text-fitzone-coral">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-fitzone-navy font-outfit">
                  Asociar o Renovar Plan de Membresía
                </h3>
                <p className="text-xs text-slate-500">
                  Seleccioná el socio y el plan tarifario para activar la vigencia.
                </p>
              </div>
            </div>
          </div>

          {/* Selección o Búsqueda de Socio */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              1. Socio Titular
            </label>

            {modalSocio ? (
              <div className="space-y-2">
                <UsuarioPerfilHeader usuario={modalSocio} compact />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setModalSocio(null)}
                >
                  Cambiar de socio
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <BuscadorDni
                  onSearch={handleBuscarSocioModal}
                  placeholder="Buscar socio por DNI para asociar..."
                />

                {buscandoSociosModal && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                    <Spinner size="sm" />
                    <span>Buscando socios...</span>
                  </div>
                )}

                {busquedaModalSocios.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50">
                    {busquedaModalSocios.map((u) => (
                      <div
                        key={u.idUsuario}
                        onClick={() => {
                          setModalSocio(u);
                          setBusquedaModalSocios([]);
                        }}
                        className="flex items-center justify-between p-2.5 bg-white hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-fitzone-navy text-white text-xs font-bold flex items-center justify-center">
                            {u.nombre[0]}
                            {u.apellido[0]}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-fitzone-navy block">
                              {u.nombre} {u.apellido}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              DNI {u.dni}
                            </span>
                          </div>
                        </div>
                        <Button size="xs" variant="secondary">
                          Seleccionar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selección de Plan */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              2. Plan Tarifario a Contratar
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {planes.map((p) => {
                const isSelected = modalIdPlan === p.idPlan;
                return (
                  <div
                    key={p.idPlan}
                    onClick={() => setModalIdPlan(p.idPlan)}
                    className={`
                      p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 flex flex-col justify-between
                      ${
                        isSelected
                          ? 'border-fitzone-coral bg-fitzone-coral/5 ring-2 ring-fitzone-coral/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }
                    `}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-fitzone-navy font-outfit">
                          {p.nombre}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-fitzone-coral" />
                        )}
                      </div>
                      <span className="text-base font-black text-fitzone-navy font-outfit block">
                        {formatearMonto(p.precioBase)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-2">
                      {p.duracionMeses ? `${p.duracionMeses} meses` : 'Mensual'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fecha de Inicio */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              3. Fecha de Inicio de Vigencia
            </label>
            <TextField
              type="date"
              value={modalFechaInicio}
              onChange={(e) => setModalFechaInicio(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Botones de acción del Modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalAltaOpen(false)}
              disabled={isSubmittingModal}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="coral"
              onClick={() => void handleConfirmarModal()}
              isLoading={isSubmittingModal}
              disabled={!modalSocio}
            >
              Confirmar y Activar Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
