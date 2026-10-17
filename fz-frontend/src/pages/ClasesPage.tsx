/**
 * ClasesPage.tsx — Página del módulo Clases Grupales (RF-06).
 * Gerente: visualiza la agenda semanal, programa nuevas clases,
 * edita y elimina clases existentes con confirmación.
 */

import { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';
import { Spinner, Alert, Badge, Button, Modal, ConfirmDialog } from '../components/ui';
import type { Column } from '../components/ui';
import { listarClases, crearClase, actualizarClase, eliminarClase } from '../services/clasesService';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import type { ClaseGrupalDTO } from '../types';
import { formatearFechaHora } from '../utils/formatters';
import { AgendaSemanal } from '../components/clases/AgendaSemanal';
import { ClaseForm } from '../components/clases/ClaseForm';
import type { ClaseFormPayload } from '../components/clases/ClaseForm';

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

export function ClasesPage() {
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [data, setData] = useState<ClaseGrupalDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Form / modal state ───────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [selectedClase, setSelectedClase] = useState<ClaseGrupalDTO | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Confirm delete state ─────────────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);
  const [claseToDelete, setClaseToDelete] = useState<ClaseGrupalDTO | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load classes on sede change ───────────────────────────────────────────────
  useEffect(() => {
    if (!sedeActiva) return;
    let cancelled = false;

    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listarClases(sedeActiva.idSede);
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar clases');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void cargar();
    return () => { cancelled = true; };
  }, [sedeActiva]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const handleOpenNew = () => {
    setSelectedClase(undefined);
    setFormError(null);
    setShowForm(true);
  };

  const handleOpenEdit = (clase: ClaseGrupalDTO) => {
    setSelectedClase(clase);
    setFormError(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedClase(undefined);
    setFormError(null);
  };

  const handleSubmitForm = async (payload: ClaseFormPayload) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (selectedClase) {
        // Edición: reconstruct full DTO merging sede from original
        const claseActualizada: ClaseGrupalDTO = {
          ...selectedClase,
          ...payload,
          sede: selectedClase.sede,
        };
        const updated = await actualizarClase(claseActualizada);
        setData((prev) => prev.map((c) => (c.idClase === updated.idClase ? updated : c)));
        addToast({ type: 'success', title: 'Clase actualizada', message: `"${updated.nombreActividad}" fue actualizada correctamente.` });
      } else {
        // Alta: use sede activa
        const nuevaClase: Omit<ClaseGrupalDTO, 'idClase'> = {
          nombreActividad: payload.nombreActividad,
          fechaHoraInicio: payload.fechaHoraInicio,
          duracionMinutos: payload.duracionMinutos,
          cupoMaximo: payload.cupoMaximo,
          cupoDisponible: payload.cupoMaximo,
          sede: sedeActiva!,
        };
        const creada = await crearClase(nuevaClase);
        setData((prev) => [...prev, creada]);
        addToast({ type: 'success', title: 'Clase programada', message: `"${creada.nombreActividad}" fue programada exitosamente.` });
      }
      handleCloseForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar la clase';
      setFormError(msg);
      // Don't close the form — show the error inside it
    } finally {
      setFormLoading(false);
    }
  };

  const handleRequestDelete = (clase: ClaseGrupalDTO) => {
    setClaseToDelete(clase);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!claseToDelete) return;
    setDeleteLoading(true);
    try {
      await eliminarClase(claseToDelete.idClase);
      setData((prev) => prev.filter((c) => c.idClase !== claseToDelete.idClase));
      addToast({ type: 'info', title: 'Clase eliminada', message: `"${claseToDelete.nombreActividad}" fue eliminada de la agenda.` });
    } catch (e: unknown) {
      addToast({ type: 'error', title: 'Error al eliminar', message: e instanceof Error ? e.message : 'No se pudo eliminar la clase.' });
    } finally {
      setDeleteLoading(false);
      setShowConfirm(false);
      setClaseToDelete(undefined);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Dumbbell className="w-6 h-6 text-fitzone-coral" />
          <h1 className="text-2xl font-black text-fitzone-navy font-outfit">Clases Grupales</h1>
        </div>
        <Button
          id="btn-programar-nueva-clase"
          variant="coral"
          onClick={handleOpenNew}
        >
          Programar Nueva Clase
        </Button>
      </div>

      {/* Error banner */}
      {error && <Alert type="error" title="Error al cargar" message={error} />}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Weekly agenda grid */}
      {!loading && (
        <AgendaSemanal
          clases={data}
          onEdit={handleOpenEdit}
          onDelete={handleRequestDelete}
        />
      )}

      {/* ── Modal: Create / Edit ──────────────────────────────────────────── */}
      <Modal
        isOpen={showForm}
        onClose={formLoading ? undefined : handleCloseForm}
        title={selectedClase ? 'Editar Clase' : 'Programar Nueva Clase'}
        subtitle={
          selectedClase
            ? `Modificando: ${selectedClase.nombreActividad}`
            : 'Completá los datos para agregar una nueva clase a la agenda'
        }
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

      {/* ── Confirm Delete Dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setClaseToDelete(undefined);
        }}
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
