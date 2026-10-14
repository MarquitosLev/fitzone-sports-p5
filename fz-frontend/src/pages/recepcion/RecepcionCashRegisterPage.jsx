import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  DollarSign, 
  Search, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Building2, 
  Receipt,
  Calendar
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function RecepcionCashRegisterPage() {
  const { selectedSede, cashRegister, registerCashPayment, navigate } = useApp();

  const [searchQuery, setSearchQuery] = useState('Martín García');
  const [selectedUser, setSelectedUser] = useState({
    name: 'Martín García',
    dni: '32.845.761',
    email: 'martin.garcia@email.com',
    status: 'SOCIO ACTIVO',
  });

  const [conceptType, setConceptType] = useState('Membresía'); // 'Membresía' | 'Reserva de cancha'
  const [conceptDetail, setConceptDetail] = useState('Plan Premium · Octubre 2026');
  const [amount, setAmount] = useState('15000');

  const handleConceptChange = (type) => {
    setConceptType(type);
    if (type === 'Membresía') {
      setConceptDetail('Plan Premium · Octubre 2026');
      setAmount('15000');
    } else {
      setConceptDetail('Paddle 1 · Turno 19:00 a 20:00');
      setAmount('10200');
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    registerCashPayment(selectedUser?.name || searchQuery, conceptType, conceptDetail, amount);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          PAGOS Y FACTURACIÓN · RECEPCIÓN
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
          Registrar cobro en efectivo
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Lucía Sánchez · Recepción · {selectedSede} · Caja Palermo 01
        </p>
      </div>

      {/* Previous Transaction snippet from Figma */}
      {cashRegister.lastOperation && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2E9E5B] shrink-0" />
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] block">Cobro anterior confirmado</span>
              <span className="font-extrabold text-[#1B2A55]">
                {cashRegister.lastOperation.user} · {cashRegister.lastOperation.concept} · ${cashRegister.lastOperation.amount?.toLocaleString('es-AR')} · {cashRegister.lastOperation.voucher}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-[#1B2A55] bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            ✓ Ticket emitido
          </span>
        </div>
      )}

      {/* Main Cash Payment Form */}
      <form onSubmit={handleConfirm} className="space-y-6">
        
        {/* Step 1: Search User */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
          <h3 className="text-base font-black text-[#1B2A55] font-outfit">
            1. Buscar socio o cliente
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ingresá DNI, email o nombre del usuario..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
            />
          </div>

          {selectedUser && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B2A55] text-white flex items-center justify-center font-bold text-xs">
                  MG
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#1B2A55]">{selectedUser.name}</h4>
                  <p className="text-xs text-slate-500">DNI {selectedUser.dni} · {selectedUser.email}</p>
                </div>
              </div>
              <Badge variant="green-soft">{selectedUser.status}</Badge>
            </div>
          )}
        </div>

        {/* Step 2: Concept & Amount */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-5">
          <h3 className="text-base font-black text-[#1B2A55] font-outfit">
            2. Concepto y monto cobrado
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleConceptChange('Membresía')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                conceptType === 'Membresía'
                  ? 'border-[#1B2A55] bg-[#1B2A55]/5 ring-1 ring-[#1B2A55]'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="font-extrabold text-sm text-[#1B2A55] block">Membresía</span>
              <span className="text-xs text-slate-500">Plan Premium mensual</span>
            </button>

            <button
              type="button"
              onClick={() => handleConceptChange('Reserva de cancha')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                conceptType === 'Reserva de cancha'
                  ? 'border-[#1B2A55] bg-[#1B2A55]/5 ring-1 ring-[#1B2A55]'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="font-extrabold text-sm text-[#1B2A55] block">Reserva de cancha</span>
              <span className="text-xs text-slate-500">Turno en sede</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1B2A55]">Detalle del concepto *</label>
            <input
              type="text"
              required
              value={conceptDetail}
              onChange={(e) => setConceptDetail(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1B2A55]">Monto cobrado en efectivo (ARS) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">$</span>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-300 text-base font-black text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Confirmation Summary Box */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-[#1B2A55] font-outfit">
              3. Confirmación de caja
            </h3>
            <Badge variant="navy">EFECTIVO</Badge>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Usuario titular:</span>
              <span className="font-bold text-[#1B2A55]">{selectedUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Concepto:</span>
              <span className="font-bold text-[#1B2A55]">{conceptDetail}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-base font-black text-[#1B2A55]">
              <span>Total recibido:</span>
              <span className="text-2xl">${Number(amount || 0).toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className="p-3 bg-[#EAF7EE] rounded-xl text-xs text-[#2E9E5B] font-medium flex items-center gap-2">
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Al confirmar, se genera un Ticket de caja y queda registrado en el historial del socio.</span>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#2E9E5B] hover:bg-[#26864d] text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <DollarSign className="w-5 h-5" />
            <span>Confirmar cobro en efectivo · ${Number(amount || 0).toLocaleString('es-AR')}</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center">Se registrará a nombre de Lucía Sánchez · Caja Palermo 01</p>
        </div>

      </form>

    </div>
  );
}
