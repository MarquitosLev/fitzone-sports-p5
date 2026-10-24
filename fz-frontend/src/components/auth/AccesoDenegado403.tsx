import { ShieldX, Home, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

export interface AccesoDenegado403Props {
  mensaje?: string;
}

export function AccesoDenegado403({ mensaje }: AccesoDenegado403Props) {
  const navigate = useNavigate();
  const { usuario, isAuthenticated } = useAuth();

  const handleVolver = () => {
    if (!isAuthenticated || !usuario) {
      navigate('/login', { replace: true });
      return;
    }
    navigate(`/rol/${usuario.tipoUsuario.toLowerCase()}`, { replace: true });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-fitzone-red flex items-center justify-center mx-auto shadow-xs border border-rose-100">
          <ShieldX className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-black uppercase text-fitzone-red tracking-wider">
            Error 403 · Acceso No Autorizado
          </span>
          <h1 className="text-2xl font-black text-fitzone-navy font-outfit mt-1">
            Sección Restringida
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {mensaje ||
              'Tu perfil de usuario no cuenta con las prestaciones requeridas para ingresar a este módulo.'}
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-left text-xs space-y-1">
          <div className="text-slate-400 font-bold uppercase text-[10px]">Sesión activa</div>
          <div className="font-extrabold text-fitzone-navy">
            {usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Invitado anónimo'}
          </div>
          <div className="text-slate-500 text-[11px]">
            Rol asignado: <strong className="text-fitzone-coral">{usuario?.tipoUsuario || 'Sin rol'}</strong>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            variant="primary"
            onClick={handleVolver}
            leftIcon={isAuthenticated ? Home : LogIn}
          >
            {isAuthenticated ? 'Volver a Mi Panel' : 'Ir al Inicio de Sesión'}
          </Button>
        </div>
      </div>
    </div>
  );
}
