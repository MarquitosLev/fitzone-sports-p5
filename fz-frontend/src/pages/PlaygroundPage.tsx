import { useState } from 'react';
import {
  Button,
  TextField,
  Select,
  DateTimeField,
  Modal,
  ConfirmDialog,
  DataTable,
  Card,
  StatusBadge,
  Badge,
  StatCard,
  Alert,
  Spinner,
  EmptyState,
} from '../components/ui';
import type { Column } from '../components/ui';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Calendar,
  Mail,
  User,
  CreditCard,
  ArrowRight,
  Filter,
  Settings,
} from 'lucide-react';
import {
  TipoUsuarioBadge,
  UsuarioPerfilHeader,
  BuscadorDni,
  UsuarioForm,
} from '../components/usuarios';
import {
  PlanCard,
  MembresiaEstadoCard,
  AccionesMembresia,
} from '../components/membresias';
import { QrDinamico, CuentaRegresiva } from '../components/acceso';
import { MOCK_PLANES } from '../services/membresiasService';
import { AgendaSemanal } from '../components/clases/AgendaSemanal';
import { ClaseForm } from '../components/clases/ClaseForm';
import { CupoIndicator } from '../components/clases/CupoIndicator';
import { ClaseCard } from '../components/clases/ClaseCard';
import { ReservaClaseItem } from '../components/clases/ReservaClaseItem';
import { PosicionEsperaBadge } from '../components/clases/PosicionEsperaBadge';
import { toLocalISOString } from '../utils/formatters';
import type { ClaseFormPayload } from '../components/clases/ClaseForm';
import {
  GrillaDisponibilidad,
  DesglosePrecio,
  SelectorFecha,
  CanchaCard,
  MantenimientoToggle,
} from '../components/canchas';
import { calcularCotizacion } from '../services/canchasService';
import type { ClaseGrupalDTO, CanchaDTO, FranjaHorariaDTO } from '../types';
import type { UsuarioDTO, TipoUsuario, MembresiaDTO, EstadoMembresia } from '../types';

