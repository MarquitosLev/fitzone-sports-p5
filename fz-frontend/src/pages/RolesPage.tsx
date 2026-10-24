import { useState } from 'react';
import { Shield, ShieldPlus, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { Button, DataTable, Alert } from '../components/ui';
import type { Column } from '../components/ui';
import { listarRoles, crearRolPersonalizado, eliminarRolPersonalizado } from '../services/rolesService';
import { RolFormModal } from '../components/roles/RolFormModal';
import { useToast } from '../context/ToastContext';
import type { RolDTO, CrearRolDTO } from '../types/rol';

export function RolesPage() {
  const { addToast } = useToast();
  const [roles, setRoles] = useState<RolDTO[]>(() => listarRoles());
  const [modalAbierto, setModalAbierto] = useState(false);

  const handleCrear = (datos: CrearRolDTO) => {
    try {
      const nuevo = crearRolPersonalizado(datos);
      setRoles(listarRoles());
      addToast({
        type: 'success',
        title: 'Rol Creado',
        message: `El perfil ${nuevo.nombre} (${nuevo.codigo}) fue registrado con éxito.`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error al crear rol',
        message: err instanceof Error ? err.message : 'No se pudo guardar el rol.',
      });
    }
  };

  const handleEliminar = (codigo: string) => {
    eliminarRolPersonalizado(codigo);
    setRoles(listarRoles());
    addToast({
      type: 'info',
      title: 'Rol eliminado',
      message: `El perfil ${codigo} fue dado de baja.`,
    });
  };

  const columnas: Column<RolDTO>[] = [
    {
      key: 'codigo',
      header: 'Código',
      width: 140,
      render: (row) => (
        <span className="font-mono text-xs font-black text-fitzone-navy bg-slate-100 px-2 py-1 rounded-md">
          {row.codigo}
        </span>
      ),
    },
    {
      key: 'nombre',
      header: 'Nombre y Descripción',
      render: (row) => (
        <div>
          <div className="font-bold text-sm text-fitzone-navy">{row.nombre}</div>
          <div className="text-xs text-slate-400">{row.descripcion}</div>
        </div>
      ),
    },
    {
      header: 'Tipo de Rol',
      width: 140,
      render: (row) =>
        row.esSistema ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
            <Lock className="w-3 h-3 text-slate-400" /> Sistema
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Personalizado
          </span>
        ),
    },
    {
      header: 'Prestaciones',
      width: 120,
      align: 'center',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-600">
          {row.prestaciones.length} activas
        </span>
      ),
    },
    {
      header: 'Acciones',
      width: 100,
      align: 'right',
      render: (row) =>
        row.esSistema ? (
          <span className="text-[11px] text-slate-400 italic">Inmutable</span>
        ) : (
          <Button
            size="xs"
            variant="ghost"
            leftIcon={Trash2}
            onClick={() => handleEliminar(row.codigo)}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
          >
            Quitar
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-fitzone-coral tracking-wider">
              PANEL EXCLUSIVO GERENCIA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-fitzone-navy font-outfit mt-1 flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-fitzone-coral" />
            <span>Niveles de Acceso y Roles Dinámicos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administración del modelo de seguridad RBAC granular por prestaciones de sede (SCRUM-107).
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={ShieldPlus}
          onClick={() => setModalAbierto(true)}
        >
          Nuevo Rol
        </Button>
      </div>

      <Alert
        type="info"
        title="Arquitectura RBAC desacoplada"
        message="Los roles base del sistema son protegidos e inmutables para garantizar la integridad operativa. Al crear un nuevo rol personalizado, sus usuarios heredarán reactivamente los menús y vistas autorizadas sin tocar código."
      />

      <DataTable<RolDTO>
        columns={columnas}
        data={roles}
        keyExtractor={(row) => row.codigo}
        emptyTitle="Sin roles disponibles"
        emptyMessage="No se han cargado roles en el catálogo."
      />

      <RolFormModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSubmit={handleCrear}
      />
    </div>
  );
}
