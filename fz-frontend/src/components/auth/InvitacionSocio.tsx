import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export interface InvitacionSocioProps {
  /** Ruta que pidió el visitante, ya codificada, para volver a ella después de iniciar sesión */
  returnTo: string;
}

export function InvitacionSocio({ returnTo }: InvitacionSocioProps) {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-card border border-slate-100 text-center space-y-4">
      <Sparkles className="w-10 h-10 text-fitzone-coral mx-auto" />
      <h2 className="text-2xl font-black text-fitzone-navy font-outfit">Esto es para socios</h2>
      <p className="text-sm text-slate-600">
        Con la membresía tenés clases grupales, tu pase QR para entrar a cualquier sede y descuento en canchas.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link to="/registro" className="px-5 py-2.5 rounded-xl bg-fitzone-coral text-white font-bold">
          Hacete socio
        </Link>
        <Link
          to={`/login?returnTo=${returnTo}`}
          className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-fitzone-navy"
        >
          Ya soy socio
        </Link>
      </div>
    </div>
  );
}
