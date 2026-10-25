import React, { useState } from 'react';
import { ShieldPlus, CheckSquare, Square } from 'lucide-react';
import { Modal, TextField, Button, Alert } from '../ui';
import { CATALOGO_PRESTACIONES } from '../../services/rolesService';
import type { Prestacion, ModuloPrestacion, CrearRolDTO } from '../../types/rol';

export interface RolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (datos: CrearRolDTO) => void;
}

const MODULOS: ModuloPrestacion[] = ['Canchas', 'Clases', 'Control Acceso', 'Usuarios', 'Pagos'];

export function RolFormModal({ isOpen, onClose, onSubmit }: RolFormModalProps) {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [seleccionadas, setSeleccionadas] = useState<Prestacion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const togglePrestacion = (p: Prestacion) => {
    setSeleccionadas((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      setError('El código y el nombre del rol son obligatorios.');
      return;
    }
    if (seleccionadas.length === 0) {
      setError('Debe seleccionar al menos una prestación para este rol.');
      return;
    }
    try {
      onSubmit({
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        prestaciones: seleccionadas,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear el rol');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Rol de Usuario"
      subtitle="Define perfiles intermedios con permisos granulares por módulo"
      icon={ShieldPlus}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert type="error" title="Validación" message={error} onClose={() => setError(null)} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            id="rol-codigo"
            label="Código de Rol"
            placeholder="Ej: INSTRUCTOR, AUDITOR"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            required
            helperText="Identificador interno único en mayúsculas"
          />
          <TextField
            id="rol-nombre"
            label="Nombre Descriptivo"
            placeholder="Ej: Instructor de Clases"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>

        <TextField
          id="rol-descripcion"
          label="Descripción Operativa"
          placeholder="Ej: Acceso exclusivo para tomar asistencia y ver cronograma."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-fitzone-navy uppercase tracking-wider">
            Matriz de Prestaciones Habilitadas ({seleccionadas.length} seleccionadas)
          </label>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-2 border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50">
            {MODULOS.map((mod) => {
              const prestacionesModulo = CATALOGO_PRESTACIONES.filter((p) => p.modulo === mod);
              return (
                <div key={mod} className="space-y-2">
                  <h4 className="text-xs font-black text-fitzone-coral uppercase tracking-wider border-b border-slate-200 pb-1">
                    Módulo {mod}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {prestacionesModulo.map((p) => {
                      const activa = seleccionadas.includes(p.clave);
                      return (
                        <button
                          key={p.clave}
                          type="button"
                          onClick={() => togglePrestacion(p.clave)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                            activa
                              ? 'bg-white border-fitzone-navy text-fitzone-navy shadow-xs'
                              : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                          }`}
                        >
                          {activa ? (
                            <CheckSquare className="w-4 h-4 text-fitzone-navy shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <span className="block text-xs font-bold">{p.nombre}</span>
                            <span className="block text-[10px] text-slate-400 truncate">{p.descripcion}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Guardar Rol
          </Button>
        </div>
      </form>
    </Modal>
  );
}