export function PlaygroundPage() {
  const { addToast } = useApp();

  // Interactive controls
  const [activeTab, setActiveTab] = useState('all');
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateDisabled, setSimulateDisabled] = useState(false);
  const [showStatusDots, setShowStatusDots] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isWarningConfirmOpen, setIsWarningConfirmOpen] = useState(false);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);

  // Form fields test state
  const [testText, setTestText] = useState('Martín García');
  const [testEmail, setTestEmail] = useState('martin.garcia@email.com');
  const [testPassword, setTestPassword] = useState('fitzone2026!');
  const [testSelect, setTestSelect] = useState('palermo');
  const [testDate, setTestDate] = useState('2026-10-15');
  const [testTime, setTestTime] = useState('18:00');
  const [formHasErrors, setFormHasErrors] = useState(false);

  // RF-01 (SCRUM-60) Playground Interactive State
  const [demoBadgeSize, setDemoBadgeSize] = useState<'xs' | 'sm' | 'md' | 'lg'>('sm');
  const [demoBadgeDot, setDemoBadgeDot] = useState(true);
  const [demoSelectedUserIdx, setDemoSelectedUserIdx] = useState(0);
  const [demoCompactHeader, setDemoCompactHeader] = useState(false);
  const [demoSearchDni, setDemoSearchDni] = useState('30123456');
  const [demoSearchFeedback, setDemoSearchFeedback] = useState('30123456');
  const [demoFormModo, setDemoFormModo] = useState<'alta' | 'edicion'>('alta');
  const [demoFormLoading, setDemoFormLoading] = useState(false);

  // RF-02 (Membresías del Socio) Playground Interactive State
  const [demoSelectedPlanId, setDemoSelectedPlanId] = useState<number>(2);
  const [demoMembresiaScenario, setDemoMembresiaScenario] = useState<
    'activo-ok' | 'activo-alerta' | 'vencido' | 'suspendido' | 'cancelado' | 'sin-membresia'
  >('activo-alerta');
  const [demoAccionesEstado, setDemoAccionesEstado] = useState<EstadoMembresia>('ACTIVO');

  // SCRUM-85 (Código QR de Ingreso) Playground Interactive State
  const [demoQrToken, setDemoQrToken] = useState('FZ-QR-DEMO-2026-X89AF2');
  const [demoQrDuracion, setDemoQrDuracion] = useState(60);
  const [demoQrCargando, setDemoQrCargando] = useState(false);
  const [demoQrError, setDemoQrError] = useState<string | null>(null);
  const [demoCuentaSegundos, setDemoCuentaSegundos] = useState(42);
  const [demoCuentaBarra, setDemoCuentaBarra] = useState(true);
  const [demoCuentaTexto, setDemoCuentaTexto] = useState(true);
  const [demoQrMembresiaEstado, setDemoQrMembresiaEstado] = useState<EstadoMembresia | 'SIN_MEMBRESIA'>('ACTIVO');

  // Table interactive state
  const [tableLoading, setTableLoading] = useState(false);
  const [tableEmpty, setTableEmpty] = useState(false);
  const [tablePage, setTablePage] = useState(1);

  // Mock table data
  const mockTableData = [
    {
      id: 'FZ-C1029',
      user: 'Martín García',
      sport: 'Paddle · Cancha 1',
      date: 'Vie 2 Oct · 19:00',
      amount: '$10.200',
      status: 'PENDIENTE_PAGO',
    },
    {
      id: 'FZ-C1048',
      user: 'Laura Soler',
      sport: 'Tenis · Cancha 1',
      date: 'Sáb 3 Oct · 16:00',
      amount: '$8.500',
      status: 'CONFIRMADA',
    },
    {
      id: 'FZ-C1012',
      user: 'Carlos Méndez',
      sport: 'Fútbol 5 · Cancha 1',
      date: 'Jue 1 Oct · 17:00',
      amount: '$16.320',
      status: 'CANCELADA',
    },
    {
      id: 'FZ-C0996',
      user: 'Sofía Álvarez',
      sport: 'Spinning · Sala 2',
      date: 'Mié 30 Sep · 20:00',
      amount: 'Plan Premium',
      status: 'ACTIVO',
    },
    {
      id: 'FZ-C0980',
      user: 'Nicolás Vega',
      sport: 'CrossFit · Box Principal',
      date: 'Mar 29 Sep · 18:30',
      amount: '$12.000',
      status: 'VENCIDO',
    },
  ];

  // Table columns definition
  const tableColumns: Column<any>[] = [
    {
      key: 'id',
      header: 'Código',
      width: '120px',
      render: (row: any) => (
        <span className="font-mono font-bold text-xs text-[#1B2A55] bg-slate-100 px-2 py-0.5 rounded-md">
          {row.id}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Usuario / Socio',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1B2A55] text-white flex items-center justify-center font-bold text-xs shrink-0">
            {row.user.substring(0, 2).toUpperCase()}
          </div>
          <span className="font-bold text-[#1B2A55]">{row.user}</span>
        </div>
      ),
    },
    {
      key: 'sport',
      header: 'Actividad / Cancha',
      render: (row: any) => <span className="text-slate-600 font-semibold">{row.sport}</span>,
    },
    {
      key: 'date',
      header: 'Horario',
      render: (row: any) => <span className="text-slate-500 text-xs">{row.date}</span>,
    },
    {
      key: 'amount',
      header: 'Arancel',
      render: (row: any) => <span className="font-black text-[#1B2A55]">{row.amount}</span>,
    },
    {
      key: 'status',
      header: 'Estado Backend',
      align: 'center',
      render: (row: any) => <StatusBadge status={row.status} showDot={true} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (row: any) => (
        <Button
          size="xs"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            addToast('Registro Seleccionado', `Acción sobre ${row.id} (${row.user})`, 'info');
          }}
        >
          Detalle
        </Button>
      ),
    },
  ];

  // Sample structured backend error payload
  const backendErrorSample = {
    title: 'Error de Validación AFIP / Backend (422)',
    message: 'No fue posible emitir el comprobante debido a inconsistencias en los parámetros fiscales:',
    errors: [
      'El número de CUIT ingresado (30-00000000-0) no posee constancia activa en AFIP.',
      'El monto total no coincide con la suma de los ítems gravados al 21%.',
      'La fecha del turno seleccionado se encuentra en el pasado.',
    ],
  };

  const tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'buttons', label: 'Botones' },
    { id: 'inputs', label: 'Campos Form' },
    { id: 'badges', label: 'Status Badges' },
    { id: 'cards', label: 'Cards' },
    { id: 'table', label: 'Data Table' },
    { id: 'modals', label: 'Modales' },
    { id: 'alerts', label: 'Alertas & Toasts' },
    { id: 'spinners', label: 'Spinners & Empty' },
    { id: 'usuarios', label: 'Gestión Usuarios (RF-01)' },
    { id: 'membresias', label: 'Membresías (RF-02)' },
    { id: 'clases', label: 'Agenda Clases (RF-06)' },
    { id: 'clases-socio', label: 'Clases Socio (SCRUM-83)' },
    { id: 'acceso', label: 'Código QR (SCRUM-85)' },
    { id: 'canchas', label: 'Canchas (RF-10/11)' },
  ];

  // ── RF-06 Clases state ──────────────────────────────────────────────────────
  const mockSede = { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 };

  const [mockClases, setMockClases] = useState<ClaseGrupalDTO[]>([
    {
      idClase: 1,
      sede: mockSede,
      nombreActividad: 'Spinning',
      fechaHoraInicio: '2026-10-20T08:00:00',
      duracionMinutos: 60,
      cupoMaximo: 20,
      cupoDisponible: 5,
    },
    {
      idClase: 2,
      sede: mockSede,
      nombreActividad: 'Yoga',
      fechaHoraInicio: '2026-10-21T10:00:00',
      duracionMinutos: 75,
      cupoMaximo: 15,
      cupoDisponible: 0,
    },
    {
      idClase: 3,
      sede: mockSede,
      nombreActividad: 'CrossFit',
      fechaHoraInicio: '2026-10-22T07:00:00',
      duracionMinutos: 50,
      cupoMaximo: 12,
      cupoDisponible: 3,
    },
    {
      idClase: 4,
      sede: mockSede,
      nombreActividad: 'Pilates',
      fechaHoraInicio: '2026-10-23T09:00:00',
      duracionMinutos: 60,
      cupoMaximo: 10,
      cupoDisponible: 10,
    },
    {
      idClase: 5,
      sede: mockSede,
      nombreActividad: 'Boxeo',
      fechaHoraInicio: '2026-10-24T18:00:00',
      duracionMinutos: 60,
      cupoMaximo: 12,
      cupoDisponible: 7,
    },
  ]);

  const [pgFormModo, setPgFormModo] = useState<'alta' | 'edicion'>('alta');
  const [pgFormLoading, setPgFormLoading] = useState(false);
  const [pgFormError, setPgFormError] = useState<string | null>(null);
  const [pgSelectedClase, setPgSelectedClase] = useState<ClaseGrupalDTO | undefined>(undefined);

  // ── RF-10 / RF-11 Canchas Playground Interactive State ──────────────────────
  const [pgCanchaFecha, setPgCanchaFecha] = useState('2026-10-20');
  const [pgCanchaEsSocio, setPgCanchaEsSocio] = useState(true);
  const [pgCanchaBasePrice, setPgCanchaBasePrice] = useState(10000);
  const [pgCanchaTurno, setPgCanchaTurno] = useState<FranjaHorariaDTO | null>({
    id: '19:00-20:00',
    horaInicio: '19:00',
    horaFin: '20:00',
    textoTurno: '19:00 – 20:00',
    esPico: true,
    estado: 'LIBRE',
    precioEstimado: 10000,
  });

  const [pgFranjasDemo, setPgFranjasDemo] = useState<FranjaHorariaDTO[]>([
    {
      id: '16:00-17:00',
      horaInicio: '16:00',
      horaFin: '17:00',
      textoTurno: '16:00 – 17:00',
      esPico: false,
      estado: 'LIBRE',
      precioEstimado: 10000,
    },
    {
      id: '17:00-18:00',
      horaInicio: '17:00',
      horaFin: '18:00',
      textoTurno: '17:00 – 18:00',
      esPico: false,
      estado: 'OCUPADO',
      precioEstimado: 10000,
    },
    {
      id: '18:00-19:00',
      horaInicio: '18:00',
      horaFin: '19:00',
      textoTurno: '18:00 – 19:00',
      esPico: false,
      estado: 'MANTENIMIENTO',
      precioEstimado: 10000,
    },
    {
      id: '19:00-20:00',
      horaInicio: '19:00',
      horaFin: '20:00',
      textoTurno: '19:00 – 20:00',
      esPico: true,
      estado: 'LIBRE',
      precioEstimado: 10000,
    },
    {
      id: '20:00-21:00',
      horaInicio: '20:00',
      horaFin: '21:00',
      textoTurno: '20:00 – 21:00',
      esPico: true,
      estado: 'RECIEN_TOMADO',
      precioEstimado: 10000,
    },
    {
      id: '21:00-22:00',
      horaInicio: '21:00',
      horaFin: '22:00',
      textoTurno: '21:00 – 22:00',
      esPico: false,
      estado: 'LIBRE',
      precioEstimado: 10000,
    },
  ]);

  const [pgError409, setPgError409] = useState<string | null>(null);
  const [pgDemoCanchaEnMantenimiento, setPgDemoCanchaEnMantenimiento] = useState(false);
  const [pgDemoCanchaSelected, setPgDemoCanchaSelected] = useState(false);

  const pgDemoCancha: CanchaDTO = {
    idCancha: 1,
    sede: mockSede,
    nombre: 'Cancha 1 — Pádel Pro',
    tipo: 'PADEL',
    precioBaseHora: pgCanchaBasePrice,
    enMantenimiento: pgDemoCanchaEnMantenimiento,
  };

  const shouldShow = (tabId: string) => activeTab === 'all' || activeTab === tabId;

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl mx-auto pb-24">

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#1B2A55] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#1B2A55] hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. BUTTONS SECTION */}
      {shouldShow('buttons') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#1B2A55] font-outfit">1. Componente Button</h2>
              <p className="text-xs text-slate-500">
                Variantes <code className="text-[#1B2A55] font-mono">primary</code>, <code className="text-[#1B2A55] font-mono">coral</code>, <code className="text-[#1B2A55] font-mono">secondary</code>, <code className="text-[#1B2A55] font-mono">danger</code>, <code className="text-[#1B2A55] font-mono">outline</code>, <code className="text-[#1B2A55] font-mono">ghost</code> con soporte de iconos, tamaños y estado de carga.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant={simulateLoading ? 'coral' : 'secondary'}
                onClick={() => setSimulateLoading(!simulateLoading)}
              >
                {simulateLoading ? 'Carga: ON' : 'Simular Loading'}
              </Button>
              <Button
                size="xs"
                variant={simulateDisabled ? 'danger' : 'secondary'}
                onClick={() => setSimulateDisabled(!simulateDisabled)}
              >
                {simulateDisabled ? 'Disabled: ON' : 'Simular Disabled'}
              </Button>
            </div>
          </div>

          <Card>
            <div className="space-y-6">
              {/* Variants showcase */}
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                  Variantes de Color
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    isLoading={simulateLoading}
                    disabled={simulateDisabled}
                    onClick={() => addToast('Click en Botón', 'Botón Primario (Navy) accionado.', 'info')}
                  >
                    Primary (Navy)
                  </Button>

                  <Button
                    variant="coral"
                    isLoading={simulateLoading}
                    disabled={simulateDisabled}
                    onClick={() => addToast('Click en Botón', 'Botón Coral CTA accionado.', 'success')}
                  >
                    Coral CTA
                  </Button>

                  <Button
                    variant="secondary"
                    isLoading={simulateLoading}
                    disabled={simulateDisabled}
                    onClick={() => addToast('Click en Botón', 'Botón Secundario accionado.', 'info')}
                  >
                    Secondary
                  </Button>

                  <Button
                    variant="danger"
                    isLoading={simulateLoading}
                    disabled={simulateDisabled}
                    leftIcon={Trash2}
                    onClick={() => addToast('Click en Botón', 'Botón Danger accionado.', 'error')}
                  >
                    Danger Action
                  </Button>

                  <Button
                    variant="success"
                    isLoading={simulateLoading}
                    disabled={simulateDisabled}
                    leftIcon={CheckCircle2}
                    onClick={() => addToast('Click en Botón', 'Botón Success accionado.', 'success')}
                  >
                    Success
                  </Button>

                  <Button
                    variant="outline"
                    isLoading={simulateLoading}
                    disabled={simulateDisabled}
                  >
                    Outline
                  </Button>

                  <Button
                    variant="ghost"
                    isLoading={simulateLoading}
                    disabled={simulateDisabled}
                  >
                    Ghost
                  </Button>
                </div>
              </div>

              {/* Sizes showcase */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                  Tamaños Disponibles (xs, sm, md, lg)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xs" variant="primary">Tamaño XS</Button>
                  <Button size="sm" variant="primary">Tamaño SM</Button>
                  <Button size="md" variant="primary">Tamaño MD (Default)</Button>
                  <Button size="lg" variant="coral" rightIcon={ArrowRight}>Tamaño LG CTA</Button>
                </div>
              </div>

              {/* Icons & Loading Text */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                  Iconos & Estados
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" leftIcon={Calendar}>Con Icono Izquierdo</Button>
                  <Button variant="secondary" rightIcon={ArrowRight}>Con Icono Derecho</Button>
                  <Button variant="coral" isLoading={true} loadingText="Guardando cambios...">Con Texto de Carga</Button>
                  <Button variant="primary" disabled={true}>Estado Deshabilitado</Button>
                </div>
              </div>

              {/* Full Width */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                  Ancho Completo (fullWidth)
                </span>
                <Button variant="primary" fullWidth leftIcon={CreditCard}>
                  Confirmar y Pagar Membresía ($15.000)
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 2. FORM FIELDS SECTION */}
      {shouldShow('inputs') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#1B2A55] font-outfit">2. Inputs & Controles de Formulario</h2>
              <p className="text-xs text-slate-500">
                Componentes <code className="text-[#1B2A55] font-mono">TextField</code>, <code className="text-[#1B2A55] font-mono">Select</code> y <code className="text-[#1B2A55] font-mono">DateTimeField</code> con etiquetas, helper text y validación de errores.
              </p>
            </div>

            <Button
              size="xs"
              variant={formHasErrors ? 'danger' : 'secondary'}
              onClick={() => setFormHasErrors(!formHasErrors)}
            >
              {formHasErrors ? 'Simulando Errores: ON' : 'Simular Errores'}
            </Button>
          </div>

          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Standard text input */}
              <TextField
                label="Nombre y Apellido"
                placeholder="Ej: Martín García"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                required
                leftIcon={User}
                helperText="Nombre registrado en el documento de identidad"
                disabled={simulateDisabled}
                error={formHasErrors ? 'El nombre contiene caracteres inválidos' : undefined}
              />

              {/* Email input */}
              <TextField
                label="Correo Electrónico"
                type="email"
                placeholder="socio@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
                leftIcon={Mail}
                helperText="Utilizado para envío de facturas AFIP"
                disabled={simulateDisabled}
                error={formHasErrors ? 'El formato del email no es válido' : undefined}
              />

              {/* Password input with toggle */}
              <TextField
                label="Contraseña de Acceso"
                type="password"
                placeholder="Introduce tu clave..."
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                required
                helperText="Mínimo 8 caracteres, alfanumérico"
                disabled={simulateDisabled}
                error={formHasErrors ? 'La contraseña debe contener al menos 1 número' : undefined}
              />

              {/* Select component */}
              <Select
                label="Sede de Preferencia"
                value={testSelect}
                onChange={(e) => setTestSelect(e.target.value)}
                required
                disabled={simulateDisabled}
                helperText="Sede asignada por defecto para tus reservas"
                error={formHasErrors ? 'Debes seleccionar una sede operativa' : undefined}
                options={[
                  { value: 'palermo', label: 'Sede Palermo (Av. Santa Fe 3200)' },
                  { value: 'belgrano', label: 'Sede Belgrano (Cabildo 2400)' },
                  { value: 'recoleta', label: 'Sede Recoleta (Av. Callao 1500)' },
                  { value: 'nordelta', label: 'Sede Nordelta (Av. de los Lagos 200)' },
                ]}
              />

              {/* DateTimeField: Date */}
              <DateTimeField
                label="Fecha de Reserva"
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                required
                disabled={simulateDisabled}
                helperText="Selecciona el día del turno"
                error={formHasErrors ? 'La fecha no puede ser anterior a hoy' : undefined}
              />

              {/* DateTimeField: Time */}
              <DateTimeField
                label="Franja Horaria"
                type="time"
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                required
                disabled={simulateDisabled}
                helperText="Hora de inicio de la actividad"
                error={formHasErrors ? 'Horario fuera del turno operativo' : undefined}
              />
            </div>
          </Card>
        </section>
      )}

      {/* 3. STATUS BADGES SECTION */}
      {shouldShow('badges') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#1B2A55] font-outfit">3. Componente StatusBadge</h2>
              <p className="text-xs text-slate-500">
                Mapea automáticamente los estados del backend a las variantes de color del tema de FitZone.
              </p>
            </div>

            <Button
              size="xs"
              variant={showStatusDots ? 'primary' : 'secondary'}
              onClick={() => setShowStatusDots(!showStatusDots)}
            >
              {showStatusDots ? 'Puntos Indicadores: ON' : 'Puntos: OFF'}
            </Button>
          </div>

          <Card>
            <div className="space-y-6">
              {/* Green / Success states */}
              <div>
                <span className="text-[11px] font-black uppercase text-[#2E9E5B] tracking-wider block mb-3">
                  Estados Exitosos / Activos (Verde FitZone #2E9E5B)
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status="ACTIVO" showDot={showStatusDots} />
                  <StatusBadge status="CONFIRMADA" showDot={showStatusDots} />
                  <StatusBadge status="PAGADO" showDot={showStatusDots} />
                  <StatusBadge status="DISPONIBLE" showDot={showStatusDots} />
                  <StatusBadge status="PERMITIDO" showDot={showStatusDots} />
                  <StatusBadge status="ONLINE" showDot={showStatusDots} />
                </div>
              </div>

              {/* Red / Danger states */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-[#E5484D] tracking-wider block mb-3">
                  Estados Críticos / Peligro / Vencidos (Rojo FitZone #E5484D)
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status="VENCIDO" showDot={showStatusDots} />
                  <StatusBadge status="SUSPENDIDO" showDot={showStatusDots} />
                  <StatusBadge status="CANCELADO" showDot={showStatusDots} />
                  <StatusBadge status="RECHAZADO" showDot={showStatusDots} />
                  <StatusBadge status="DENEGADO" showDot={showStatusDots} />
                  <StatusBadge status="INACTIVA" showDot={showStatusDots} />
                </div>
              </div>

              {/* Gold / Warning states */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-[#B7791F] tracking-wider block mb-3">
                  Estados Pendientes / Mantenimiento (Dorado FitZone #F0B429)
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status="PENDIENTE" showDot={showStatusDots} />
                  <StatusBadge status="PENDIENTE_PAGO" showDot={showStatusDots} />
                  <StatusBadge status="EN_ESPERA" showDot={showStatusDots} />
                  <StatusBadge status="EN_MANTENIMIENTO" showDot={showStatusDots} />
                  <StatusBadge status="DEMORADO" showDot={showStatusDots} />
                </div>
              </div>

              {/* Navy / Info states */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-[#1B2A55] tracking-wider block mb-3">
                  Estados Informativos / Agenda (Navy FitZone #1B2A55)
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status="PROGRAMADA" showDot={showStatusDots} />
                  <StatusBadge status="EN_CURSO" showDot={showStatusDots} />
                  <StatusBadge status="REVISION" showDot={showStatusDots} />
                  <StatusBadge status="REGISTRADO" showDot={showStatusDots} />
                </div>
              </div>

              {/* Neutral states */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-3">
                  Estados Neutros / Finalizados (Gris Slate)
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusBadge status="FINALIZADA" showDot={showStatusDots} />
                  <StatusBadge status="COMPLETA" showDot={showStatusDots} />
                  <StatusBadge status="SIN_MEMBRESIA" showDot={showStatusDots} />
                </div>
              </div>

              {/* Sizes */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                  Escalas de Tamaño
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status="ACTIVO" size="xs" showDot={showStatusDots} />
                  <StatusBadge status="ACTIVO" size="sm" showDot={showStatusDots} />
                  <StatusBadge status="ACTIVO" size="md" showDot={showStatusDots} />
                  <StatusBadge status="ACTIVO" size="lg" showDot={showStatusDots} />
                </div>
              </div>

              {/* Generic Badge component */}
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                  Componente Badge Genérico — Variantes de Color
                </span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge variant="navy">Navy</Badge>
                  <Badge variant="navy-soft">Navy Soft</Badge>
                  <Badge variant="coral">Coral</Badge>
                  <Badge variant="coral-soft">Coral Soft</Badge>
                  <Badge variant="green">Green</Badge>
                  <Badge variant="green-soft">Green Soft</Badge>
                  <Badge variant="gold">Gold</Badge>
                  <Badge variant="gold-soft">Gold Soft</Badge>
                  <Badge variant="red">Red</Badge>
                  <Badge variant="red-soft">Red Soft</Badge>
                  <Badge variant="dark">Dark</Badge>
                  <Badge variant="default">Default</Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 4. CARDS SECTION */}
      {shouldShow('cards') && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-[#1B2A55] font-outfit">4. Componente Card</h2>
            <p className="text-xs text-slate-500">
              Contenedores base para tarjetas de módulos, con variantes de diseño, animaciones hover e integración de cabeceras y pies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Default Card */}
            <Card
              title="Tarjeta Estándar"
              subtitle="Variante default con shadow-card"
              action={<StatusBadge status="ACTIVO" size="xs" />}
              footer={
                <>
                  <span className="text-xs text-slate-400">Actualizado hoy</span>
                  <Button size="xs" variant="secondary">Ver</Button>
                </>
              }
            >
              <p className="text-xs text-slate-600 leading-relaxed">
                Contenedor base flexible con bordes sutiles y sombra suave adaptada a la estética de FitZone.
              </p>
            </Card>

            {/* Interactive / Hoverable Card */}
            <Card
              title="Tarjeta Interactiva"
              subtitle="Efecto hover:-translate-y-1"
              interactive
              variant="highlight"
              onClick={() => addToast('Click en Tarjeta', 'Has seleccionado la tarjeta interactiva.', 'success')}
              footer={
                <span className="text-xs font-bold text-[#F26D6D]">
                  Hacé clic para interactuar →
                </span>
              }
            >
              <p className="text-xs text-slate-600 leading-relaxed">
                Tarjeta con borde superior acentuado en Coral y micro-animación al pasar el cursor o hacer click.
              </p>
            </Card>

            {/* Dark Navy Card */}
            <Card
              title="Tarjeta Navy Oscura"
              subtitle="Variante navy #1B2A55"
              variant="navy"
              footer={
                <Button size="xs" variant="coral" fullWidth>
                  Acción Primaria
                </Button>
              }
            >
              <p className="text-xs text-slate-300 leading-relaxed">
                Diseñada para módulos de alto impacto visual como balances, pase digital QR o promociones destacadas.
              </p>
            </Card>
          </div>

          {/* StatCard Showcase */}
          <div className="pt-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-3">
              Componente StatCard — Métricas y Estadísticas de Dashboard
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Socios Activos"
                value="1.248"
                change="+12% este mes"
                changeType="positive"
                color="navy"
              />
              <StatCard
                title="Ocupación Clases"
                value="88%"
                change="Alta demanda"
                changeType="neutral"
                color="coral"
              />
              <StatCard
                title="Ingresos del Mes"
                value="$3.450.000"
                change="+8% vs objetivo"
                changeType="positive"
                color="green"
              />
              <StatCard
                title="Turnos Reservados"
                value="142"
                change="-3% vs ayer"
                changeType="negative"
                color="white"
              />
            </div>
          </div>
        </section>
      )}

      {/* 5. DATA TABLE SECTION */}
      {shouldShow('table') && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#1B2A55] font-outfit">5. Componente DataTable</h2>
              <p className="text-xs text-slate-500">
                Tabla configurable por columnas, con paginación y estados interactivos de carga (skeletons) y vacío (empty).
              </p>
            </div>

            {/* Table interactive state switchers */}
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant={tableLoading ? 'coral' : 'secondary'}
                onClick={() => setTableLoading(!tableLoading)}
              >
                {tableLoading ? 'Detener Carga' : 'Simular Loading'}
              </Button>

              <Button
                size="xs"
                variant={tableEmpty ? 'coral' : 'secondary'}
                onClick={() => setTableEmpty(!tableEmpty)}
              >
                {tableEmpty ? 'Mostrar Datos' : 'Simular Empty'}
              </Button>
            </div>
          </div>

          <DataTable
            columns={tableColumns}
            data={tableEmpty ? [] : mockTableData}
            isLoading={tableLoading}
            emptyTitle="No hay turnos ni pagos registrados"
            emptyMessage="No se encontraron registros de reservas para la sede seleccionada."
            emptyActionLabel="Nueva Reserva"
            onEmptyAction={() => {
              setTableEmpty(false);
              addToast('Acción de EmptyState', 'Se restauraron los datos de ejemplo.', 'info');
            }}
            pagination={{
              currentPage: tablePage,
              totalPages: 4,
              pageSize: 5,
              totalItems: 20,
              onPageChange: (newPage) => {
                setTablePage(newPage);
                addToast('Paginación', `Cambiaste a la página ${newPage}.`, 'info');
              },
            }}
            onRowClick={(row) => {
              addToast('Fila Seleccionada', `Detalle de reserva: ${row.id} - ${row.user}`, 'info');
            }}
          />
        </section>
      )}

      {/* 6. MODALS & CONFIRM DIALOGS SECTION */}
      {shouldShow('modals') && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-[#1B2A55] font-outfit">6. Modales & ConfirmDialog</h2>
            <p className="text-xs text-slate-500">
              Diálogos flotantes accesibles con blur de fondo, bloqueo de scroll y modal especializado para confirmación de acciones destructivas.
            </p>
          </div>

          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                leftIcon={Settings}
                onClick={() => setIsModalOpen(true)}
              >
                Abrir Modal Estándar
              </Button>

              <Button
                variant="danger"
                leftIcon={Trash2}
                onClick={() => setIsConfirmOpen(true)}
              >
                Abrir ConfirmDialog (Peligroso / Cancelar)
              </Button>

              <Button
                variant="coral"
                leftIcon={AlertTriangle}
                onClick={() => setIsWarningConfirmOpen(true)}
              >
                Abrir ConfirmDialog (Advertencia)
              </Button>
            </div>
          </Card>

          {/* Standard Modal Demo */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Ajustes de Reserva de Cancha"
            subtitle="Configuración de parámetros operativos en Sede Palermo"
            icon={Settings}
            footer={
              <>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsModalOpen(false);
                    addToast('Configuración Guardada', 'Se actualizaron los parámetros de la cancha.', 'success');
                  }}
                >
                  Guardar Parámetros
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Este diálogo utiliza el componente <code className="font-mono text-[#1B2A55]">Modal</code> base, con soporte nativo de cierre por tecla Escape, clic en el fondo difuminado y contenedor con scroll independiente.
              </p>
              <TextField
                label="Nombre de la Pista"
                defaultValue="Paddle · Cancha 1 (Cristal)"
              />
              <Select
                label="Estado de Disponibilidad"
                defaultValue="DISPONIBLE"
                options={[
                  { value: 'DISPONIBLE', label: 'Disponible para reservas' },
                  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento temporal' },
                  { value: 'INACTIVA', label: 'Inactiva fuera de servicio' },
                ]}
              />
            </div>
          </Modal>

          {/* Destructive ConfirmDialog Demo */}
          <ConfirmDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            title="¿Cancelar Reserva de Cancha?"
            description="Esta acción es irreversible. Se liberará el turno en la grilla y se procesará el reembolso conforme a la política de 2 horas previas."
            confirmText="Sí, Cancelar Reserva"
            cancelText="Conservar Turno"
            variant="danger"
            isLoading={isConfirmingAction}
            onConfirm={() => {
              setIsConfirmingAction(true);
              setTimeout(() => {
                setIsConfirmingAction(false);
                setIsConfirmOpen(false);
                addToast('Reserva Cancelada', 'El turno fue liberado con éxito.', 'warning');
              }, 1200);
            }}
          />

          {/* Warning ConfirmDialog Demo */}
          <ConfirmDialog
            isOpen={isWarningConfirmOpen}
            onClose={() => setIsWarningConfirmOpen(false)}
            title="¿Poner Cancha en Mantenimiento?"
            description="Se inhabilitarán los turnos futuros mientras dure el mantenimiento programado."
            confirmText="Confirmar Mantenimiento"
            cancelText="Volver"
            variant="warning"
            onConfirm={() => {
              setIsWarningConfirmOpen(false);
              addToast('Mantenimiento Activado', 'La cancha quedó señalizada para reparación.', 'info');
            }}
          />
        </section>
      )}

      {/* 7. ALERTS & TOASTS SECTION */}
      {shouldShow('alerts') && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-[#1B2A55] font-outfit">7. Alertas & Banners de Error Backend</h2>
            <p className="text-xs text-slate-500">
              Notificaciones integradas preparadas para desplegar estructuras de error complejas del servidor.
            </p>
          </div>

          <div className="space-y-4">
            {/* Success Alert */}
            <Alert
              type="success"
              title="Pago Confirmado Exitosamente"
              message="Se ha generado la Factura B (CAE N° 7645129841) y enviado al correo del titular."
              onClose={() => addToast('Alerta Cerrada', 'Has cerrado la alerta de éxito.', 'info')}
            />

            {/* Backend Structured Error Alert */}
            <Alert
              type="error"
              error={backendErrorSample}
              action={
                <Button size="xs" variant="danger">
                  Reintentar Operación
                </Button>
              }
              onClose={() => addToast('Alerta Cerrada', 'Has cerrado la alerta de error.', 'info')}
            />

            {/* Warning Alert */}
            <Alert
              type="warning"
              title="Membresía Próxima a Vencer"
              message="Tu plan vencerá en 3 días. Regularizá tu cuota para mantener tu descuento del 15% en canchas deportivas."
            />

            {/* Info Alert */}
            <Alert
              type="info"
              title="Nuevo Protocolo de Acceso"
              message="Recordá tener listo tu pase QR en el lector al ingresar a las instalaciones."
            />

            {/* Trigger live toasts test */}
            <Card title="Prueba de Notificaciones Flotantes (Toast)">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => addToast('¡Lugar Reservado!', 'Tu lugar para Spinning está asegurado.', 'success')}
                >
                  Lanzar Toast Success
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => addToast('Error de Cobro', 'Fondos insuficientes en la tarjeta seleccionada.', 'error')}
                >
                  Lanzar Toast Error
                </Button>

                <Button
                  size="sm"
                  variant="coral"
                  onClick={() => addToast('Cupos Limitados', 'Solo quedan 2 lugares disponibles para esta clase.', 'warning')}
                >
                  Lanzar Toast Warning
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => addToast('Cobro Registrado', 'Ticket 0005-00008412 emitido correctamente.', 'info')}
                >
                  Lanzar Toast Info
                </Button>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* 8. SPINNERS & EMPTY STATE SECTION */}
      {shouldShow('spinners') && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-[#1B2A55] font-outfit">8. Spinners & EmptyState</h2>
            <p className="text-xs text-slate-500">
              Componentes para feedback de carga asíncrona y pantallas sin resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spinners showcase */}
            <Card title="Indicadores de Carga (Spinner)">
              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                    Tamaños (xs, sm, md, lg, xl)
                  </span>
                  <div className="flex items-center gap-4">
                    <Spinner size="xs" color="navy" inline />
                    <Spinner size="sm" color="navy" inline />
                    <Spinner size="md" color="navy" inline />
                    <Spinner size="lg" color="coral" inline />
                    <Spinner size="xl" color="green" inline />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block mb-3">
                    Variantes de Color con Etiqueta
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <Spinner color="navy" label="Consultando AFIP..." />
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <Spinner color="coral" label="Procesando pago..." />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* EmptyState showcase */}
            <EmptyState
              icon={Filter}
              title="No se encontraron canchas"
              description="No hay turnos disponibles para los filtros de deporte y sede seleccionados."
              actionLabel="Limpiar Filtros"
              onAction={() => addToast('Filtros Reiniciados', 'Se reestablecieron los criterios.', 'info')}
              secondaryActionLabel="Ver Otras Sedes"
              onSecondaryAction={() => addToast('Navegación', 'Redirigiendo al catálogo de sedes.', 'info')}
            />
          </div>
        </section>
      )}

      {/* 9. GESTIÓN DE USUARIOS (RF-01 / SCRUM-60) */}
      {shouldShow('usuarios') && (
        <section className="space-y-8 pt-4 border-t-2 border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#1B2A55] text-white">
                  RF-01
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  SCRUM-60
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#1B2A55] font-outfit mt-1">
                9. Módulo Gestión de Usuarios (RF-01)
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl">
                Componentes desarrollados para el rol de Recepcionista: mapeo de roles con <code className="text-[#1B2A55] font-mono">TipoUsuarioBadge</code>, cabecera de perfil <code className="text-[#1B2A55] font-mono">UsuarioPerfilHeader</code>, barra de búsqueda <code className="text-[#1B2A55] font-mono">BuscadorDni</code> y formulario reactivo <code className="text-[#1B2A55] font-mono">UsuarioForm</code> con asignación condicional de sede.
              </p>
            </div>
          </div>

          {/* 9.1 TipoUsuarioBadge */}
          <Card title="9.1 TipoUsuarioBadge — Colores y Roles Institucionales">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Mapeo semántico de los 4 roles del sistema (SOCIO, EXTERNO, RECEPCIONISTA, GERENTE).
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(['xs', 'sm', 'md', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setDemoBadgeSize(sz)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          demoBadgeSize === sz ? 'bg-white text-[#1B2A55] shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        {sz.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <Button
                    size="xs"
                    variant={demoBadgeDot ? 'primary' : 'secondary'}
                    onClick={() => setDemoBadgeDot(!demoBadgeDot)}
                  >
                    {demoBadgeDot ? 'Dot: ON' : 'Dot: OFF'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(['SOCIO', 'EXTERNO', 'RECEPCIONISTA', 'GERENTE'] as TipoUsuario[]).map((rol) => (
                  <div
                    key={rol}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2.5 text-center"
                  >
                    <TipoUsuarioBadge
                      tipoUsuario={rol}
                      size={demoBadgeSize}
                      showDot={demoBadgeDot}
                    />
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">
                      tipoUsuario="{rol}"
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 9.2 UsuarioPerfilHeader */}
          <Card title="9.2 UsuarioPerfilHeader — Cabecera de Perfil y Recepción">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Usuario de demostración:
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: 'Socio (Con Foto)', idx: 0 },
                      { label: 'Externo (Iniciales)', idx: 1 },
                      { label: 'Recepcionista', idx: 2 },
                      { label: 'Gerente', idx: 3 },
                    ].map((item) => (
                      <button
                        key={item.idx}
                        type="button"
                        onClick={() => setDemoSelectedUserIdx(item.idx)}
                        className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          demoSelectedUserIdx === item.idx
                            ? 'bg-[#1B2A55] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  size="xs"
                  variant={demoCompactHeader ? 'coral' : 'secondary'}
                  onClick={() => setDemoCompactHeader(!demoCompactHeader)}
                >
                  {demoCompactHeader ? 'Modo: Compacto' : 'Modo: Completo'}
                </Button>
              </div>

              {/* Render del componente */}
              {(() => {
                const demoUsers: UsuarioDTO[] = [
                  {
                    idUsuario: 1,
                    authId: 'uuid-socio-1',
                    dni: '30123456',
                    nombre: 'Lucas',
                    apellido: 'Martínez',
                    email: 'lucas.martinez@email.com',
                    telefono: '11-4567-8901',
                    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    tipoUsuario: 'SOCIO',
                    idSede: 1,
                  },
                  {
                    idUsuario: 3,
                    authId: null,
                    dni: '35789012',
                    nombre: 'Martín',
                    apellido: 'López',
                    email: 'mlopez@email.com',
                    telefono: '11-6789-0123',
                    fotoUrl: null,
                    tipoUsuario: 'EXTERNO',
                    idSede: 1,
                  },
                  {
                    idUsuario: 4,
                    authId: 'uuid-recep-1',
                    dni: '25678901',
                    nombre: 'Sofía',
                    apellido: 'Rodríguez',
                    email: 'sofia.rod@fitzone.com',
                    telefono: '11-3456-7890',
                    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
                    tipoUsuario: 'RECEPCIONISTA',
                    idSede: 2,
                  },
                  {
                    idUsuario: 5,
                    authId: 'uuid-gerente-1',
                    dni: '24119832',
                    nombre: 'Alejandra',
                    apellido: 'Vidal',
                    email: 'alejandra.vidal@fitzone.com',
                    telefono: '11-2345-6789',
                    fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                    tipoUsuario: 'GERENTE',
                    idSede: 1,
                  },
                ];

                const currentUser = demoUsers[demoSelectedUserIdx] || demoUsers[0];

                return (
                  <UsuarioPerfilHeader
                    usuario={currentUser}
                    sedeNombre={currentUser.idSede === 1 ? 'FitZone Palermo' : 'FitZone Belgrano'}
                    compact={demoCompactHeader}
                    actions={
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() =>
                            addToast(
                              'Acción Recepción',
                              `Consultando ficha de ${currentUser.nombre} ${currentUser.apellido}`,
                              'info'
                            )
                          }
                        >
                          Ver Historial
                        </Button>
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() =>
                            addToast(
                              'Edición Rápida',
                              `Abriendo formulario para ${currentUser.nombre}`,
                              'info'
                            )
                          }
                        >
                          Editar
                        </Button>
                      </div>
                    }
                  />
                );
              })()}
            </div>
          </Card>

          {/* 9.3 BuscadorDni */}
          <Card title="9.3 BuscadorDni — Filtrado Reactivo con Debounce">
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Componente de búsqueda rápida por DNI con timer de debounce (300ms por defecto), icono de estado y botón de confirmación inmediata.
              </p>

              <div className="max-w-xl">
                <BuscadorDni
                  value={demoSearchDni}
                  onChange={(val) => {
                    setDemoSearchDni(val);
                    setDemoSearchFeedback(val);
                  }}
                  onSearch={(val) => {
                    setDemoSearchFeedback(val);
                    addToast(
                      'Búsqueda Ejecutada',
                      val ? `Filtrando usuarios por DNI: "${val}"` : 'Filtro de DNI reseteado',
                      'info'
                    );
                  }}
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  Valor emitido tras debounce:{' '}
                  <strong className="text-[#1B2A55] font-mono">
                    {demoSearchFeedback ? `"${demoSearchFeedback}"` : '(campo vacío)'}
                  </strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  Prueba tipear o presionar Enter / botón Buscar
                </span>
              </div>
            </div>
          </Card>

          {/* 9.4 UsuarioForm */}
          <Card title="9.4 UsuarioForm — Formulario Unificado Alta & Edición">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Modo activo:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDemoFormModo('alta')}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        demoFormModo === 'alta'
                          ? 'bg-[#1B2A55] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Modo Alta
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoFormModo('edicion')}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        demoFormModo === 'edicion'
                          ? 'bg-[#1B2A55] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Modo Edición (Precargado)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-semibold text-[11px]">
                    Regla: Selector de Sede visible sólo para RECEPCIONISTA y GERENTE
                  </span>
                </div>
              </div>

              {/* Contenedor del Formulario */}
              <div className="max-w-3xl p-6 bg-slate-50/50 rounded-2xl border border-slate-200">
                <UsuarioForm
                  modo={demoFormModo}
                  valoresIniciales={
                    demoFormModo === 'edicion'
                      ? {
                          idUsuario: 10,
                          authId: 'uuid-socio-10',
                          dni: '34567890',
                          nombre: 'Camila',
                          apellido: 'Navarro',
                          email: 'camila.navarro@email.com',
                          telefono: '11-6677-8899',
                          tipoUsuario: 'RECEPCIONISTA',
                          idSede: 1,
                          fotoUrl: '',
                        }
                      : null
                  }
                  loading={demoFormLoading}
                  sedesDisponibles={[
                    { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
                    { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
                    { idSede: 3, nombre: 'FitZone Caballito', aforoMaximo: 50 },
                  ]}
                  onSubmit={async (datos) => {
                    setDemoFormLoading(true);
                    await new Promise((res) => setTimeout(res, 700));
                    setDemoFormLoading(false);
                    addToast(
                      demoFormModo === 'alta' ? 'Usuario Creado (Demo)' : 'Usuario Guardado (Demo)',
                      `${datos.nombre} ${datos.apellido} (${datos.tipoUsuario}) — Sede ID: ${datos.idSede}`,
                      'success'
                    );
                  }}
                  onCancel={() =>
                    addToast('Cancelado', 'Operación cancelada por el usuario.', 'info')
                  }
                />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 10. MEMBRESÍAS DEL SOCIO (RF-02) */}
      {shouldShow('membresias') && (
        <section className="space-y-8 pt-4 border-t-2 border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#1B2A55] text-white">
                  RF-02
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F26D6D]/15 text-[#F26D6D]">
                  CATÁLOGO & ESTADO
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#1B2A55] font-outfit mt-1">
                10. Módulo Membresías del Socio (RF-02)
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl">
                Componentes reutilizables para el catálogo de planes (<code className="text-[#1B2A55] font-mono">PlanCard</code>),
                panel de estado con alerta de vencimiento (&lt; 7 días) (<code className="text-[#1B2A55] font-mono">MembresiaEstadoCard</code>)
                y transiciones de ciclo de vida con confirmación modal (<code className="text-[#1B2A55] font-mono">AccionesMembresia</code>).
              </p>
            </div>
          </div>

          {/* 10.1 PlanCard — Catálogo */}
          <Card title="10.1 PlanCard — Catálogo y Selección de Tarifas">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Tarjeta con precio formateado, duración, cálculo mensual y distintivo de destacado.
                </span>
                <div className="text-xs font-mono font-bold text-fitzone-navy bg-slate-100 px-3 py-1 rounded-lg">
                  Plan seleccionado en demo: ID #{demoSelectedPlanId}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MOCK_PLANES.map((plan) => (
                  <PlanCard
                    key={plan.idPlan}
                    plan={plan}
                    selected={demoSelectedPlanId === plan.idPlan}
                    onSeleccionar={(p) => {
                      setDemoSelectedPlanId(p.idPlan);
                      addToast(
                        'Plan Seleccionado',
                        `Has elegido el ${p.nombre} ($${p.precioBase.toLocaleString('es-AR')})`,
                        'success'
                      );
                    }}
                    actionLabel={demoSelectedPlanId === plan.idPlan ? 'Seleccionado' : 'Elegir Plan'}
                  />
                ))}
              </div>
            </div>
          </Card>

          {/* 10.2 MembresiaEstadoCard — Alerta de vencimiento y Estados */}
          <Card title="10.2 MembresiaEstadoCard — Estados y Alerta de Vencimiento (< 7 días)">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Alterná entre los diferentes escenarios para ver el comportamiento de las alertas automáticas.
                </span>

                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                  {(
                    [
                      { id: 'activo-alerta', label: 'Activo (< 7 días)' },
                      { id: 'activo-ok', label: 'Activo (> 7 días)' },
                      { id: 'vencido', label: 'Vencido' },
                      { id: 'suspendido', label: 'Suspendido' },
                      { id: 'cancelado', label: 'Cancelado' },
                      { id: 'sin-membresia', label: 'Sin Membresía' },
                    ] as const
                  ).map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setDemoMembresiaScenario(sc.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        demoMembresiaScenario === sc.id
                          ? 'bg-white text-fitzone-navy shadow-xs'
                          : 'text-slate-500 hover:text-fitzone-navy'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generar datos según escenario seleccionado */}
              {(() => {
                const socioMock: UsuarioDTO = {
                  idUsuario: 1,
                  authId: 'uuid-1',
                  dni: '30123456',
                  nombre: 'Lucas',
                  apellido: 'Martínez',
                  email: 'lucas.martinez@email.com',
                  telefono: '11-4567-8901',
                  fotoUrl: null,
                  tipoUsuario: 'SOCIO',
                  idSede: 1,
                };

                const hoy = new Date();
                const formatear = (d: Date) => d.toISOString().split('T')[0];

                let membresiaDemo: MembresiaDTO | null = null;

                if (demoMembresiaScenario === 'activo-alerta') {
                  const vto = new Date(hoy);
                  vto.setDate(hoy.getDate() + 3); // 3 días restantes (< 7d)
                  membresiaDemo = {
                    idMembresia: 101,
                    usuario: socioMock,
                    plan: MOCK_PLANES[0],
                    fechaInicio: formatear(new Date(hoy.getTime() - 27 * 86400000)),
                    fechaVencimiento: formatear(vto),
                    fechaCancelacion: null,
                    estado: 'ACTIVO',
                  };
                } else if (demoMembresiaScenario === 'activo-ok') {
                  const vto = new Date(hoy);
                  vto.setDate(hoy.getDate() + 25); // 25 días restantes (> 7d)
                  membresiaDemo = {
                    idMembresia: 102,
                    usuario: socioMock,
                    plan: MOCK_PLANES[1],
                    fechaInicio: formatear(new Date(hoy.getTime() - 65 * 86400000)),
                    fechaVencimiento: formatear(vto),
                    fechaCancelacion: null,
                    estado: 'ACTIVO',
                  };
                } else if (demoMembresiaScenario === 'vencido') {
                  const vto = new Date(hoy);
                  vto.setDate(hoy.getDate() - 5); // Vencido hace 5 días
                  membresiaDemo = {
                    idMembresia: 103,
                    usuario: socioMock,
                    plan: MOCK_PLANES[0],
                    fechaInicio: formatear(new Date(hoy.getTime() - 35 * 86400000)),
                    fechaVencimiento: formatear(vto),
                    fechaCancelacion: null,
                    estado: 'VENCIDO',
                  };
                } else if (demoMembresiaScenario === 'suspendido') {
                  const vto = new Date(hoy);
                  vto.setDate(hoy.getDate() + 15);
                  membresiaDemo = {
                    idMembresia: 104,
                    usuario: socioMock,
                    plan: MOCK_PLANES[1],
                    fechaInicio: formatear(new Date(hoy.getTime() - 40 * 86400000)),
                    fechaVencimiento: formatear(vto),
                    fechaCancelacion: null,
                    estado: 'SUSPENDIDO',
                  };
                } else if (demoMembresiaScenario === 'cancelado') {
                  const cancelada = new Date(hoy);
                  cancelada.setDate(hoy.getDate() - 10);
                  membresiaDemo = {
                    idMembresia: 105,
                    usuario: socioMock,
                    plan: MOCK_PLANES[0],
                    fechaInicio: formatear(new Date(hoy.getTime() - 40 * 86400000)),
                    fechaVencimiento: formatear(new Date(hoy.getTime() - 10 * 86400000)),
                    fechaCancelacion: formatear(cancelada),
                    estado: 'CANCELADO',
                  };
                } else {
                  membresiaDemo = null;
                }

                return (
                  <div className="max-w-3xl mx-auto">
                    <MembresiaEstadoCard
                      membresia={membresiaDemo}
                      socio={socioMock}
                      onRenovarClick={() =>
                        addToast(
                          'Renovación Solicitada',
                          'Se inició el flujo de renovación desde la tarjeta de estado.',
                          'info'
                        )
                      }
                    />
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* 10.3 AccionesMembresia — Transiciones y Confirmación */}
          <Card title="10.3 AccionesMembresia — Transiciones de Estado y ConfirmDialog">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Cambiá el estado simulado para observar cómo se habilitan únicamente las transiciones válidas.
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Estado simulado:</span>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {(['ACTIVO', 'VENCIDO', 'SUSPENDIDO', 'CANCELADO'] as EstadoMembresia[]).map(
                      (est) => (
                        <button
                          key={est}
                          type="button"
                          onClick={() => setDemoAccionesEstado(est)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            demoAccionesEstado === est
                              ? 'bg-white text-fitzone-navy shadow-xs'
                              : 'text-slate-500 hover:text-fitzone-navy'
                          }`}
                        >
                          {est}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-slate-500">Estado Actual:</span>
                    <StatusBadge status={demoAccionesEstado} showDot size="sm" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Hacé clic en cualquier acción para probar el modal de confirmación correspondiente.
                  </p>
                </div>

                <AccionesMembresia
                  estado={demoAccionesEstado}
                  onRenovar={() => {
                    setDemoAccionesEstado('ACTIVO');
                    addToast(
                      'Membresía Renovada',
                      'La membresía fue renovada exitosamente a estado ACTIVO.',
                      'success'
                    );
                  }}
                  onSuspender={() => {
                    setDemoAccionesEstado('SUSPENDIDO');
                    addToast(
                      'Membresía Suspendida',
                      'El acceso del socio quedó pausado.',
                      'warning'
                    );
                  }}
                  onReactivar={() => {
                    setDemoAccionesEstado('ACTIVO');
                    addToast(
                      'Membresía Reactivada',
                      'El socio recuperó el acceso completo.',
                      'success'
                    );
                  }}
                  onCancelar={() => {
                    setDemoAccionesEstado('CANCELADO');
                    addToast(
                      'Membresía Cancelada',
                      'La membresía ha sido cancelada definitivamente.',
                      'error'
                    );
                  }}
                />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 11. AGENDA DE CLASES GRUPALES (RF-06) */}
      {shouldShow('clases') && (
        <section className="space-y-8 pt-4 border-t-2 border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#1B2A55] text-white">
                  RF-06
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#1B2A55] font-outfit mt-1">
                11. Módulo Agenda de Clases Grupales (RF-06)
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl">
                Componentes <code className="text-[#1B2A55] font-mono">AgendaSemanal</code>,{' '}
                <code className="text-[#1B2A55] font-mono">ClaseForm</code> y{' '}
                <code className="text-[#1B2A55] font-mono">CupoIndicator</code> con datos de prueba interactivos.
              </p>
            </div>
          </div>

          {/* 11.1 AgendaSemanal — Live grid */}
          <Card title="11.1 AgendaSemanal — Grilla Semanal Interactiva" subtitle="Hacé clic sobre una clase para editarla, o usá el botón Eliminar">
            <div className="mb-4 flex items-center gap-2">
              <Button
                id="pg-btn-agregar-clase-demo"
                size="sm"
                variant="coral"
                onClick={() => {
                  const nuevaClase: ClaseGrupalDTO = {
                    idClase: Date.now(),
                    sede: mockSede,
                    nombreActividad: 'Funcional',
                    fechaHoraInicio: '2026-10-25T08:00:00',
                    duracionMinutos: 45,
                    cupoMaximo: 15,
                    cupoDisponible: 15,
                  };
                  setMockClases((prev) => [...prev, nuevaClase]);
                  addToast('Clase Agregada (Demo)', 'Se agregó Funcional al viernes.', 'success');
                }}
              >
                + Agregar clase de demo
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setMockClases(prev => prev.slice(0, 5));
                  addToast('Reset', 'Agenda restaurada a datos iniciales.', 'info');
                }}
              >
                Restaurar
              </Button>
            </div>
            <AgendaSemanal
              clases={mockClases}
              onEdit={(c) => {
                setPgSelectedClase(c);
                setPgFormModo('edicion');
                setPgFormError(null);
                addToast('Editar Clase', `Seleccionaste: ${c.nombreActividad}`, 'info');
              }}
              onDelete={(c) => {
                setMockClases((prev) => prev.filter((x) => x.idClase !== c.idClase));
                addToast('Clase Eliminada (Demo)', `"${c.nombreActividad}" fue eliminada de la agenda.`, 'warning');
              }}
            />
          </Card>

          {/* 11.2 ClaseForm */}
          <Card title="11.2 ClaseForm — Formulario de Alta y Edición" subtitle="Cambiá el modo para ver cómo se pre-populan los campos">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-black text-[#1B2A55] uppercase tracking-wider">Modo activo:</span>
              <Button
                size="xs"
                variant={pgFormModo === 'alta' ? 'primary' : 'secondary'}
                onClick={() => { setPgFormModo('alta'); setPgSelectedClase(undefined); setPgFormError(null); }}
              >
                Alta
              </Button>
              <Button
                size="xs"
                variant={pgFormModo === 'edicion' ? 'primary' : 'secondary'}
                onClick={() => {
                  setPgFormModo('edicion');
                  setPgSelectedClase(mockClases[0]);
                  setPgFormError(null);
                }}
              >
                Edición (pre-popula con Spinning)
              </Button>
              <Button
                size="xs"
                variant="danger"
                onClick={() => setPgFormError('El cupo máximo no puede ser menor al número de reservas ya confirmadas (5 personas inscriptas).')}
              >
                Simular Error de Negocio
              </Button>
            </div>

            <div className="max-w-lg">
              <ClaseForm
                modo={pgFormModo}
                valoresIniciales={pgFormModo === 'edicion' ? pgSelectedClase : undefined}
                loading={pgFormLoading}
                errorNegocio={pgFormError}
                onSubmit={async (payload: ClaseFormPayload) => {
                  setPgFormLoading(true);
                  await new Promise((res) => setTimeout(res, 800));
                  setPgFormLoading(false);
                  setPgFormError(null);
                  addToast(
                    pgFormModo === 'alta' ? 'Clase Programada (Demo)' : 'Clase Actualizada (Demo)',
                    `"${payload.nombreActividad}" · ${payload.duracionMinutos} min · Cupo: ${payload.cupoMaximo}`,
                    'success'
                  );
                }}
              />
            </div>
          </Card>

          {/* 11.3 CupoIndicator */}
          <Card title="11.3 CupoIndicator — Barra de Ocupación" subtitle="Varía el color según el porcentaje: verde (< 50%), rojo (≥ 50%)">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Sin inscriptos', disponible: 20, maximo: 20 },
                { label: 'Baja ocupación (25%)', disponible: 15, maximo: 20 },
                { label: 'Alta ocupación (75%)', disponible: 5, maximo: 20 },
                { label: 'Cupo lleno (100%)', disponible: 0, maximo: 20 },
              ].map(({ label, disponible, maximo }) => (
                <div key={label} className="bg-slate-50 rounded-2xl p-4">
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block mb-3">{label}</span>
                  <CupoIndicator cupoDisponible={disponible} cupoMaximo={maximo} />
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          12. CLASES SOCIO — SCRUM-83: ClaseCard, ReservaClaseItem, PosicionEsperaBadge
          Demos de los 3 componentes nuevos del módulo de clases para la vista socio.
      ══════════════════════════════════════════════════════════════════════ */}
      {shouldShow('clases-socio') && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-[#1B2A55] font-outfit">12. Clases Grupales — Vista Socio (SCRUM-83)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Componentes presentacionales: <code className="text-[#1B2A55] font-mono">ClaseCard</code>,{' '}
              <code className="text-[#1B2A55] font-mono">ReservaClaseItem</code> y{' '}
              <code className="text-[#1B2A55] font-mono">PosicionEsperaBadge</code>. Ninguno hace fetch.
            </p>
          </div>

          {/* 12.1 PosicionEsperaBadge */}
          <Card title="12.1 PosicionEsperaBadge — Posición en cola de espera" subtitle="Muestra la posición del socio usando Badge 'gold-soft'. Acepta size='xs'|'sm'.">
            <div className="flex flex-wrap items-center gap-3">
              <PosicionEsperaBadge ordenPosicion={1} size="xs" />
              <PosicionEsperaBadge ordenPosicion={3} size="sm" />
              <PosicionEsperaBadge ordenPosicion={7} size="sm" />
              <PosicionEsperaBadge ordenPosicion={12} size="sm" />
            </div>
          </Card>

          {/* 12.2 ClaseCard — 4 estados del botón */}
          <Card
            title="12.2 ClaseCard — Los 4 estados del botón de acción"
            subtitle="Ventana 48 hs: dentro = Reservar / En espera. Fuera = deshabilitado. Ya reservada = deshabilitado."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Estado A: RESERVAR (cupo disponible + dentro de 48 hs) */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  A — Botón "Reservar"
                </span>
                <ClaseCard
                  clase={{
                    idClase: 901,
                    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
                    nombreActividad: 'Spinning',
                    fechaHoraInicio: toLocalISOString(new Date(Date.now() + 20 * 3600_000)),
                    duracionMinutos: 60,
                    cupoMaximo: 20,
                    cupoDisponible: 5,
                  }}
                  estaReservada={false}
                  estaEnEspera={false}
                  onReservar={() => addToast('Demo', 'reservarClase(901, socioId) llamado.', 'success')}
                  onAnotarEnEspera={() => {}}
                />
              </div>

              {/* Estado B: ANOTARME EN ESPERA (sin cupo + dentro de 48 hs) */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  B — "Anotarme en espera"
                </span>
                <ClaseCard
                  clase={{
                    idClase: 902,
                    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
                    nombreActividad: 'Yoga',
                    fechaHoraInicio: toLocalISOString(new Date(Date.now() + 36 * 3600_000)),
                    duracionMinutos: 75,
                    cupoMaximo: 15,
                    cupoDisponible: 0,
                  }}
                  estaReservada={false}
                  estaEnEspera={false}
                  onReservar={() => {}}
                  onAnotarEnEspera={() => addToast('Demo', 'anotarseEnEspera(902, socioId) llamado.', 'info')}
                />
              </div>

              {/* Estado C: YA RESERVADA (con PosicionEsperaBadge si también en espera) */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  C — "Ya reservada" + en espera
                </span>
                <ClaseCard
                  clase={{
                    idClase: 903,
                    sede: { idSede: 1, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
                    nombreActividad: 'CrossFit',
                    fechaHoraInicio: toLocalISOString(new Date(Date.now() + 10 * 3600_000)),
                    duracionMinutos: 50,
                    cupoMaximo: 12,
                    cupoDisponible: 3,
                  }}
                  estaReservada={true}
                  estaEnEspera={true}
                  ordenEnEspera={2}
                  onReservar={() => {}}
                  onAnotarEnEspera={() => {}}
                />
              </div>

              {/* Estado D: FUERA DE VENTANA (> 48 hs) */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  D — "Fuera de ventana"
                </span>
                <ClaseCard
                  clase={{
                    idClase: 904,
                    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
                    nombreActividad: 'Pilates',
                    fechaHoraInicio: toLocalISOString(new Date(Date.now() + 72 * 3600_000)),
                    duracionMinutos: 60,
                    cupoMaximo: 10,
                    cupoDisponible: 8,
                  }}
                  estaReservada={false}
                  estaEnEspera={false}
                  onReservar={() => {}}
                  onAnotarEnEspera={() => {}}
                />
              </div>
            </div>
          </Card>

          {/* 12.3 ReservaClaseItem — 3 variantes */}
          <Card
            title="12.3 ReservaClaseItem — Estados de la reserva"
            subtitle="BUG-02: solo se cancela si estado=CONFIRMADA y faltan >2 hs. Los demás estados no tienen acción."
          >
            <div className="space-y-3">

              {/* Reserva cancelable (CONFIRMADA, > 2 hs) */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cancelable — CONFIRMADA, faltan +2 hs</span>
                <ReservaClaseItem
                  reserva={{
                    idReservaClase: 801,
                    clase: {
                      idClase: 1,
                      sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
                      nombreActividad: 'Spinning',
                      fechaHoraInicio: toLocalISOString(new Date(Date.now() + 20 * 3600_000)),
                      duracionMinutos: 60,
                      cupoMaximo: 20,
                      cupoDisponible: 5,
                    },
                    usuario: { idUsuario: 2, authId: 'u2', dni: '123', nombre: 'Valentina', apellido: 'García', email: 'v@e.com', telefono: '', fotoUrl: null, tipoUsuario: 'SOCIO', idSede: 1 },
                    estado: 'CONFIRMADA',
                  }}
                  onCancelar={(id) => addToast('Demo', `cancelarReservaClase(${id}) invocado.`, 'info')}
                />
              </div>

              {/* Reserva NO cancelable por tiempo (CONFIRMADA, < 2 hs) */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">No cancelable — CONFIRMADA, faltan ≤ 2 hs (corte)</span>
                <ReservaClaseItem
                  reserva={{
                    idReservaClase: 802,
                    clase: {
                      idClase: 2,
                      sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
                      nombreActividad: 'Yoga',
                      fechaHoraInicio: toLocalISOString(new Date(Date.now() + 1.5 * 3600_000)),
                      duracionMinutos: 75,
                      cupoMaximo: 15,
                      cupoDisponible: 0,
                    },
                    usuario: { idUsuario: 2, authId: 'u2', dni: '123', nombre: 'Valentina', apellido: 'García', email: 'v@e.com', telefono: '', fotoUrl: null, tipoUsuario: 'SOCIO', idSede: 1 },
                    estado: 'CONFIRMADA',
                  }}
                  onCancelar={() => {}}
                />
              </div>

              {/* Reserva CANCELADA — sin acción */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Historial — CANCELADA (sin acción)</span>
                <ReservaClaseItem
                  reserva={{
                    idReservaClase: 803,
                    clase: {
                      idClase: 3,
                      sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
                      nombreActividad: 'CrossFit',
                      fechaHoraInicio: toLocalISOString(new Date(Date.now() - 2 * 3600_000)),
                      duracionMinutos: 50,
                      cupoMaximo: 12,
                      cupoDisponible: 3,
                    },
                    usuario: { idUsuario: 2, authId: 'u2', dni: '123', nombre: 'Valentina', apellido: 'García', email: 'v@e.com', telefono: '', fotoUrl: null, tipoUsuario: 'SOCIO', idSede: 1 },
                    estado: 'CANCELADA',
                  }}
                  onCancelar={() => {}}
                />
              </div>

            </div>
          </Card>
        </section>
      )}

      {/* 13. CÓDIGO QR DE ACCESO & CUENTA REGRESIVA (SCRUM-85) SECTION */}
      {shouldShow('acceso') && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#1B2A55] font-outfit">
                13. Código QR Dinámico & Cuenta Regresiva (SCRUM-85)
              </h2>
              <p className="text-xs text-slate-500">
                Pase digital de acceso para socios con rotación de token automática cada 60s y bloqueo en membresías inactivas.
              </p>
            </div>
          </div>

          {/* 13.1 QrDinamico */}
          <Card
            title="13.1 QrDinamico — Componente de Código QR con Refresco Automático"
            subtitle="Renderiza el QR a partir del token emitido. Al llegar a cero solicita automáticamente un nuevo token."
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controles interactivos */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  Controles de Simulación
                </span>

                <TextField
                  label="Token actual codificado"
                  value={demoQrToken}
                  onChange={(e) => setDemoQrToken(e.target.value)}
                  placeholder="FZ-QR-..."
                  helperText="Cambiá el texto para observar cómo se re-renderiza el QR al instante."
                />

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Duración del ciclo:</span>
                  <div className="flex gap-2">
                    {[15, 30, 60, 90].map((s) => (
                      <Button
                        key={s}
                        size="xs"
                        variant={demoQrDuracion === s ? 'primary' : 'secondary'}
                        onClick={() => setDemoQrDuracion(s)}
                      >
                        {s}s
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant="coral"
                    onClick={() => {
                      const nuevo = `FZ-QR-DEMO-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                      setDemoQrToken(nuevo);
                      setDemoQrError(null);
                      addToast('Token Generado', `Nuevo token: ${nuevo}`, 'success');
                    }}
                  >
                    Generar Nuevo Token Mock
                  </Button>

                  <Button
                    size="xs"
                    variant={demoQrCargando ? 'primary' : 'secondary'}
                    onClick={() => setDemoQrCargando(!demoQrCargando)}
                  >
                    {demoQrCargando ? 'Loading: ON' : 'Simular Cargando'}
                  </Button>

                  <Button
                    size="xs"
                    variant={demoQrError ? 'danger' : 'secondary'}
                    onClick={() => {
                      if (demoQrError) {
                        setDemoQrError(null);
                      } else {
                        setDemoQrError('Conexión con el servicio de acceso interrumpida.');
                      }
                    }}
                  >
                    {demoQrError ? 'Quitar Error' : 'Simular Error'}
                  </Button>
                </div>
              </div>

              {/* Render del componente */}
              <div className="lg:col-span-7 flex justify-center">
                <QrDinamico
                  token={demoQrToken}
                  duracionSegundos={demoQrDuracion}
                  cargando={demoQrCargando}
                  error={demoQrError}
                  onSolicitarNuevoToken={async () => {
                    const nuevo = `FZ-QR-ROTATED-${Date.now()}`;
                    setDemoQrToken(nuevo);
                    addToast('Refresco Automático', 'El contador llegó a cero y se solicitó un nuevo token.', 'info');
                  }}
                  className="max-w-xs w-full"
                />
              </div>
            </div>
          </Card>

          {/* 13.2 CuentaRegresiva */}
          <Card
            title="13.2 CuentaRegresiva — Indicador Visual de Tiempo Restante"
            subtitle="Barra progresiva y contador numérico. Cambia de color dinámicamente según la urgencia."
          >
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="text-xs font-black uppercase text-slate-500 block mb-2">
                  Ajustar segundos restantes: {demoCuentaSegundos}s / 60s
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={demoCuentaSegundos}
                  onChange={(e) => setDemoCuentaSegundos(Number(e.target.value))}
                  className="w-full accent-fitzone-navy cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0s (Expirado)</span>
                  <span>10s (Urgente - Coral)</span>
                  <span>20s (Alerta - Ámbar)</span>
                  <span>60s (Normal - Verde)</span>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={demoCuentaBarra}
                    onChange={(e) => setDemoCuentaBarra(e.target.checked)}
                    className="rounded border-slate-300 text-fitzone-navy focus:ring-fitzone-navy"
                  />
                  <span>Mostrar Barra de Progreso</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={demoCuentaTexto}
                    onChange={(e) => setDemoCuentaTexto(e.target.checked)}
                    className="rounded border-slate-300 text-fitzone-navy focus:ring-fitzone-navy"
                  />
                  <span>Mostrar Contador Numérico</span>
                </label>
              </div>

              {/* Vista previa en tarjeta */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <CuentaRegresiva
                  segundosRestantes={demoCuentaSegundos}
                  totalSegundos={60}
                  mostrarBarra={demoCuentaBarra}
                  mostrarTexto={demoCuentaTexto}
                />
              </div>
            </div>
          </Card>

          {/* 13.3 Regla de Negocio Crítica: Membresía Inactiva Bloquea QR */}
          <Card
            title="13.3 Integración con MembresiaEstadoCard & Regla de Negocio Crítica"
            subtitle="Si la membresía no está activa (VENCIDO, SUSPENDIDO, CANCELADO, SIN_MEMBRESIA), no debe mostrar el QR y en su lugar exhibirá un banner/mensaje informando el motivo."
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-500 mr-2">
                  Estado de membresía a evaluar:
                </span>
                {(['ACTIVO', 'VENCIDO', 'SUSPENDIDO', 'CANCELADO', 'SIN_MEMBRESIA'] as const).map(
                  (estado) => (
                    <Button
                      key={estado}
                      size="xs"
                      variant={demoQrMembresiaEstado === estado ? 'primary' : 'secondary'}
                      onClick={() => setDemoQrMembresiaEstado(estado)}
                    >
                      {estado}
                    </Button>
                  )
                )}
              </div>

              <div className="max-w-md mx-auto space-y-4 pt-4 border-t border-slate-100">
                {/* MembresiaEstadoCard simulada */}
                <MembresiaEstadoCard
                  membresia={
                    demoQrMembresiaEstado === 'SIN_MEMBRESIA'
                      ? null
                      : {
                          idMembresia: 99,
                          usuario: {
                            idUsuario: 2,
                            authId: 'uuid-socio-2',
                            dni: '28456789',
                            nombre: 'Valentina',
                            apellido: 'García',
                            email: 'vgarcia@email.com',
                            telefono: '11-5432-1098',
                            fotoUrl: null,
                            tipoUsuario: 'SOCIO',
                            idSede: 1,
                          },
                          plan: MOCK_PLANES[1],
                          fechaInicio: '2026-08-15',
                          fechaVencimiento:
                            demoQrMembresiaEstado === 'VENCIDO' ? '2026-10-01' : '2026-11-15',
                          fechaCancelacion:
                            demoQrMembresiaEstado === 'CANCELADO' ? '2026-10-10' : null,
                          estado: demoQrMembresiaEstado,
                        }
                  }
                  socio={{
                    idUsuario: 2,
                    authId: 'uuid-socio-2',
                    dni: '28456789',
                    nombre: 'Valentina',
                    apellido: 'García',
                    email: 'vgarcia@email.com',
                    telefono: '11-5432-1098',
                    fotoUrl: null,
                    tipoUsuario: 'SOCIO',
                    idSede: 1,
                  }}
                />

                {/* Evaluación condicional del QR */}
                {demoQrMembresiaEstado === 'ACTIVO' ? (
                  <QrDinamico
                    token={demoQrToken}
                    duracionSegundos={60}
                    onSolicitarNuevoToken={() => {
                      addToast('Token refrescado', 'Ciclo de 60s completado', 'info');
                    }}
                  />
                ) : (
                  <Alert
                    type={demoQrMembresiaEstado === 'VENCIDO' ? 'error' : 'warning'}
                    title={`Acceso Bloqueado · Membresía ${demoQrMembresiaEstado}`}
                    message={`El código QR no se genera porque la membresía no se encuentra activa. Estado actual: ${demoQrMembresiaEstado}.`}
                    action={
                      <Button
                        variant="coral"
                        size="xs"
                        onClick={() => addToast('Renovar', 'Redirigiendo a membresías...', 'info')}
                      >
                        Regularizar
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 14. MÓDULO CANCHAS (RF-10, RF-11, SCRUM-73, SCRUM-75) */}
      {shouldShow('canchas') && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-xl font-black text-[#1B2A55] font-outfit">
                14. Módulo de Canchas (RF-10, RF-11)
              </h2>
              <p className="text-xs text-slate-500">
                Componentes reutilizables: <code className="text-[#1B2A55] font-mono">CanchaCard</code>,{' '}
                <code className="text-[#1B2A55] font-mono">MantenimientoToggle</code>,{' '}
                <code className="text-[#1B2A55] font-mono">SelectorFecha</code>,{' '}
                <code className="text-[#1B2A55] font-mono">GrillaDisponibilidad</code> y{' '}
                <code className="text-[#1B2A55] font-mono">DesglosePrecio</code> con manejo de conflicto (409).
              </p>
            </div>

            {/* Controles interactivos de playground */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPgCanchaEsSocio((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pgCanchaEsSocio
                    ? 'bg-[#2E9E5B] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {pgCanchaEsSocio ? 'Beneficio Socio Activo: ACTIVADO (-15%)' : 'Modo: Cliente Externo (Tarifa Plena)'}
              </button>

              <select
                aria-label="Tarifa base de la cancha"
                value={pgCanchaBasePrice}
                onChange={(e) => setPgCanchaBasePrice(Number(e.target.value))}
                className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-fitzone-navy"
              >
                <option value={8000}>Tarifa base: $8.000 / hora</option>
                <option value={10000}>Tarifa base: $10.000 / hora</option>
                <option value={12000}>Tarifa base: $12.000 / hora</option>
                <option value={16000}>Tarifa base: $16.000 / hora</option>
              </select>
            </div>
          </div>

          {/* 14.1 CanchaCard & MantenimientoToggle */}
          <Card
            title="14.1 CanchaCard & MantenimientoToggle — Tarjeta de Cancha y Control Operativo"
            subtitle="Tarjeta con badge de estado, tarifa por hora, switch accesible de mantenimiento (RF-12) y modo selección."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  Vista Administrativa (Con MantenimientoToggle y Edición)
                </span>
                <CanchaCard
                  cancha={pgDemoCancha}
                  showAdminControls={true}
                  onEditar={(c) => addToast('Editar Cancha', `Modificar datos de ${c.nombre}`, 'info')}
                  onToggleMantenimiento={(_id, nuevo) => {
                    setPgDemoCanchaEnMantenimiento(nuevo);
                    addToast(
                      nuevo ? 'Cancha en Mantenimiento' : 'Cancha Habilitada',
                      nuevo ? 'Se suspendieron nuevos turnos.' : 'La cancha vuelve a estar disponible.',
                      nuevo ? 'warning' : 'success'
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  Vista Reserva de Turnos (Modo Selección)
                </span>
                <CanchaCard
                  cancha={{
                    idCancha: 2,
                    sede: mockSede,
                    nombre: 'Cancha 2 — Fútbol 5 Techado',
                    tipo: 'FUTBOL_5',
                    precioBaseHora: 14000,
                    enMantenimiento: false,
                  }}
                  showAdminControls={false}
                  selected={pgDemoCanchaSelected}
                  onSelect={() => {
                    setPgDemoCanchaSelected(!pgDemoCanchaSelected);
                    addToast('Cancha Seleccionada', 'Cancha 2 seleccionada para reservar turno.', 'info');
                  }}
                />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  MantenimientoToggle Aislado (RF-12 con ConfirmDialog)
                </span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{pgDemoCancha.nombre}</p>
                    <p className="text-[11px] text-slate-500">
                      Switch directo para alternar mantenimiento con advertencia de turnos confirmados.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-xs font-medium text-slate-600">Estado operativo:</span>
                    <MantenimientoToggle
                      idCancha={pgDemoCancha.idCancha}
                      nombreCancha={pgDemoCancha.nombre}
                      enMantenimiento={pgDemoCanchaEnMantenimiento}
                      onToggle={(nuevo) => {
                        setPgDemoCanchaEnMantenimiento(nuevo);
                        addToast(
                          nuevo ? 'Cancha en Mantenimiento' : 'Cancha Habilitada',
                          nuevo ? 'Se suspendieron nuevos turnos.' : 'La cancha vuelve a estar disponible.',
                          nuevo ? 'warning' : 'success'
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 14.2 SelectorFecha */}
          <Card
            title="14.2 SelectorFecha — Navegación de Fechas"
            subtitle="Navegación día a día, accesos rápidos (Hoy, Mañana...) y datepicker nativo con fecha mínima hoy."
          >
            <div className="space-y-4">
              <SelectorFecha
                fechaSeleccionada={pgCanchaFecha}
                onFechaChange={(f) => {
                  setPgCanchaFecha(f);
                  addToast('Fecha seleccionada', `Nueva fecha: ${f}`, 'info');
                }}
              />
              <div className="text-xs text-slate-500 font-medium">
                Fecha actualmente en estado:{' '}
                <strong className="text-fitzone-navy font-mono">{pgCanchaFecha}</strong>
              </div>
            </div>
          </Card>

          {/* 14.3 GrillaDisponibilidad */}
          <Card
            title="14.3 GrillaDisponibilidad — Franjas Horarias y Franja Pico"
            subtitle="Destaca franja pico (19 a 21 hs), estados LIBRE, OCUPADO, MANTENIMIENTO y RECIEN_TOMADO con precios dinámicos."
          >
            <div className="space-y-4">
              <GrillaDisponibilidad
                franjas={pgFranjasDemo}
                cancha={pgDemoCancha}
                fecha={pgCanchaFecha}
                turnoSeleccionado={pgCanchaTurno}
                onSeleccionarTurno={(turno) => {
                  setPgCanchaTurno(turno);
                  setPgError409(null);
                  addToast('Turno seleccionado', `${turno.textoTurno} · Pico: ${turno.esPico ? 'Sí (+20%)' : 'No'}`, 'success');
                }}
                esSocio={pgCanchaEsSocio}
              />
            </div>
          </Card>

          {/* 14.4 DesglosePrecio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              title="14.4 DesglosePrecio — Cotización de Reserva"
              subtitle="Calcula base, recargo pico (+20%) y beneficio socio (-15%). Reutilizable en checkout de pago."
            >
              {pgCanchaTurno ? (
                <DesglosePrecio
                  cotizacion={calcularCotizacion(
                    pgCanchaBasePrice,
                    pgCanchaTurno.horaInicio,
                    pgCanchaEsSocio
                  )}
                  variant="card"
                  mostrarExplicacion={true}
                />
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Seleccioná un turno en la grilla para ver la cotización.
                </div>
              )}
            </Card>

            {/* 14.5 Simulación de Conflicto 409 */}
            <Card
              title="14.5 Simulación de Horario Tomado (Error 409)"
              subtitle="Demuestra la captura del error 409, mensaje de conflicto y refresco automático de grilla."
            >
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Al intentar confirmar un turno que ya fue ocupado en simultáneo por otro deportista, el backend responde con código <strong className="text-fitzone-red">409 Conflict</strong>.
                </p>

                {pgError409 && (
                  <Alert
                    type="error"
                    title="Conflicto de Horario (409)"
                    message={pgError409}
                  />
                )}

                <div className="flex items-center gap-3">
                  <Button
                    variant="coral"
                    size="sm"
                    onClick={() => {
                      if (!pgCanchaTurno) {
                        addToast('Atención', 'Seleccioná un turno primero en la grilla', 'warning');
                        return;
                      }
                      // Simular conflicto 409
                      setPgError409('El horario ya fue tomado por otro usuario (409). La disponibilidad fue actualizada.');
                      // Marcar el turno actual como RECIEN_TOMADO / OCUPADO en la grilla demo
                      setPgFranjasDemo((prev) =>
                        prev.map((f) =>
                          f.id === pgCanchaTurno.id ? { ...f, estado: 'RECIEN_TOMADO' } : f
                        )
                      );
                      setPgCanchaTurno(null);
                      addToast('Error 409 Simulado', 'El turno fue tomado por otro usuario. Se refrescó la grilla.', 'error');
                    }}
                  >
                    Simular Conflicto 409 al Reservar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Restaurar grilla demo
                      setPgFranjasDemo([
                        { id: '16:00-17:00', horaInicio: '16:00', horaFin: '17:00', textoTurno: '16:00 – 17:00', esPico: false, estado: 'LIBRE', precioEstimado: 10000 },
                        { id: '17:00-18:00', horaInicio: '17:00', horaFin: '18:00', textoTurno: '17:00 – 18:00', esPico: false, estado: 'OCUPADO', precioEstimado: 10000 },
                        { id: '18:00-19:00', horaInicio: '18:00', horaFin: '19:00', textoTurno: '18:00 – 19:00', esPico: false, estado: 'MANTENIMIENTO', precioEstimado: 10000 },
                        { id: '19:00-20:00', horaInicio: '19:00', horaFin: '20:00', textoTurno: '19:00 – 20:00', esPico: true, estado: 'LIBRE', precioEstimado: 10000 },
                        { id: '20:00-21:00', horaInicio: '20:00', horaFin: '21:00', textoTurno: '20:00 – 21:00', esPico: true, estado: 'RECIEN_TOMADO', precioEstimado: 10000 },
                        { id: '21:00-22:00', horaInicio: '21:00', horaFin: '22:00', textoTurno: '21:00 – 22:00', esPico: false, estado: 'LIBRE', precioEstimado: 10000 },
                      ]);
                      setPgError409(null);
                      addToast('Grilla restablecida', 'Se restauró el estado inicial de turnos.', 'info');
                    }}
                  >
                    Restablecer Grilla
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}

