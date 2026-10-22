import { Card } from '../../components/ui';
import { TipoUsuarioBadge } from '../../components/usuarios';
import { RolNav } from './RolNav';

/**
 * Pantalla base placeholder para el rol SOCIO (SCRUM-90).
 * Utilizada para la integración de flujos de login y redirección desde el backend.
 */
export function SocioRolPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <RolNav />
      <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black font-outfit text-fitzone-navy tracking-tight">
          Soy SOCIO
        </h1>
        <TipoUsuarioBadge tipo="SOCIO" size="md" showDot />
      </Card>
    </div>
  );
}

export default SocioRolPage;
