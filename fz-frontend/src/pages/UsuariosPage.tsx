/**
 * UsuariosPage.tsx — Pantalla de Gestión de Usuarios (Historia de Usuario RF-01).
 *
 * Funcionalidades implementadas para el rol de Recepcionista / Operador:
 *   1. Listado y Filtros: Tabla interactiva con DataTable, buscador por DNI con debounce y filtro por tipo de usuario.
 *   2. Alta de Usuario: Modal con UsuarioForm ('alta') conectado a crearUsuario con feedback vía Toast.
 *   3. Edición de Usuario: Acción por fila que abre Modal con UsuarioForm ('edicion') precargado.
 *   4. Detalle de Usuario: Modal que despliega UsuarioPerfilHeader con la información extendida del cliente o empleado.
 *   5. Manejo de Errores de Negocio: Captura de excepciones (DNI duplicado, Email ya registrado) y feedback al usuario.
 */

import { useState, useMemo } from 'react';
import { Users, UserPlus, Eye, Pencil, RotateCcw, Mail, Phone, ShieldCheck } from 'lucide-react';
import { DataTable, Spinner, Alert, Button, Select, Modal } from '../components/ui';
import type { Column } from '../components/ui';
import {
  BuscadorDni,
  TipoUsuarioBadge,
  UsuarioPerfilHeader,
  UsuarioForm,
} from '../components/usuarios';
import { useUsuarios } from '../hooks/useUsuarios';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { crearUsuario, actualizarUsuario } from '../services/usuariosService';
import type { UsuarioDTO, TipoUsuario, UsuarioFormData } from '../types';

// Opciones del filtro desplegable por rol
const FILTRO_TIPO_OPTIONS = [
  { value: 'TODOS', label: 'Todos los tipos de usuario' },
  { value: 'SOCIO', label: 'Socios' },
  { value: 'EXTERNO', label: 'Clientes Externos' },
  { value: 'RECEPCIONISTA', label: 'Recepcionistas' },
  { value: 'GERENTE', label: 'Gerentes' },
];

