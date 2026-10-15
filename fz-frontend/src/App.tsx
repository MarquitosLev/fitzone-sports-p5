import { useEffect, useState } from 'react';
import './App.css';
import { AppProvider } from './context/AppContext';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { ToastContainer } from './components/ui/ToastContainer';

interface PingResponse {
  status: string;
  app: string;
  timestamp: string;
}

export default function App() {
  const [pingData, setPingData] = useState<PingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Determinar si se solicita ver el Playground (vía parámetro URL o toggle en desarrollo)
  const isPlaygroundRequested =
    typeof window !== 'undefined' &&
    (window.location.search.includes('view=playground') || window.location.pathname === '/playground');

  const [showPlayground, setShowPlayground] = useState<boolean>(isPlaygroundRequested);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

  useEffect(() => {
    fetch(`${apiBaseUrl}/ping`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then((data: PingResponse) => {
        setPingData(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiBaseUrl]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-manrope text-slate-900">
      {/* Banner de navegación en desarrollo para alternar entre pantalla principal y UI Playground */}
      <header className="sticky top-0 z-40 bg-[#1B2A55] text-white shadow-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F26D6D] flex items-center justify-center font-outfit font-black text-xl text-white shadow-sm">
              FZ
            </div>
            <div className="font-outfit font-black text-lg tracking-tight leading-none text-white">
              FitZone Sports
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPlayground(false)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !showPlayground
                  ? 'bg-white/15 text-white ring-1 ring-white/30 shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Estado Backend
            </button>
            <button
              type="button"
              onClick={() => setShowPlayground(true)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showPlayground
                  ? 'bg-[#F26D6D] text-white shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              UI Kit Playground
            </button>
          </div>
        </div>
      </header>

      {/* Contenido condicional: Vista original vs UI Kit Playground */}
      {showPlayground ? (
        <AppProvider>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <PlaygroundPage />
          </main>
          <ToastContainer />
        </AppProvider>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="container max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 text-center">
            <h1 className="text-2xl font-black text-[#1B2A55] font-outfit">FitZone Sports</h1>
            <p className="subtitle text-xs text-slate-500 mt-1 mb-6">
              Frontend React + Vite desplegado exitosamente
            </p>

            <div className="card text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
              <h2 className="text-sm font-bold text-[#1B2A55]">Estado de conexión con Backend:</h2>
              {loading && <p className="text-xs text-slate-500 animate-pulse">Comprobando conexión con la API...</p>}
              {error && (
                <p className="status-error text-xs font-bold text-[#E5484D] bg-[#FDECEE] p-3 rounded-xl border border-[#E5484D]/20">
                  No se pudo conectar con la API ({error}). Verificá VITE_API_BASE_URL.
                </p>
              )}
              {pingData && (
                <div className="status-success text-xs space-y-1.5 text-slate-700 bg-[#EAF7EE] p-3.5 rounded-xl border border-[#2E9E5B]/20">
                  <p>
                    <strong className="text-[#2E9E5B]">Estado Backend:</strong> {pingData.status}
                  </p>
                  <p>
                    <strong>Aplicación:</strong> {pingData.app}
                  </p>
                  <p>
                    <strong>Hora servidor:</strong> {new Date(pingData.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </div>


          </div>
        </main>
      )}
    </div>
  );
}
