/**
 * RoleMiddlewareDemo.tsx — Demo de RoleMiddleware ("RutaProtegida", SCRUM-92) para el Playground.
 *
 * No monta un router propio (no se puede anidar dentro del BrowserRouter de la app):
 * usa la misma función `evaluarAccesoRuta` que RoleMiddleware para mostrar qué pasa
 * cuando cada rol entra por URL a cada ruta protegida.
 */

import { useState } from 'react';
import { Card } from '../ui';
import { obtenerPrestacionesPorRol } from '../../services/rolesService';
import { INICIO_POR_ROL } from '../layout/navegacion';
import { evaluarAccesoRuta } from './accesoRuta';
import type { ResultadoAccesoRuta } from './accesoRuta';
import type { Prestacion, TipoUsuario } from '../../types';

/** Rutas protegidas tal como están declaradas en App.tsx. */
const RUTAS_PROTEGIDAS: ReadonlyArray<{
  ruta: string;
  allowedRoles?: TipoUsuario[];
  prestacionRequerida?: Prestacion;
}> = [
  { ruta: '/usuarios', prestacionRequerida: 'USUARIOS_ADMIN' },
  { ruta: '/membresias', prestacionRequerida: 'USUARIOS_ADMIN' },
  { ruta: '/acceso', prestacionRequerida: 'ACCESO_AFORO_VIEW' },
  { ruta: '/mi-qr', prestacionRequerida: 'ACCESO_MI_QR' },
  { ruta: '/clases', prestacionRequerida: 'CLASES_VER' },
  { ruta: '/pagos', prestacionRequerida: 'PAGOS_VER_HISTORIAL' },
  { ruta: '/admin/roles', prestacionRequerida: 'ROLES_GESTIONAR' },
  { ruta: '/rol/socio', allowedRoles: ['SOCIO'] },
  { ruta: '/rol/externo', allowedRoles: ['EXTERNO'] },
  { ruta: '/rol/recepcionista', allowedRoles: ['RECEPCIONISTA'] },
  { ruta: '/rol/gerente', allowedRoles: ['GERENTE'] },
];

const OPCIONES_ROL: ReadonlyArray<{ valor: TipoUsuario | 'VISITANTE'; label: string }> = [
  { valor: 'VISITANTE', label: 'Visitante (sin sesión)' },
  { valor: 'SOCIO', label: 'Socio' },
  { valor: 'EXTERNO', label: 'Externo' },
  { valor: 'RECEPCIONISTA', label: 'Recepcionista' },
  { valor: 'GERENTE', label: 'Gerente' },
];

const ESTILO_RESULTADO: Record<ResultadoAccesoRuta, { texto: string; clase: string }> = {
  PERMITIDO: { texto: 'Permitido', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REQUIERE_LOGIN: { texto: 'Pide login', clase: 'bg-amber-50 text-amber-700 border-amber-200' },
  SIN_PERMISO: { texto: 'Sin permiso', clase: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const EJEMPLO_USO = `<Route element={<RoleMiddleware prestacionRequerida="USUARIOS_ADMIN" />}>
  <Route path="usuarios" element={<UsuariosPage />} />
</Route>

<Route element={<RoleMiddleware allowedRoles={['GERENTE']} />}>
  <Route path="rol/gerente" element={<GerenteRolPage />} />
</Route>`;

export function RoleMiddlewareDemo() {
  const [rol, setRol] = useState<TipoUsuario | 'VISITANTE'>('SOCIO');
  const tipoUsuario = rol === 'VISITANTE' ? null : rol;
  const prestaciones = tipoUsuario ? obtenerPrestacionesPorRol(tipoUsuario) : [];

  const destino = (resultado: ResultadoAccesoRuta, ruta: string) => {
    if (resultado === 'PERMITIDO') return ruta;
    if (resultado === 'REQUIERE_LOGIN') return `/login?returnTo=${encodeURIComponent(ruta)}`;
    return tipoUsuario ? INICIO_POR_ROL[tipoUsuario] : '/login';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <Card
        title="16.1 Uso en App.tsx"
        subtitle="Layout Route: protege un subárbol entero sin envolver cada página."
      >
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-[11px]">
            {EJEMPLO_USO}
          </pre>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>allowedRoles</strong>: lista de roles admitidos (opcional).</li>
            <li><strong>prestacionRequerida</strong>: prestación del rol que exige la ruta (opcional).</li>
            <li>Sin sesión → <code>/login?returnTo=&lt;ruta&gt;</code>.</li>
            <li>Rol sin permiso → vuelve a su inicio con un aviso “Sin permiso”.</li>
            <li>
              Mientras se valida la sesión con <code>GET /v1/usuarios/me</code> muestra un spinner.
              Si el backend responde 401 la sesión se cierra y se vuelve al login; un 403 de
              cualquier servicio muestra el toast “No tenés permiso…” sin romper la pantalla.
            </li>
          </ul>
        </div>
      </Card>

      <Card
        title="16.2 Matriz: entrar por URL"
        subtitle="Elegí un rol y mirá a dónde termina cada ruta protegida."
      >
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-600">
            Rol simulado
            <select
              id="pg-role-middleware-rol"
              value={rol}
              onChange={(e) => setRol(e.target.value as TipoUsuario | 'VISITANTE')}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {OPCIONES_ROL.map((op) => (
                <option key={op.valor} value={op.valor}>{op.label}</option>
              ))}
            </select>
          </label>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 pr-2">Ruta</th>
                  <th className="py-2 pr-2">Resultado</th>
                  <th className="py-2">Termina en</th>
                </tr>
              </thead>
              <tbody>
                {RUTAS_PROTEGIDAS.map(({ ruta, allowedRoles, prestacionRequerida }) => {
                  const resultado = evaluarAccesoRuta({
                    tipoUsuario,
                    prestacionesUsuario: prestaciones,
                    allowedRoles,
                    prestacionRequerida,
                  });
                  const estilo = ESTILO_RESULTADO[resultado];
                  return (
                    <tr key={ruta} className="border-t border-slate-100">
                      <td className="py-2 pr-2 font-mono">{ruta}</td>
                      <td className="py-2 pr-2">
                        <span className={`inline-block rounded-lg border px-2 py-0.5 font-bold ${estilo.clase}`}>
                          {estilo.texto}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-slate-500">{destino(resultado, ruta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
