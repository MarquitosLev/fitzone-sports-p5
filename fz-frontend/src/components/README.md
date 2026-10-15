# FitZone Sports — Documentación de Componentes UI Base

> **Ubicación:** `src/components/ui/`  
> **Importación recomendada:** `import { Componente } from '@/components/ui';` o `from '../components/ui';` (exportados desde [`index.js`](fitzone-sports-p5/fz-frontend/src/components/ui/index.js)).

Todos los componentes son **puramente presentacionales** (controlados al 100% por props, sin llamadas a API directas ni acoplamiento de negocio) y utilizan la paleta corporativa de FitZone configurada en Tailwind CSS.

---

## Índice Rápido de Componentes

1. [`Button`](#1-button) — Botón modular interactivo
2. [`TextField`](#2-textfield) — Input de texto / contraseñas
3. [`Select`](#3-select) — Selector de opciones dropdown
4. [`DateTimeField`](#4-datetimefield) — Input de fecha y hora
5. [`Modal`](#5-modal) — Diálogo modal accesible
6. [`ConfirmDialog`](#6-confirmdialog) — Diálogo modal de confirmación
7. [`DataTable`](#7-datatable) — Tabla de datos con paginación y skeletons
8. [`Card`](#8-card) — Contenedor base de tarjeta con subcomponentes
9. [`StatusBadge`](#9-statusbadge) — Insignia que mapea estados del backend
10. [`Badge`](#10-badge) — Chip de estado o etiqueta simple
11. [`Alert`](#11-alert) — Banners de error, éxito, advertencia e info
12. [`Toast` & `ToastContainer`](#12-toast--toastcontainer) — Notificaciones flotantes temporizadas
13. [`Spinner`](#13-spinner) — Indicador animado de carga asíncrona
14. [`EmptyState`](#14-emptystate) — Vista de feedback para listas vacías
15. [`StatCard`](#15-statcard) — Métrica visual o tarjeta de KPI
16. [`QRCodePass`](#16-qrcodepass) — Pase de acceso digital con QR dinámico

---

## 1. Button

Botón versátil con soporte de variantes de diseño, estados asíncronos y posicionamiento de iconos.

- **Archivo:** [`Button.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/Button.jsx)
- **Props principales:**
  - `variant`: `'primary'` (Navy) | `'coral'` (CTA principal) | `'secondary'` (Blanco con borde) | `'danger'` (Rojo destructivo) | `'success'` (Verde) | `'outline'` | `'ghost'`. _(Default: `'primary'`)_.
  - `size`: `'xs'` | `'sm'` | `'md'` | `'lg'`. _(Default: `'md'`)_.
  - `isLoading` o `loading`: `boolean`. Si es `true`, reemplaza/acompaña el contenido con un spinner animado.
  - `loadingText`: `string`. Texto alternativo mostrado mientras carga.
  - `disabled`: `boolean`. Deshabilita clics y atenúa la opacidad.
  - `leftIcon` / `rightIcon` / `icon`: Componente icono de Lucide (`Calendar`, `Trash2`, etc.) o elemento JSX.
  - `fullWidth`: `boolean`. Ocupa el 100% del ancho del contenedor.
  - `type`: `'button'` | `'submit'` | `'reset'`. _(Default: `'button'`)_.
- **Ejemplo:**

```jsx
<Button variant="coral" size="md" leftIcon={Calendar} isLoading={isSubmitting}>
  Confirmar Turno
</Button>
```

---

## 2. TextField

Campo de entrada para texto, correos y claves con soporte de etiquetas, iconos y mensajes de validación.

- **Archivo:** [`TextField.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/TextField.jsx)
- **Props principales:**
  - `label`: `string`. Etiqueta visible encima del input.
  - `helperText`: `string`. Texto explicativo debajo del input.
  - `error` / `errorMessage`: `string` u `object`. Muestra mensaje en rojo y activa el borde de error.
  - `required`: `boolean`. Añade asterisco rojo al label.
  - `disabled`: `boolean`.
  - `type`: `'text'` | `'email'` | `'password'` | `'number'` | etc. _(Si es `'password'`, incluye automáticamente botón para alternar visibilidad)_.
  - `leftIcon` / `rightIcon`: Componente icono de Lucide o JSX.
  - `value`, `onChange`, `placeholder`, `name`, `id`: Props HTML estándar de input.
- **Ejemplo:**

```jsx
<TextField
  label="Correo Electrónico"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  required
  leftIcon={Mail}
/>
```

---

## 3. Select

Menú desplegable accesible y estilizado con la estética FitZone.

- **Archivo:** [`Select.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/Select.jsx)
- **Props principales:**
  - `label`: `string`.
  - `options`: `Array<{ value: string|number, label: string }>` o strings.
  - `value`: Valor seleccionado.
  - `onChange`: Callback disparado al seleccionar `(e) => ...` o `(value) => ...`.
  - `placeholder`: `string`. Opción neutra por defecto.
  - `helperText`: `string`.
  - `error`: `string`. Mensaje de error.
  - `disabled`: `boolean`.
  - `required`: `boolean`.
- **Ejemplo:**

```jsx
<Select
  label="Sede"
  value={sedeId}
  onChange={(e) => setSedeId(e.target.value)}
  options={[
    { value: "palermo", label: "Sede Palermo" },
    { value: "belgrano", label: "Sede Belgrano" },
  ]}
/>
```

---

## 4. DateTimeField

Input especializado para fechas y horas con formato estandarizado.

- **Archivo:** [`DateTimeField.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/DateTimeField.jsx)
- **Props principales:**
  - `type`: `'date'` | `'time'` | `'datetime-local'`. _(Default: `'date'`)_.
  - `label`: `string`.
  - `value`, `onChange`, `min`, `max`: Props HTML estándar.
  - `error`: `string`.
  - `helperText`: `string`.
  - `required`: `boolean`.
  - `disabled`: `boolean`.
- **Ejemplo:**

```jsx
<DateTimeField
  type="date"
  label="Fecha de Reserva"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  min="2026-10-15"
/>
```

---

## 5. Modal

Ventana emergente accesible con desenfoque de fondo y scroll contenido.

- **Archivo:** [`Modal.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/Modal.jsx)
- **Props principales:**
  - `isOpen`: `boolean`. Controla si el modal es visible.
  - `onClose`: `() => void`. Disparado al presionar Escape o clic fuera.
  - `title`: `string`. Título de la cabecera.
  - `subtitle`: `string`. Subtítulo opcional.
  - `icon`: Componente icono que acompaña al título.
  - `size`: `'sm'` | `'md'` | `'lg'` | `'xl'`. _(Default: `'md'`)_.
  - `footer`: Nodo React (usualmente botones `Button`).
  - `children`: Contenido principal del modal.
- **Ejemplo:**

```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Detalle del Turno"
  footer={<Button onClick={() => setIsOpen(false)}>Cerrar</Button>}
>
  <p>Contenido del modal...</p>
</Modal>
```

---

## 6. ConfirmDialog

Diálogo especializado para confirmar acciones peligrosas o advertencias.

- **Archivo:** [`ConfirmDialog.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/ConfirmDialog.jsx)
- **Props principales:**
  - `isOpen`: `boolean`.
  - `onClose`: `() => void`.
  - `onConfirm`: `() => void`.
  - `title`: `string`.
  - `description`: `string` o nodo React con el mensaje de advertencia.
  - `confirmText`: `string`. _(Default: `'Confirmar'`)_.
  - `cancelText`: `string`. _(Default: `'Cancelar'`)_.
  - `variant`: `'danger'` (Rojo destructivo) | `'warning'` (Dorado advertencia) | `'primary'`. _(Default: `'danger'`)_.
  - `isLoading`: `boolean`. Muestra spinner en el botón de confirmación.
- **Ejemplo:**

```jsx
<ConfirmDialog
  isOpen={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  onConfirm={handleDelete}
  title="¿Cancelar Reserva?"
  description="Esta acción liberará la cancha y no se podrá deshacer."
  variant="danger"
  confirmText="Sí, Cancelar"
  isLoading={isDeleting}
/>
```

---

## 7. DataTable

Tabla de datos completa con soporte de columnas dinámicas, estados skeleton de carga, estado vacío integrado y paginación.

- **Archivo:** [`DataTable.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/DataTable.jsx)
- **Props principales:**
  - `columns`: `Array<{ key: string, header: string, width?: string, align?: 'left'|'center'|'right', render?: (row, index) => ReactNode, className?: string }>`
  - `data`: `Array<object>`. Lista de filas a renderizar.
  - `isLoading`: `boolean`. Muestra 4 filas de skeleton animados.
  - `emptyTitle`: `string`. Título si `data` está vacío.
  - `emptyMessage`: `string`. Descripción si `data` está vacío.
  - `emptyActionLabel`: `string`. Botón de acción dentro del estado vacío.
  - `onEmptyAction`: `() => void`.
  - `onRowClick`: `(row, index) => void`. Convierte las filas en interactivas.
  - `pagination`: `{ currentPage: number, totalPages: number, pageSize?: number, totalItems?: number, onPageChange: (newPage: number) => void }`.
- **Ejemplo:**

```jsx
<DataTable
  columns={[
    { key: "code", header: "Código" },
    { key: "user", header: "Socio" },
    {
      key: "status",
      header: "Estado",
      render: (r) => <StatusBadge status={r.status} />,
    },
  ]}
  data={reservas}
  isLoading={loading}
  onRowClick={(row) => verDetalle(row.id)}
  pagination={{
    currentPage: page,
    totalPages: 3,
    onPageChange: (p) => setPage(p),
  }}
/>
```

---

## 8. Card

Contenedor modular con variantes de fondo y soporte de patrón de componentes compuestos.

- **Archivo:** [`Card.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/Card.jsx)
- **Props principales:**
  - `variant`: `'default'` (Blanco con sombra) | `'glass'` (Glassmorphism) | `'flat'` | `'navy'` (Fondo `#1B2A55` oscuro) | `'highlight'` (Borde superior acento en Coral).
  - `title`, `subtitle`, `action`, `icon`, `footer`: Ranuras directas por props.
  - `interactive` o `hoverable`: `boolean`. Añade elevación y escala al hover.
  - `onClick`: `() => void`.
  - `padded`: `boolean`. Agrega padding interior `p-6` _(Default: `true`)_.
- **Subcomponentes para composición:**
  - `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`.
- **Ejemplo:**

```jsx
<Card
  title="Cancha 1"
  subtitle="Paddle"
  variant="highlight"
  footer={<Button size="xs">Reservar</Button>}
>
  <p className="text-sm">Pasto sintético con iluminación LED.</p>
</Card>
```

---

## 9. StatusBadge

Insignia que traduce automáticamente cualquier código de estado del backend a su color corporativo y texto en español.

- **Archivo:** [`StatusBadge.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/StatusBadge.jsx)
- **Mapeo automático de estados:**
  - **Verde (`green`):** `ACTIVO`, `ACTIVA`, `CONFIRMADA`, `CONFIRMADO`, `PAGADO`, `DISPONIBLE`, `PERMITIDO`, `ONLINE`, `APROBADO`, `REGULAR`.
  - **Rojo (`red`):** `VENCIDO`, `VENCIDA`, `SUSPENDIDO`, `CANCELADO`, `CANCELADA`, `RECHAZADO`, `DENEGADO`, `INACTIVA`, `AUSENTE`, `ERROR`.
  - **Dorado (`gold`):** `PENDIENTE`, `PENDIENTE_PAGO`, `EN_ESPERA`, `LISTA_ESPERA`, `EN_MANTENIMIENTO`, `DEMORADO`.
  - **Navy (`navy`):** `PROGRAMADA`, `EN_CURSO`, `REVISION`, `REGISTRADO`.
  - **Neutro (`neutral`):** `FINALIZADA`, `COMPLETA`, `SIN_MEMBRESIA`, `DESCONOCIDO`.
- **Props principales:**
  - `status`: `string`. Código de estado (ej: `'CONFIRMADA'`).
  - `label`: `string`. Sobrescritura manual opcional del texto a mostrar.
  - `showDot`: `boolean`. Muestra un punto luminoso con el color del estado. _(Default: `false`)_.
  - `size`: `'xs'` | `'sm'` | `'md'` | `'lg'`. _(Default: `'sm'`)_.
  - `variant`: Sobrescritura manual opcional de color (`'green'`, `'red'`, `'gold'`, `'navy'`, `'coral'`, `'neutral'`).
- **Ejemplo:**

```jsx
<StatusBadge status="PENDIENTE_PAGO" showDot size="xs" />
```

---

## 10. Badge

Etiqueta simple para indicar categorías, etiquetas o recuentos.

- **Archivo:** [`Badge.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/Badge.jsx)
- **Props:** `variant` (`'navy'`, `'coral'`, `'green'`, `'red'`, `'gold'`, `'gray'`, `'green-soft'`, etc.), `size` (`'xs'`, `'sm'`, `'md'`), `children`.

---

## 11. Alert

Banners de notificación y diagnóstico integrados. Soporta directamente la estructura de errores devuelta por las APIs backend (`error.title`, `error.message`, `error.errors[]`).

- **Archivo:** [`Alert.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/Alert.jsx)
- **Props principales:**
  - `type`: `'success'` | `'error'` | `'warning'` | `'info'`. _(Default: `'info'`)_.
  - `title`: `string`. Encabezado destacado.
  - `message`: `string` o array de strings con detalles.
  - `error`: `object`. Payload de error del backend (ej: `{ title, message, errors: [] }`).
  - `onClose`: `() => void`. Muestra botón 'X' para cerrar.
  - `action`: Nodo React con botón de acción (ej: reintentar).
- **Ejemplo:**

```jsx
<Alert
  type="error"
  title="Error al Emitir Factura"
  message="El CUIT ingresado no es válido ante AFIP."
  onClose={() => setHasError(false)}
/>
```

---

## 12. Toast & ToastContainer

Sistema de notificaciones temporizadas flotantes.

- **Archivos:** [`Toast.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/Toast.jsx), [`ToastContainer.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/ToastContainer.jsx)
- **Uso:** Incluir `<ToastContainer />` en la raíz de la app y disparar toasts mediante el contexto global `addToast(title, message, type)`.

---

## 13. Spinner

Indicador circular de carga animada.

- **Archivo:** [`Spinner.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/Spinner.jsx)
- **Props:**
  - `size`: `'xs'` | `'sm'` | `'md'` | `'lg'` | `'xl'`. _(Default: `'md'`)_.
  - `color`: `'navy'` | `'coral'` | `'green'` | `'white'` | `'gray'`.
  - `label`: `string`. Texto de carga junto al spinner.
  - `inline`: `boolean`. Si no es inline, se centra en su contenedor.

---

## 14. EmptyState

Vista de feedback ilustrada para estados vacíos o búsquedas sin coincidencias.

- **Archivo:** [`EmptyState.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/EmptyState.jsx)
- **Props:**
  - `icon`: Componente icono de Lucide (ej: `Filter`, `Calendar`, `Inbox`).
  - `title`: `string`.
  - `description`: `string`.
  - `actionLabel` y `onAction`: Botón de acción principal.
  - `secondaryActionLabel` y `onSecondaryAction`: Botón secundario.

---

## 15. StatCard

Tarjeta de métricas clave (KPI) para paneles y dashboards (aforo, ingresos, reservas).

- **Archivo:** [`StatCard.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/StatCard.jsx)
- **Props:**
  - `title`: `string`.
  - `value`: `string` o `number`.
  - `trend`: `string` (ej: `"+12% vs ayer"`).
  - `trendUp`: `boolean`.
  - `icon`: Componente icono.
  - `badge`: `string`.

---

## 16. QRCodePass

Componente para credencial deportiva digital con generación de QR en tiempo real, rotación de seguridad con temporizador (ciclos de 60 segundos) y modo degradado para socios vencidos u offline.

- **Archivo:** [`QRCodePass.jsx`](fitzone-sports-p5/fz-frontend/src/components/ui/QRCodePass.jsx)
- **Props:**
  - `user`: `{ name: string, memberId: string, plan: string, validUntil: string }`.
  - `sede`: `string`. Nombre de la sede operativa.
  - `isExpired`: `boolean`. Si es `true`, bloquea el código visual y muestra alerta de regularización.
