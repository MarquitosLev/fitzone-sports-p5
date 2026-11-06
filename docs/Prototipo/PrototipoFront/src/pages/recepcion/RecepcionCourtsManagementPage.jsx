import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  Plus, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  AlertCircle,
  Edit
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export function RecepcionCourtsManagementPage() {
  const { courts, selectedSede, addCourt, setCourtMaintenance } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedCourtForMaintenance, setSelectedCourtForMaintenance] = useState(null);

  // New Court Form State
  const [newCourtData, setNewCourtData] = useState({
    name: 'Paddle · Cancha 3',
    sport: 'Paddle',
    basePrice: 10000,
    surface: 'Sintético / Vidrio Panorámico',
    covered: true,
    status: 'DISPONIBLE',
  });

  // Maintenance Form State
  const [maintenanceReason, setMaintenanceReason] = useState('Reparación de iluminación');
  const [maintenanceFrom, setMaintenanceFrom] = useState('03 / 10 / 2026 · 15:00');
  const [maintenanceTo, setMaintenanceTo] = useState('03 / 10 / 2026 · 18:00');
  const [hasOverlapError, setHasOverlapError] = useState(true); // Demonstrating Figma overlap protection

  const openMaintenanceModal = (court) => {
    setSelectedCourtForMaintenance(court);
    setHasOverlapError(true); // Demo Figma protection state
    setIsMaintenanceModalOpen(true);
  };

  const handleSaveCourt = (e) => {
    e.preventDefault();
    addCourt(newCourtData);
    setIsAddModalOpen(false);
  };

  const handleSaveMaintenance = () => {
    if (hasOverlapError) return;
    setCourtMaintenance(selectedCourtForMaintenance.id, maintenanceReason, maintenanceFrom, maintenanceTo);
    setIsMaintenanceModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            CANCHAS DEPORTIVAS · RECEPCIÓN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            Gestión de canchas y mantenimiento
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedSede} · Precios base por hora · Estados y disponibilidad protegida
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-xs rounded-xl shadow transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#F26D6D]" />
          <span>+ Alta de cancha</span>
        </button>
      </div>

      {/* Courts Overview Card */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-[#1B2A55] font-outfit">
              Canchas de {selectedSede}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {courts.length} canchas · {courts.filter(c => c.status === 'DISPONIBLE').length} disponibles · {courts.filter(c => c.status === 'EN_MANTENIMIENTO').length} en mantenimiento
            </p>
          </div>
          <Badge variant="navy-soft">{courts.length} CANCHAS</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courts.map((court) => {
            const isAvailable = court.status === 'DISPONIBLE';
            const isMaintenance = court.status === 'EN_MANTENIMIENTO';
            const isInactive = court.status === 'INACTIVA';

            return (
              <div
                key={court.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#F26D6D]">
                        {court.sport}
                      </span>
                      <h4 className="font-extrabold text-base text-[#1B2A55]">
                        {court.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {court.surface} · {court.covered ? 'Cubierta' : 'Descubierta'}
                      </p>
                    </div>

                    <div>
                      {isAvailable && <Badge variant="green-soft" size="xs">DISPONIBLE</Badge>}
                      {isMaintenance && <Badge variant="gold-soft" size="xs">EN MANTENIMIENTO</Badge>}
                      {isInactive && <Badge variant="default" size="xs">INACTIVA</Badge>}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tarifa base / hora:</span>
                    <span className="text-base font-black text-[#1B2A55]">
                      ${court.basePrice.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {isMaintenance && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Mantenimiento programado</span>
                      </div>
                      <p className="text-[11px]">{court.maintenanceReason}</p>
                      <p className="text-[11px] font-mono text-slate-500">{court.maintenanceRange}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2 text-xs">
                  {isAvailable && (
                    <button
                      onClick={() => openMaintenanceModal(court)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-[#1B2A55] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5 text-[#F26D6D]" />
                      <span>Programar mantenimiento</span>
                    </button>
                  )}

                  {isMaintenance && (
                    <button
                      onClick={() => openMaintenanceModal(court)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold transition-colors cursor-pointer"
                    >
                      Ver mantenimiento
                    </button>
                  )}

                  {isInactive && (
                    <button
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-600 font-bold"
                    >
                      Editar cancha
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Alta de Cancha */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Alta de Cancha Deportiva"
        subtitle={`Asignar nueva cancha a las instalaciones de ${selectedSede}`}
      >
        <form onSubmit={handleSaveCourt} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B2A55]">Nombre de la Cancha *</label>
            <input
              type="text"
              required
              value={newCourtData.name}
              onChange={(e) => setNewCourtData({ ...newCourtData, name: e.target.value })}
              placeholder="Ej: Paddle · Cancha 3"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Deporte *</label>
              <select
                value={newCourtData.sport}
                onChange={(e) => setNewCourtData({ ...newCourtData, sport: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-bold text-[#1B2A55]"
              >
                <option value="Paddle">Paddle</option>
                <option value="Fútbol 5">Fútbol 5</option>
                <option value="Tenis">Tenis</option>
                <option value="Básquet">Básquet</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Precio base / hora *</label>
              <input
                type="number"
                required
                value={newCourtData.basePrice}
                onChange={(e) => setNewCourtData({ ...newCourtData, basePrice: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-bold text-[#1B2A55]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B2A55]">Tipo de superficie</label>
            <input
              type="text"
              value={newCourtData.surface}
              onChange={(e) => setNewCourtData({ ...newCourtData, surface: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              Dar de alta cancha
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Programar Mantenimiento con Protección de Reservas */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title={`Inhabilitar por mantenimiento · ${selectedCourtForMaintenance?.name || 'Paddle 1'}`}
        subtitle={`${selectedSede} · Revisá el rango antes de guardar.`}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B2A55]">Motivo *</label>
            <input
              type="text"
              required
              value={maintenanceReason}
              onChange={(e) => setMaintenanceReason(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Desde *</label>
              <input
                type="text"
                value={maintenanceFrom}
                onChange={(e) => setMaintenanceFrom(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Hasta *</label>
              <input
                type="text"
                value={maintenanceTo}
                onChange={(e) => setMaintenanceTo(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          {/* Reserved protection banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-[#1B2A55] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2E9E5B]" />
              <span>Reservas confirmadas protegidas</span>
            </div>
            <p className="text-[11px] text-slate-600">
              No se cancelan ni se modifican automáticamente. No podés programar mantenimiento sobre sus horarios confirmados.
            </p>
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
              <div className="font-bold text-[#1B2A55]">Martín García · FZ-C1029</div>
              <Badge variant="green-soft" size="xs">CONFIRMADA</Badge>
            </div>
            <div className="text-[11px] text-slate-400">Sáb 3 Oct · 16:00–17:00 · Paddle 1</div>
          </div>

          {/* Overlap Error Simulation box from Figma */}
          {hasOverlapError ? (
            <div className="p-4 rounded-2xl bg-[#FDECEE] border border-[#E5484D]/30 space-y-2 text-xs">
              <div className="font-extrabold text-[#E5484D] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Este rango no se puede guardar</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Se superpone con la reserva confirmada de 16:00 a 17:00. Modificá las fechas o los horarios para no afectar al socio.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMaintenanceFrom('04 / 10 / 2026 · 08:00');
                  setMaintenanceTo('04 / 10 / 2026 · 12:00');
                  setHasOverlapError(false);
                }}
                className="mt-1 text-[11px] font-bold text-[#1B2A55] underline hover:text-[#F26D6D]"
              >
                Corregir rango automáticamente a un horario libre
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#EAF7EE] border border-[#2E9E5B]/30 text-xs text-[#2E9E5B] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Rango válido sin superposiciones con socios.</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={hasOverlapError}
              onClick={handleSaveMaintenance}
              className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow transition-all ${
                !hasOverlapError
                  ? 'bg-[#1B2A55] hover:bg-[#111A36] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Guardar mantenimiento
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
