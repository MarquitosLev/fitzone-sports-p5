/**
 * UsuariosPage.tsx — Página del módulo Usuarios.
 *
 * Esta es la página "ejemplo" completamente conectada:
 *  - Pide datos al hook (que llama al servicio, que usa mock o API según el flag)
 *  - Muestra los 4 estados: loading (Spinner), error (Alert), vacío (EmptyState), éxito (DataTable)
 *  - Los componentes visuales NO hacen fetch; solo reciben props
 *
 * Flujo de datos:
 *   SedeContext → idSede → useUsuarios → usuariosService → (mock | httpClient) → DataTable
 */

import { Users } from 'lucide-react';
import { DataTable, Spinner, Alert, Badge } from '../components/ui';
import type { Column } from '../components/ui';
import { useUsuarios } from '../hooks/useUsuarios';
import { useSede } from '../context/SedeContext';
import type { UsuarioDTO, TipoUsuario } from '../types';

// Mapa de rol → variante de Badge para mostrar el tipo de usuario con color
const TIPO_USUARIO_LABELS: Record<TipoUsuario, string> = {
  SOCIO: 'Socio',
  EXTERNO: 'Externo',
  RECEPCIONISTA: 'Recepcionista',
  GERENTE: 'Gerente',
};

// Definición de las columnas de la DataTable con su tipo genérico
const COLUMNS: Column<UsuarioDTO>[] = [
  {
    key: 'idUsuario',
    header: 'ID',
    width: 60,
    align: 'center',
  },
  {
    header: 'Nombre completo',
    render: (row) => (
      <span className="font-semibold text-fitzone-navy">
        {row.nombre} {row.apellido}
      </span>
    ),
  },
  {
    key: 'dni',
    header: 'DNI',
  },
  {
    key: 'email',
    header: 'Email',
    render: (row) => (
      <span className="text-slate-500 text-xs">{row.email}</span>
    ),
  },
  {
    header: 'Tipo',
    align: 'center',
    render: (row) => (
      // Usamos Badge para mostrar el rol con un color diferenciado
      <Badge
        variant={
          row.tipoUsuario === 'SOCIO' ? 'green-soft'
          : row.tipoUsuario === 'RECEPCIONISTA' ? 'navy-soft'
          : row.tipoUsuario === 'GERENTE' ? 'navy'
          : 'gold-soft'
        }
      >
        {TIPO_USUARIO_LABELS[row.tipoUsuario]}
      </Badge>
    ),
  },
  {
    key: 'telefono',
    header: 'Teléfono',
    render: (row) => <span className="text-slate-500">{row.telefono}</span>,
  },
];

export function UsuariosPage() {
  const { sedeActiva } = useSede();
  const { data: usuarios, loading, error } = useUsuarios(sedeActiva?.idSede ?? null);

  return (
    <div className="space-y-6">
      {/* Encabezado de la página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-fitzone-navy font-outfit">
            Usuarios
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestión de socios y personal — {sedeActiva?.nombre ?? '...'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          <Users className="w-4 h-4" />
          {!loading && <span>{usuarios.length} registros</span>}
        </div>
      </div>

      {/* Estado: ERROR */}
      {error && (
        <Alert
          type="error"
          title="No se pudieron cargar los usuarios"
          message={error}
        />
      )}

      {/* Estado: LOADING — muestra un spinner centrado */}
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Estado: ÉXITO (con datos) o VACÍO — la DataTable maneja ambos internamente */}
      {!loading && (
        <DataTable<UsuarioDTO>
          columns={COLUMNS}
          data={usuarios}
          keyExtractor={(row) => row.idUsuario}
          emptyTitle="Sin usuarios registrados"
          emptyMessage="No hay usuarios registrados para esta sede todavía."
          pagination
        />
      )}
    </div>
  );
}
