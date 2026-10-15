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
  ];

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
    </div>
  );
}
