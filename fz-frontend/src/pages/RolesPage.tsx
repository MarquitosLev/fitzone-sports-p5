import { Shield } from 'lucide-react';
import { DataTable, Alert } from '../components/ui';
import type { Column } from '../components/ui';
import { listarRoles, CATALOGO_PRESTACIONES } from '../services/rolesService';
import type { RolDTO, Prestacion } from '../types/rol';

const NOMBRE_PRESTACION: Record<string, string> = Object.fromEntries(
  CATALOGO_PRESTACIONES.map((p) => [p.clave, p.nombre])
);

const nombrePrestacion = (clave: Prestacion) => NOMBRE_PRESTACION[clave] ?? clave;

/**
 * Matriz de roles y permisos, de solo lectura. Los roles son los cuatro tipos de usuario
 * del backend y sus permisos siguen los @PreAuthorize de cada endpoint.
 */
export function RolesPage() {
  const roles = listarRoles();

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
      header: 'Permisos',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.prestaciones.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"
            >
              {nombrePrestacion(p)}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-[10px] font-black uppercase text-fitzone-coral tracking-wider">
          GERENCIA
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-fitzone-navy font-outfit mt-1 flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-fitzone-coral" />
          <span>Roles y permisos</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Qué puede hacer cada tipo de usuario en el sistema.
        </p>
      </div>

      <Alert
        type="info"
        title="Roles fijos"
        message="Los roles corresponden a los tipos de usuario del sistema. Para cambiar el rol de una persona, editá su usuario."
      />

      <DataTable<RolDTO>
        columns={columnas}
        data={roles}
        keyExtractor={(row) => row.codigo}
        emptyTitle="Sin roles"
        emptyMessage="No hay roles cargados."
      />
    </div>
  );
}
