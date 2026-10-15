import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CreditCard, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioHistoryPage() {
  const { payments, navigate } = useApp();
  const [filter, setFilter] = useState('Todos'); // 'Todos', 'Confirmados', 'Pendientes', 'Rechazados'

  const confirmedTotal = payments
    .filter(p => p.status === 'CONFIRMADO')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const issuedCount = payments.filter(p => p.status === 'CONFIRMADO' && p.voucher).length;

  const filteredPayments = payments.filter(p => {
    if (filter === 'Confirmados') return p.status === 'CONFIRMADO';
    if (filter === 'Pendientes') return p.status === 'PENDIENTE';
    if (filter === 'Rechazados') return p.status === 'RECHAZADO';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          PAGOS Y FACTURACIÓN
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
          Historial de pagos y comprobantes
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Consultá tus transacciones, recibos digitales y facturas oficiales AFIP
        </p>
      </div>

      {/* Top Stat Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              PAGADO EN 2026
            </span>
            <h3 className="text-3xl font-black text-[#1B2A55] font-outfit mt-1">
              ${confirmedTotal.toLocaleString('es-AR')}
            </h3>
            <p className="text-[11px] text-[#2E9E5B] font-bold mt-1">Total de cuotas y reservas abonadas</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#2E9E5B]/10 text-[#2E9E5B] flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              COMPROBANTES
            </span>
            <h3 className="text-3xl font-black text-[#1B2A55] font-outfit mt-1">
              {issuedCount} emitidos
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Facturas A, Facturas B y Tickets AFIP</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#1B2A55]/10 text-[#1B2A55] flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#1B2A55]" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex bg-slate-100 p-1 rounded-2xl self-start max-w-fit">
        {['Todos', 'Confirmados', 'Pendientes', 'Rechazados'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-white text-[#1B2A55] shadow-sm'
                : 'text-slate-600 hover:text-[#1B2A55]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transactions Table / Cards */}
      <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-4 px-6">Concepto</th>
                <th className="py-4 px-4">Monto</th>
                <th className="py-4 px-4">Medio de Pago</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-4">Fecha</th>
                <th className="py-4 px-6 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredPayments.map((p) => {
                const isConfirmed = p.status === 'CONFIRMADO';
                const isRejected = p.status === 'RECHAZADO';
                const isPending = p.status === 'PENDIENTE';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-[#1B2A55]">{p.concept}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.detail}</div>
                    </td>

                    <td className="py-4 px-4 font-black text-[#1B2A55] text-sm">
                      ${p.amount.toLocaleString('es-AR')}
                    </td>

                    <td className="py-4 px-4 text-slate-600">
                      {p.method}
                    </td>

                    <td className="py-4 px-4">
                      {isConfirmed && <Badge variant="green-soft" size="xs">CONFIRMADO</Badge>}
                      {isRejected && <Badge variant="red-soft" size="xs">RECHAZADO</Badge>}
                      {isPending && <Badge variant="gold-soft" size="xs">PENDIENTE</Badge>}
                    </td>

                    <td className="py-4 px-4 text-slate-500 text-[11px]">
                      {p.date}
                    </td>

                    <td className="py-4 px-6 text-right">
                      {p.voucher ? (
                        <button
                          onClick={() => navigate('voucher', { payment: p })}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B2A55] hover:text-[#F26D6D] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{p.voucher.split(' · ')[0]}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : isRejected ? (
                        <span className="text-xs text-slate-400 italic">No disponible</span>
                      ) : (
                        <button
                          onClick={() => navigate('checkout', { payment: p })}
                          className="text-xs font-bold text-[#F26D6D] hover:underline"
                        >
                          Reintentar pago
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 border border-slate-200/70 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#1B2A55] shrink-0 mt-0.5" />
        <p>
          Los comprobantes fiscales se generan automáticamente únicamente para pagos confirmados. Podés descargarlos en PDF o consultar su código CAE en cualquier momento.
        </p>
      </div>

    </div>
  );
}