export function UsuariosPage() {
  const { sedeActiva, sedes } = useSede();
  const { addToast } = useToast();
  const { usuario: operador } = useAuth();
  const { data: usuarios, loading, error, refetch } = useUsuarios(sedeActiva?.idSede ?? null);
  const puedeEditarUsuario = (u: UsuarioDTO) =>
    !operador || operador.tipoUsuario === 'GERENTE' || (u.tipoUsuario !== 'GERENTE' && u.tipoUsuario !== 'RECEPCIONISTA');

  // Estados de filtrado
  const [filtroDni, setFiltroDni] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<TipoUsuario | 'TODOS'>('TODOS');

  // Estados para Modales
  const [isModalAltaOpen, setIsModalAltaOpen] = useState<boolean>(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<UsuarioDTO | null>(null);
  const [usuarioParaDetalle, setUsuarioParaDetalle] = useState<UsuarioDTO | null>(null);

  // Estado de carga en operaciones asíncronas de modal
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filtrado reactivo en memoria
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      // Filtro por DNI
      const coincideDni = filtroDni.trim() === '' || usuario.dni.includes(filtroDni.trim());

      // Filtro por Rol / Tipo
      const coincideTipo = filtroTipo === 'TODOS' || usuario.tipoUsuario === filtroTipo;

      return coincideDni && coincideTipo;
    });
  }, [usuarios, filtroDni, filtroTipo]);

  // Manejo de Alta de Usuario
  const handleCrearUsuario = async (datos: UsuarioFormData) => {
    setIsSubmitting(true);
    try {
      const nuevo = await crearUsuario(datos);
      setIsModalAltaOpen(false);
      refetch();
      addToast({
        type: 'success',
        title: 'Usuario registrado con éxito',
        message: `${nuevo.nombre} ${nuevo.apellido} fue dado de alta con el rol ${nuevo.tipoUsuario}.`,
      });
    } catch (err: any) {
      // Si el error no es de validación de campo (manejado internamente por UsuarioForm),
      // o para garantizar que siempre se notifique por toast:
      addToast({
        type: 'error',
        title: 'No se pudo crear el usuario',
        message: err.message || 'Verifique los datos ingresados e intente nuevamente.',
      });
      throw err; // Re-lanzar para que UsuarioForm asigne los fieldErrors correspondientes
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejo de Edición de Usuario
  const handleActualizarUsuario = async (datos: UsuarioFormData) => {
    if (!usuarioParaEditar) return;
    setIsSubmitting(true);
    try {
      const actualizado = await actualizarUsuario(usuarioParaEditar.idUsuario, datos);
      setUsuarioParaEditar(null);
      refetch();

      // Si el usuario en detalle era el mismo, actualizamos el modal de detalle también
      if (usuarioParaDetalle?.idUsuario === actualizado.idUsuario) {
        setUsuarioParaDetalle(actualizado);
      }

      addToast({
        type: 'success',
        title: 'Cambios guardados',
        message: `Los datos de ${actualizado.nombre} ${actualizado.apellido} fueron actualizados correctamente.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error al actualizar usuario',
        message: err.message || 'No fue posible guardar los cambios.',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpiar filtros activos
  const handleResetFiltros = () => {
    setFiltroDni('');
    setFiltroTipo('TODOS');
  };

  const hayFiltrosActivos = filtroDni.trim() !== '' || filtroTipo !== 'TODOS';

  // Columnas para la DataTable
  const columns: Column<UsuarioDTO>[] = [
    {
      key: 'idUsuario',
      header: 'ID',
      width: 60,
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400 font-bold">
          #{row.idUsuario}
        </span>
      ),
    },
    {
      header: 'Usuario',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.fotoUrl ? (
            <img
              src={row.fotoUrl}
              alt={`${row.nombre} ${row.apellido}`}
              className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-fitzone-navy font-black font-outfit text-xs flex items-center justify-center shrink-0 border border-slate-200">
              {(row.nombre?.[0] || '').toUpperCase()}
              {(row.apellido?.[0] || '').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <span className="block font-bold text-fitzone-navy text-sm truncate font-manrope">
              {row.nombre} {row.apellido}
            </span>
            <span className="block text-xs text-slate-400 truncate">
              {row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'dni',
      header: 'DNI',
      width: 120,
      render: (row) => (
        <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md">
          {row.dni}
        </span>
      ),
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      width: 140,
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.telefono || '—'}
        </span>
      ),
    },
    {
      header: 'Rol / Tipo',
      align: 'center',
      width: 140,
      render: (row) => (
        <TipoUsuarioBadge tipoUsuario={row.tipoUsuario} size="sm" showDot />
      ),
    },
    {
      header: 'Acciones',
      align: 'right',
      width: 150,
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="xs"
            variant="ghost"
            leftIcon={Eye}
            onClick={() => setUsuarioParaDetalle(row)}
            aria-label={`Ver detalle de ${row.nombre}`}
          >
            Ver
          </Button>
          {puedeEditarUsuario(row) && (
            <Button
              size="xs"
              variant="secondary"
              leftIcon={Pencil}
              onClick={() => setUsuarioParaEditar(row)}
              aria-label={`Editar ${row.nombre}`}
            >
              Editar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ─── ENCABEZADO DE PÁGINA ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-fitzone-navy font-outfit tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administración de socios, invitados y personal —{' '}
            <span className="font-bold text-fitzone-navy">{sedeActiva?.nombre ?? 'FitZone Sports'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="primary"
            leftIcon={UserPlus}
            onClick={() => setIsModalAltaOpen(true)}
            className="shadow-sm hover:shadow-md"
          >
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* ─── BARRA DE HERRAMIENTAS Y FILTROS ────────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-card">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Buscador de DNI */}
          <div className="w-full md:w-96">
            <BuscadorDni
              value={filtroDni}
              onChange={setFiltroDni}
              placeholder="Buscar por DNI..."
            />
          </div>

          {/* Filtro desplegable por Tipo de Usuario y Reset */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-full sm:w-64">
              <Select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as TipoUsuario | 'TODOS')}
                options={FILTRO_TIPO_OPTIONS}
              />
            </div>

            {hayFiltrosActivos && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={RotateCcw}
                onClick={handleResetFiltros}
                className="text-slate-500 hover:text-fitzone-navy"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Resumen de filtros aplicados */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            <span>
              {usuariosFiltrados.length} de {usuarios.length} usuarios registrados
            </span>
          </div>

          {hayFiltrosActivos && (
            <span className="text-fitzone-navy font-semibold">
              Filtro activo: {filtroDni ? `DNI contiene "${filtroDni}"` : ''}
              {filtroDni && filtroTipo !== 'TODOS' ? ' · ' : ''}
              {filtroTipo !== 'TODOS' ? `Rol: ${filtroTipo}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* ─── ESTADOS DE LA TABLA ─────────────────────────────────────────── */}
      {error && (
        <Alert
          type="error"
          title="No se pudieron cargar los usuarios"
          message={error}
        />
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-card">
          <Spinner size="lg" color="navy" />
          <p className="mt-3 text-xs text-slate-400 font-semibold">
            Cargando nómina de usuarios...
          </p>
        </div>
      )}

      {!loading && (
        <DataTable<UsuarioDTO>
          columns={columns}
          data={usuariosFiltrados}
          keyExtractor={(row) => row.idUsuario}
          onRowClick={(row) => setUsuarioParaDetalle(row)}
          emptyTitle="No se encontraron usuarios"
          emptyMessage={
            hayFiltrosActivos
              ? 'No hay registros que coincidan con el DNI o rol seleccionado.'
              : 'Todavía no hay usuarios dados de alta en esta sede.'
          }
          emptyActionLabel={hayFiltrosActivos ? 'Limpiar Filtros' : 'Crear Primer Usuario'}
          onEmptyAction={hayFiltrosActivos ? handleResetFiltros : () => setIsModalAltaOpen(true)}
          pagination
        />
      )}

      {/* ─── MODAL: ALTA DE USUARIO ─────────────────────────────────────── */}
      <Modal
        isOpen={isModalAltaOpen}
        onClose={() => setIsModalAltaOpen(false)}
        title="Dar de Alta Usuario"
        subtitle="Registra un nuevo socio, cliente externo o personal de sede"
        icon={UserPlus}
        size="lg"
      >
        <UsuarioForm
          modo="alta"
          onSubmit={handleCrearUsuario}
          onCancel={() => setIsModalAltaOpen(false)}
          loading={isSubmitting}
          sedesDisponibles={sedes}
        />
      </Modal>

      {/* ─── MODAL: EDICIÓN DE USUARIO ───────────────────────────────────── */}
      <Modal
        isOpen={Boolean(usuarioParaEditar)}
        onClose={() => setUsuarioParaEditar(null)}
        title={`Editar Usuario — ${usuarioParaEditar?.nombre} ${usuarioParaEditar?.apellido}`}
        subtitle="Actualiza los datos personales, contacto y asignación de rol"
        icon={Pencil}
        size="lg"
      >
        {usuarioParaEditar && (
          <UsuarioForm
            modo="edicion"
            valoresIniciales={usuarioParaEditar}
            onSubmit={handleActualizarUsuario}
            onCancel={() => setUsuarioParaEditar(null)}
            loading={isSubmitting}
            sedesDisponibles={sedes}
          />
        )}
      </Modal>

      {/* ─── MODAL: DETALLE / PERFIL DE USUARIO ──────────────────────────── */}
      <Modal
        isOpen={Boolean(usuarioParaDetalle)}
        onClose={() => setUsuarioParaDetalle(null)}
        title="Ficha de Usuario"
        subtitle="Información completa y estado en el sistema FitZone"
        size="lg"
      >
        {usuarioParaDetalle && (
          <div className="space-y-6">
            {/* Cabecera reutilizable UsuarioPerfilHeader */}
            <UsuarioPerfilHeader
              usuario={usuarioParaDetalle}
              sedeNombre={
                sedes.find((s) => s.idSede === usuarioParaDetalle.idSede)?.nombre ||
                sedeActiva?.nombre
              }
              actions={
                puedeEditarUsuario(usuarioParaDetalle) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={Pencil}
                    onClick={() => {
                      const usuario = usuarioParaDetalle;
                      setUsuarioParaDetalle(null);
                      setUsuarioParaEditar(usuario);
                    }}
                  >
                    Editar Datos
                  </Button>
                ) : undefined
              }
            />

            {/* Ficha técnica con datos adicionales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Identificador Interno
                </span>
                <span className="font-mono font-bold text-sm text-fitzone-navy">
                  ID #{usuarioParaDetalle.idUsuario}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Autenticación Supabase
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <ShieldCheck className="w-4 h-4 text-fitzone-green" />
                  <span className="truncate">
                    {usuarioParaDetalle.authId ? usuarioParaDetalle.authId : 'Sin credencial (Externo)'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Correo Electrónico
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{usuarioParaDetalle.email}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Teléfono de Contacto
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{usuarioParaDetalle.telefono || 'Sin registrar'}</span>
                </div>
              </div>
            </div>

            {/* Botón de cierre */}
            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => setUsuarioParaDetalle(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
