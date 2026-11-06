import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Calendar, 
  Save, 
  AlertCircle,
  Info
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function RecepcionAttendancePage() {
  const { classes, selectedSede, updateAttendance, addToast } = useApp();
  
  // Pick Pilates class or default
  const pilatesClass = classes.find(c => c.title === 'Pilates') || classes[0];
  const [selectedClassId, setSelectedClassId] = useState(pilatesClass.id);
  const [studentSearch, setStudentSearch] = useState('');

  const currentClass = classes.find(c => c.id === selectedClassId) || pilatesClass;
  const students = currentClass.enrolledStudents || [];

  const asistioCount = students.filter(s => s.attendance === 'ASISTIO').length;
  const noAsistioCount = students.filter(s => s.attendance === 'NO_ASISTIO').length;
  const pendientesCount = students.filter(s => !s.attendance || s.attendance === 'PENDIENTE').length;

  const handleMark = (studentCode, status) => {
    updateAttendance(currentClass.id, studentCode, status);
  };

  const handleSaveAll = () => {
    addToast('Asistencia Guardada', `Se consolidaron las marcas para ${currentClass.title}.`, 'success');
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          CLASES GRUPALES · RECEPCIÓN
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
          Toma de asistencia
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Recepción · {selectedSede} · Registrá la concurrencia de socios por clase
        </p>
      </div>

      {/* Class & Day Selector Card */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Día de la clase
            </label>
            <div className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#1B2A55] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#F26D6D]" />
              <span>Hoy · Lun 28 Sep 2026</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Seleccionar Clase
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.title} · {cls.time} ({cls.instructor})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Class Header Summary */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-[#1B2A55] font-outfit">
                {currentClass.title} · {currentClass.time}
              </h3>
              <Badge variant="default" size="xs">{currentClass.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentClass.instructor} · {currentClass.room} · {selectedSede}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentClass.enrolledCount} inscriptos / cupo máximo {currentClass.maxCapacity}
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-[#EAF7EE] text-[#2E9E5B] text-center border border-[#2E9E5B]/20">
              <span className="text-base font-black block leading-none">{asistioCount}</span>
              <span className="text-[10px] font-bold uppercase">ASISTIÓ</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#FDECEE] text-[#E5484D] text-center border border-[#E5484D]/20">
              <span className="text-base font-black block leading-none">{noAsistioCount}</span>
              <span className="text-[10px] font-bold uppercase">NO ASISTIÓ</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-[#FEF7E6] text-[#B7791F] text-center border border-[#F0B429]/20">
              <span className="text-base font-black block leading-none">{pendientesCount}</span>
              <span className="text-[10px] font-bold uppercase">PENDIENTES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-[#1B2A55] font-outfit">
              Inscriptos de esta clase
            </h3>
            <p className="text-xs text-slate-500">
              Marcá ASISTIO o NO_ASISTIO por socio. Los pendientes conservan su estado hasta la confirmación.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Buscar socio..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredStudents.map((s) => {
            const isAsistio = s.attendance === 'ASISTIO';
            const isNoAsistio = s.attendance === 'NO_ASISTIO';
            const isPendiente = !s.attendance || s.attendance === 'PENDIENTE';

            return (
              <div
                key={s.code || s.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1B2A55] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-[#1B2A55] block">{s.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">{s.code} · Plan Premium</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleMark(s.code, 'ASISTIO')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isAsistio
                        ? 'bg-[#2E9E5B] text-white shadow'
                        : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ASISTIÓ</span>
                  </button>

                  <button
                    onClick={() => handleMark(s.code, 'NO_ASISTIO')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isNoAsistio
                        ? 'bg-[#E5484D] text-white shadow'
                        : 'bg-slate-100 hover:bg-rose-50 text-slate-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>NO ASISTIÓ</span>
                  </button>

                  {isPendiente && (
                    <Badge variant="gold-soft" size="xs">PENDIENTE</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer save and alert */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-[#1B2A55] shrink-0" />
            <span>
              {pendientesCount > 0 
                ? `Todavía hay ${pendientesCount} socios pendientes. Guardar conserva las marcas actuales.`
                : 'Todas las marcas cargadas para esta clase.'}
            </span>
          </div>

          <button
            onClick={handleSaveAll}
            className="px-6 py-3 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Guardar asistencia</span>
          </button>
        </div>

      </div>

    </div>
  );
}
