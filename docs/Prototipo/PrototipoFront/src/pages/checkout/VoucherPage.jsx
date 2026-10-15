import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Printer, 
  FileText, 
  ShieldCheck, 
  Building2,
  Share2
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function VoucherPage() {
  const { routeParams, payments, navigate, addToast } = useApp();

  const payment = routeParams?.payment || payments[1] || payments[0];
  const isCourt = payment.concept?.includes('cancha') || !!payment.bookingId;

  const handleDownloadPDF = () => {
    window.print();
    addToast('Comprobante Descargado', 'Se generó la vista de impresión en PDF.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      
      {/* Back button */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('history')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1B2A55] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al historial</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Success Callout Banner */}
      <div className="bg-[#EAF7EE] border border-[#2E9E5B]/40 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 no-print shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#2E9E5B] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#1B2A55]">
              Tu comprobante está listo · Pago confirmado
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Guardalo para tu control. También queda disponible en tu sección de Pagos y Facturas.
            </p>
          </div>
        </div>

        <Badge variant="green">OPERACIÓN ACREDITADA</Badge>
      </div>

      {/* Official Tax Receipt / Factura AFIP Card */}
      <div className="bg-white rounded-3xl p-8 shadow-card border border-slate-200 printable-receipt space-y-6">
        
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B2A55] flex items-center justify-center text-white font-bold text-sm">
                FZ
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#1B2A55] font-outfit">
                  FitZone Sports
                </h2>
                <span className="text-[10px] font-black text-[#F26D6D] tracking-widest">
                  FITZONE SPORTS S.A.
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              CUIT 30-71824567-2 · Av. Santa Fe 3200, CABA · IVA Responsable Inscripto
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="inline-block p-2 border-2 border-[#1B2A55] rounded-xl text-center min-w-[100px] mb-1">
              <span className="text-2xl font-black text-[#1B2A55] block leading-none">
                {payment.voucherType === 'Factura A' ? 'A' : payment.voucherType === 'Factura B' ? 'B' : 'T'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 block mt-1 uppercase">
                {payment.voucherType || 'Factura B'}
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-[#1B2A55]">
              N° {payment.voucher ? payment.voucher.split(' · ')[1] : '0005-00008421'}
            </div>
            <div className="text-[11px] text-slate-500">
              Fecha de emisión: {payment.date || '02 Oct 2026 · 19:02'}
            </div>
          </div>
        </div>

        {/* Client Data row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-bold block uppercase text-[10px]">EMITIDO A</span>
            <span className="font-extrabold text-[#1B2A55] text-sm block mt-0.5">
              {payment.cuit || 'Consumidor Final'}
            </span>
            <span className="text-slate-500 text-[11px]">Operación ID: {payment.id}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold block uppercase text-[10px]">MEDIO DE PAGO</span>
            <span className="font-bold text-[#1B2A55] block mt-0.5">{payment.method}</span>
            <span className="text-slate-500 text-[11px]">Sede Palermo · Buenos Aires</span>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                <th className="py-2.5">Concepto y Detalle</th>
                <th className="py-2.5 text-center">Cant.</th>
                <th className="py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3.5 pr-4">
                  <div className="font-bold text-[#1B2A55]">{payment.concept}</div>
                  <div className="text-slate-500 text-[11px]">{payment.detail}</div>
                </td>
                <td className="py-3.5 text-center font-bold text-[#1B2A55]">1</td>
                <td className="py-3.5 text-right font-bold text-[#1B2A55]">
                  ${(payment.basePrice || payment.amount).toLocaleString('es-AR')}
                </td>
              </tr>
              {payment.discount < 0 && (
                <tr className="text-[#2E9E5B]">
                  <td className="py-2.5">
                    <div className="font-bold">Beneficio Socio Activo</div>
                    <div className="text-[11px]">Bonificación 15% sobre reserva</div>
                  </td>
                  <td className="py-2.5 text-center font-bold">1</td>
                  <td className="py-2.5 text-right font-bold">
                    −${Math.abs(payment.discount).toLocaleString('es-AR')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax breakdown */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs">
          {/* CAE Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1 w-full sm:w-auto">
            <div><strong>CAE:</strong> {payment.cae || '76451230987456'}</div>
            <div><strong>Vto. CAE:</strong> {payment.caeExp || '12 Oct 2026'}</div>
            <div className="text-[10px] text-[#2E9E5B] font-bold">✓ Comprobante Autorizado AFIP</div>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-right">
            <div className="flex justify-between text-slate-500">
              <span>Neto gravado:</span>
              <span className="font-mono">${payment.netTaxed ? payment.netTaxed.toLocaleString('es-AR') : (payment.amount / 1.21).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>IVA (21%):</span>
              <span className="font-mono">${payment.iva21 ? payment.iva21.toLocaleString('es-AR') : (payment.amount - payment.amount / 1.21).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-900 flex justify-between items-baseline text-base font-black text-[#1B2A55]">
              <span>TOTAL:</span>
              <span className="text-2xl">${payment.amount.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom return link */}
      <div className="text-center pt-2 no-print">
        <button
          onClick={() => navigate('history')}
          className="text-xs font-bold text-[#1B2A55] hover:text-[#F26D6D] hover:underline"
        >
          Volver a mis comprobantes y pagos
        </button>
      </div>

    </div>
  );
}
