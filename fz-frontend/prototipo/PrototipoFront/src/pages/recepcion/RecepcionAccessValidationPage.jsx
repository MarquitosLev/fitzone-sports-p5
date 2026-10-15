import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ScanLine, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Keyboard, 
  CheckCircle2, 
  XCircle, 
  WifiOff, 
  ArrowLeft,
  UserCheck,
  UserX,
  History
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export function RecepcionAccessValidationPage() {
  const { selectedSede, accessLogs, logAccessScan, navigate } = useApp();
  
  const [manualCode, setManualCode] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);

  const handleSimulateScan = (name, memberId, forceDenied = false) => {
    const result = logAccessScan(name, memberId, forceDenied);
    setLastScanResult(result);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode) return;
    const isDenied = manualCode.toUpperCase().includes('VENCIDO') || manualCode.includes('99');
    handleSimulateScan(`Socio (${manualCode})`, manualCode, isDenied);
    setManualCode('');
    setIsManualModalOpen(false);
  };

  const permittedCount = accessLogs.filter(l => l.status === 'PERMITIDO').length;
  const deniedCount = accessLogs.filter(l => l.status === 'DENEGADO').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            CONTROL DE ACCESO
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            Escáner y Validación de Acceso
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedSede} · Turno mañana · 2 molinetes sincronizados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2E9E5B]/10 text-[#2E9E5B] text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-[#2E9E5B] animate-pulse" />
            <span>Online</span>
          </div>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Ingreso manual</span>
          </button>
        </div>
      </div>

      {/* Main Validation Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 6 cols: Scanner Viewfinder & Live Test Buttons */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#111A36] rounded-3xl p-6 shadow-2xl border border-white/10 text-white text-center space-y-6">
            
            <div>
              <h3 className="text-lg font-black font-outfit">Escáner de recepción</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Alineá el código QR del socio dentro del marco
              </p>
            </div>

            {/* Viewfinder animation box */}
            <div className="relative w-64 h-64 mx-auto rounded-3xl bg-slate-900/90 border-2 border-white/20 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-[#F26D6D] rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-[#F26D6D] rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-[#F26D6D] rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-[#F26D6D] rounded-br-lg" />

              {/* Laser scanner line animation */}
              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#F26D6D] to-transparent shadow-[0_0_12px_#F26D6D] animate-scanner-line" />

              <ScanLine className="w-16 h-16 text-white/30" />
            </div>

            <p className="text-[11px] text-slate-400">
              La validación se procesa automáticamente al detectar el token.
            </p>

            {/* Quick Demo Simulator buttons */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                SIMULAR ESCANEO DE PRUEBA
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateScan('Martín García', 'FZ-18472', false)}
                  className="p-3 bg-[#2E9E5B] hover:bg-[#26864d] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Socio Activo (Válido)</span>
                </button>

                <button
                  onClick={() => handleSimulateScan('Camila Torres', 'FZ-0899', true)}
                  className="p-3 bg-[#E5484D] hover:bg-[#c93b40] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <UserX className="w-4 h-4" />
                  <span>Socio Vencido (Rechazo)</span>
                </button>
              </div>
            </div>

          </div>

          {/* Shift Counters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Permitidos</span>
              <span className="text-2xl font-black text-[#2E9E5B]">{permittedCount} accesos</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Denegados</span>
              <span className="text-2xl font-black text-[#E5484D]">{deniedCount} rechazos</span>
            </div>
          </div>
        </div>

        {/* Right 6 cols: Live Scan Result & Realtime Logs Feed */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Last Result Card if triggered */}
          {lastScanResult && (
            <div className={`p-6 rounded-3xl border shadow-lg animate-slide-up ${
              lastScanResult.status === 'PERMITIDO' 
                ? 'bg-[#EAF7EE] border-[#2E9E5B]/40 text-[#1B2A55]' 
                : 'bg-[#FDECEE] border-[#E5484D]/40 text-[#1B2A55]'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${
                    lastScanResult.status === 'PERMITIDO' ? 'bg-[#2E9E5B]' : 'bg-[#E5484D]'
                  }`}>
                    {lastScanResult.status === 'PERMITIDO' ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-wider block ${
                      lastScanResult.status === 'PERMITIDO' ? 'text-[#2E9E5B]' : 'text-[#E5484D]'
                    }`}>
                      {lastScanResult.status === 'PERMITIDO' ? 'ACCESO PERMITIDO · MOLINETE 1' : 'ACCESO DENEGADO'}
                    </span>
                    <h4 className="text-xl font-black font-outfit">{lastScanResult.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{lastScanResult.reason}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">{lastScanResult.time}</span>
              </div>
            </div>
          )}

          {/* Live Access Feed */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#1B2A55] font-outfit flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <span>Actividad de acceso reciente</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-bold">Actualizado ahora</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {accessLogs.map((log) => {
                const isPermitted = log.status === 'PERMITIDO';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPermitted ? 'bg-[#2E9E5B]/10 text-[#2E9E5B]' : 'bg-[#E5484D]/10 text-[#E5484D]'
                      }`}>
                        {isPermitted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-xs text-[#1B2A55]">{log.name}</h5>
                          <span className="text-[10px] font-mono text-slate-400">{log.memberId}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{log.reason}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-400 block">{log.time}</span>
                      {isPermitted ? (
                        <Badge variant="green-soft" size="xs">PERMITIDO</Badge>
                      ) : (
                        <Badge variant="red-soft" size="xs">DENEGADO</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Modal: Manual Code Entry */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Ingreso de código manual"
        subtitle="Ingresá el número de socio o DNI para verificar el estado de acceso."
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1B2A55]">Número de Socio / DNI</label>
            <input
              type="text"
              required
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ej: FZ-18472 o 32845761"
              className="w-full h-12 px-4 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
          >
            Validar Acceso
          </button>
        </form>
      </Modal>

    </div>
  );
}
