import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Dumbbell, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Info
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export function RecepcionAgendaPage() {
  const { 
    classes, 
    selectedSede, 
    addNewClassByAdmin, 
    editClassByAdmin, 
    cancelClassByAdmin 
  } = useApp();

  const [selectedClass, setSelectedClass] = useState(classes[0]);
  const [studentSearch, setStudentSearch] = useState('');

  // Modals state
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Form states
  const [cancelReason, setCancelReason] = useState('Instructor no disponible por licencia médica.');
  const [confirmCancelCheck, setConfirmCancelCheck] = useState(false);

  const [editFormData, setEditFormData] = useState({
    title: 'Funcional',
    instructor: 'Sofía Méndez',
    date: '01 / 10 / 2026',
    startTime: '18:00',
    endTime: '19:00',
    maxCapacity: 12,
  });

  const [newClassFormData, setNewClassFormData] = useState({
    title: 'Crossfit',
    instructor: 'Marcos Varela',
    date: 'Jueves 1 de octubre de 2026',
    startTime: '20:00',
    endTime: '21:00',
    maxCapacity: 15,
    room: 'Sala grupal',
  });

  const openEditModal = (cls) => {
    setSelectedClass(cls);
    setEditFormData({
      title: cls.title,
      instructor: cls.instructor,
      date: cls.date,
      startTime: cls.startTime || cls.time.split('–')[0],
      endTime: cls.endTime || cls.time.split('–')[1],
      maxCapacity: cls.maxCapacity,
    });
    setIsEditModalOpen(true);
  };

  const openCancelModal = (cls) => {
    setSelectedClass(cls);
    setCancelReason('Instructor no disponible por licencia médica.');
    setConfirmCancelCheck(false);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!confirmCancelCheck) return;
    cancelClassByAdmin(selectedClass.id, cancelReason);
    setIsCancelModalOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    editClassByAdmin(selectedClass.id, {
      title: editFormData.title,
      instructor: editFormData.instructor,
      time: `${editFormData.startTime}–${editFormData.endTime}`,
      maxCapacity: Number(editFormData.maxCapacity),
    });
    setIsEditModalOpen(false);
  };

  const handleSaveNewClass = (e) => {
    e.preventDefault();
    addNewClassByAdmin(newClassFormData);
    setIsNewClassModalOpen(false);
  };

  const filteredStudents = (selectedClass?.enrolledStudents || []).filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.code && s.code.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            GESTIÓN DE AGENDA Y CLASES · RECEPCIÓN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            Gestión de agenda y clases
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Agenda · {selectedSede} · 28 Sep–4 Oct 2026 · Horarios de Buenos Aires
          </p>
        </div>

        <button
          onClick={() => setIsNewClassModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-xs rounded-xl shadow transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#F26D6D]" />
          <span>+ Nueva clase</span>
        </button>
      </div>

      {/* Main Agenda Grid: Classes list on Left (7 cols), Selected Class Enrolled Students on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 cols: Classes of the Day */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#1B2A55] font-outfit">
                Jueves 1 de octubre · Clases programadas
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {classes.length} clases
              </span>
            </div>

            <div className="space-y-3">
              {classes.map((cls) => {
                const isSelected = selectedClass?.id === cls.id;
                const isFull = cls.status === 'COMPLETA';
                const isCancelled = cls.status === 'CANCELADA';

                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                      isSelected
                        ? 'border-[#1B2A55] bg-slate-50/80 shadow-md ring-1 ring-[#1B2A55]'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base text-[#1B2A55] font-outfit">
                            {cls.title}
                          </h4>
                          {cls.status === 'PROGRAMADA' && <Badge variant="green-soft" size="xs">PROGRAMADA</Badge>}
                          {cls.status === 'COMPLETA' && <Badge variant="gold-soft" size="xs">COMPLETA</Badge>}
                          {cls.status === 'CANCELADA' && <Badge variant="red-soft" size="xs">CANCELADA</Badge>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cls.time} · {cls.instructor} · {cls.room}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#1B2A55] block">
                          {cls.enrolledCount} / {cls.maxCapacity}
                        </span>
                        <span className="text-[10px] text-slate-400">inscriptos</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500 text-[11px]">
                        {isSelected ? '● Visualizando inscriptos' : 'Click para ver inscriptos'}
                      </span>

                      <div className="flex items-center gap-2">
                        {!isCancelled && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(cls);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#1B2A55] font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCancelModal(cls);
                              }}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-[#E5484D] font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Cancelar</span>
                            </button>
                          </>
                        )}
                        {isCancelled && (
                          <span className="text-[11px] text-[#E5484D] font-bold">Clase cancelada</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Enrolled Students List for selected class */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  SOCIOS INSCRIPTOS
                </span>
                <Badge variant="navy-soft" size="xs">
                  {selectedClass?.enrolledCount} / {selectedClass?.maxCapacity}
                </Badge>
              </div>
              <h3 className="text-lg font-black text-[#1B2A55] font-outfit mt-0.5">
                {selectedClass?.title}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedClass?.dateShort}, {selectedClass?.time} · {Math.max(0, (selectedClass?.maxCapacity || 0) - (selectedClass?.enrolledCount || 0))} lugares libres
              </p>
            </div>

            {/* Student search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Buscar socio por nombre o código..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
              />
            </div>

            {/* Students list */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay socios inscriptos o no coinciden con la búsqueda.
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student.id || student.code}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1B2A55] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        {student.id || student.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-extrabold text-[#1B2A55] block">{student.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{student.code || 'FZ-0204'} · Plan Premium</span>
                      </div>
                    </div>

                    <Badge variant="green-soft" size="xs">INSCRIPTO</Badge>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
              {filteredStudents.length} inscriptos · Sin lista de espera pendiente
            </div>
          </div>
        </div>

      </div>

      {/* Modal: Editar Clase */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Editar clase · ${selectedClass?.title}`}
        subtitle={`${selectedSede} · Modificá los datos de la actividad`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B2A55]">Actividad *</label>
            <input
              type="text"
              required
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B2A55]">Instructor *</label>
            <input
              type="text"
              required
              value={editFormData.instructor}
              onChange={(e) => setEditFormData({ ...editFormData, instructor: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Horario Inicio *</label>
              <input
                type="text"
                required
                value={editFormData.startTime}
                onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-mono text-[#1B2A55]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Horario Fin *</label>
              <input
                type="text"
                required
                value={editFormData.endTime}
                onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-mono text-[#1B2A55]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B2A55]">Cupo máximo *</label>
            <input
              type="number"
              min={selectedClass?.enrolledCount || 1}
              required
              value={editFormData.maxCapacity}
              onChange={(e) => setEditFormData({ ...editFormData, maxCapacity: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] font-bold"
            />
            <p className="text-[11px] text-slate-400">
              {selectedClass?.enrolledCount} inscriptos actuales. El cupo no puede ser menor a {selectedClass?.enrolledCount}.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Descartar cambios
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-xs rounded-xl shadow"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cancelar Clase */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Cancelar clase · ${selectedClass?.title}`}
        subtitle={`${selectedClass?.dateShort}, ${selectedClass?.time}. La clase sigue PROGRAMADA hasta que confirmes.`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1B2A55]">Motivo de cancelación *</label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Describí el motivo (ej. Instructor no disponible por licencia médica)..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
            />
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Se notificará automáticamente a {selectedClass?.enrolledCount} inscriptos</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Al confirmar, la clase pasa a estado CANCELADA y se liberan todas las reservas. El motivo se incluirá en el aviso.
            </p>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmCancelCheck}
              onChange={(e) => setConfirmCancelCheck(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-[#E5484D] focus:ring-[#E5484D]"
            />
            <span className="text-xs font-bold text-slate-700">
              Entiendo que se cancelarán todas las reservas de esta clase.
            </span>
          </label>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Mantener clase programada
            </button>
            <button
              type="button"
              disabled={!confirmCancelCheck}
              onClick={handleConfirmCancel}
              className={`w-full sm:w-auto px-5 py-2.5 font-bold text-xs rounded-xl shadow transition-all ${
                confirmCancelCheck
                  ? 'bg-[#E5484D] hover:bg-[#c93b40] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Confirmar cancelación de clase
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Nueva Clase */}
      <Modal
        isOpen={isNewClassModalOpen}
        onClose={() => setIsNewClassModalOpen(false)}
        title="Crear Nueva Clase Grupal"
        subtitle={`Asignar nueva actividad a la agenda de ${selectedSede}`}
      >
        <form onSubmit={handleSaveNewClass} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B2A55]">Actividad / Nombre *</label>
            <input
              type="text"
              required
              value={newClassFormData.title}
              onChange={(e) => setNewClassFormData({ ...newClassFormData, title: e.target.value })}
              placeholder="Ej: Spinning, HIIT, Pilates, Funcional"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1B2A55]">Instructor *</label>
            <input
              type="text"
              required
              value={newClassFormData.instructor}
              onChange={(e) => setNewClassFormData({ ...newClassFormData, instructor: e.target.value })}
              placeholder="Nombre del instructor"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Inicio *</label>
              <input
                type="text"
                required
                value={newClassFormData.startTime}
                onChange={(e) => setNewClassFormData({ ...newClassFormData, startTime: e.target.value })}
                placeholder="18:00"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Fin *</label>
              <input
                type="text"
                required
                value={newClassFormData.endTime}
                onChange={(e) => setNewClassFormData({ ...newClassFormData, endTime: e.target.value })}
                placeholder="19:00"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Cupo máximo *</label>
              <input
                type="number"
                min="1"
                required
                value={newClassFormData.maxCapacity}
                onChange={(e) => setNewClassFormData({ ...newClassFormData, maxCapacity: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs font-bold text-[#1B2A55]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1B2A55]">Sala / Espacio</label>
              <input
                type="text"
                value={newClassFormData.room}
                onChange={(e) => setNewClassFormData({ ...newClassFormData, room: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewClassModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              Crear Clase
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
