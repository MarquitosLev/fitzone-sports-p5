import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const ROLES = {
  SOCIO_ACTIVO: 'SOCIO_ACTIVO',
  SOCIO_VENCIDO: 'SOCIO_VENCIDO',
  EXTERNO: 'EXTERNO',
  RECEPCION: 'RECEPCION',
  GERENTE_CENTRAL: 'GERENTE_CENTRAL',
};

const initialUsers = {
  [ROLES.SOCIO_ACTIVO]: {
    name: 'Martín García',
    role: ROLES.SOCIO_ACTIVO,
    roleLabel: 'SOCIO ACTIVO',
    memberId: 'FZ-18472',
    email: 'martin.garcia@email.com',
    dni: '32.845.761',
    phone: '+54 9 11 4455-8899',
    address: 'Av. Santa Fe 3400, CABA',
    sede: 'Sede Palermo',
    plan: 'Plan Premium',
    membershipStatus: 'ACTIVO',
    validUntil: '15 Nov 2026',
    nextRenewal: '15 Oct 2026',
    contractStart: '15 Nov 2025',
    monthlyPrice: 15000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    initials: 'MG',
    registeredAtSede: 'Sede Palermo',
    benefitDiscount: 0.15, // 15% de descuento en canchas
  },
  [ROLES.SOCIO_VENCIDO]: {
    name: 'Martín García',
    role: ROLES.SOCIO_VENCIDO,
    roleLabel: 'SOCIO (VENCIDO)',
    memberId: 'FZ-18472',
    email: 'martin.garcia@email.com',
    dni: '32.845.761',
    phone: '+54 9 11 4455-8899',
    address: 'Av. Santa Fe 3400, CABA',
    sede: 'Sede Palermo',
    plan: 'Plan Premium',
    membershipStatus: 'VENCIDA',
    validUntil: '15 Sep 2026',
    nextRenewal: 'Venció hace 13 días',
    contractStart: '15 Nov 2025',
    monthlyPrice: 15000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    initials: 'MG',
    registeredAtSede: 'Sede Palermo',
    benefitDiscount: 0.0,
  },
  [ROLES.EXTERNO]: {
    name: 'Laura Soler',
    role: ROLES.EXTERNO,
    roleLabel: 'CLIENTE EXTERNO',
    memberId: 'EXT-9921',
    email: 'laura.soler@email.com',
    dni: '35.120.449',
    phone: '+54 9 11 5566-7788',
    address: 'Av. Coronel Díaz 2100, CABA',
    sede: 'Sede Palermo',
    plan: 'Sin Membresía',
    membershipStatus: 'SIN_MEMBRESIA',
    validUntil: '—',
    nextRenewal: '—',
    contractStart: '—',
    monthlyPrice: 0,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    initials: 'LS',
    registeredAtSede: 'Sede Palermo',
    benefitDiscount: 0.0,
  },
  [ROLES.RECEPCION]: {
    name: 'Lucía Sánchez',
    role: ROLES.RECEPCION,
    roleLabel: 'Recepcionista',
    staffId: 'REC-0412',
    email: 'lucia.sanchez@fitzone.com',
    dni: '29.340.118',
    sede: 'Sede Palermo',
    status: 'Online',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    initials: 'LS',
  },
  [ROLES.GERENTE_CENTRAL]: {
    name: 'Alejandra Vidal',
    role: ROLES.GERENTE_CENTRAL,
    roleLabel: 'GERENCIA CENTRAL',
    staffId: 'GER-001',
    email: 'alejandra.vidal@fitzone.com',
    dni: '24.119.832',
    sede: 'Casa Central (27 sedes)',
    status: 'Online',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    initials: 'AV',
  }
};

const initialSedes = [
  { id: 'palermo', name: 'Palermo', fullName: 'Sede Palermo', address: 'Av. Santa Fe 3200, CABA', distance: '0.5 km', aforo: 86, maxAforo: 100, canchasCount: 5, clasesCount: 28, alert: true, zones: { musculacion: { current: 68, max: 90 }, salones: { current: 58, max: 90 } } },
  { id: 'belgrano', name: 'Belgrano', fullName: 'Sede Belgrano', address: 'Av. Cabildo 1800, CABA', distance: '2.1 km', aforo: 64, maxAforo: 100, canchasCount: 4, clasesCount: 22, alert: false, zones: { musculacion: { current: 40, max: 80 }, salones: { current: 24, max: 60 } } },
  { id: 'recoleta', name: 'Recoleta', fullName: 'Sede Recoleta', address: 'Av. Callao 1500, CABA', distance: '3.4 km', aforo: 52, maxAforo: 80, canchasCount: 3, clasesCount: 18, alert: false, zones: { musculacion: { current: 30, max: 50 }, salones: { current: 22, max: 50 } } },
  { id: 'caballito', name: 'Caballito', fullName: 'Sede Caballito', address: 'Av. Rivadavia 5200, CABA', distance: '4.8 km', aforo: 78, maxAforo: 110, canchasCount: 4, clasesCount: 24, alert: false, zones: { musculacion: { current: 50, max: 70 }, salones: { current: 28, max: 60 } } },
  { id: 'nunez', name: 'Núñez', fullName: 'Sede Núñez', address: 'Av. del Libertador 7200, CABA', distance: '6.2 km', aforo: 45, maxAforo: 90, canchasCount: 3, clasesCount: 16, alert: false, zones: { musculacion: { current: 25, max: 50 }, salones: { current: 20, max: 50 } } },
  { id: 'cordoba', name: 'Córdoba Central', fullName: 'Sede Córdoba Central', address: 'Av. Colón 450, Córdoba', distance: '680 km', aforo: 92, maxAforo: 120, canchasCount: 6, clasesCount: 32, alert: true, zones: { musculacion: { current: 60, max: 70 }, salones: { current: 32, max: 50 } } },
  { id: 'rosario', name: 'Rosario Centro', fullName: 'Sede Rosario Centro', address: 'Bv. Oroño 1100, Rosario', distance: '300 km', aforo: 71, maxAforo: 100, canchasCount: 4, clasesCount: 20, alert: false, zones: { musculacion: { current: 45, max: 60 }, salones: { current: 26, max: 50 } } },
];

const initialClasses = [
  {
    id: 'cls-1',
    title: 'Funcional',
    category: 'Funcional',
    date: 'Jueves 1 de octubre de 2026',
    dateShort: 'Jue 1 Oct',
    time: '18:00–19:00',
    startTime: '18:00',
    endTime: '19:00',
    instructor: 'Sofía Méndez',
    room: 'Sala grupal',
    sede: 'Sede Palermo',
    maxCapacity: 12,
    enrolledCount: 8,
    status: 'PROGRAMADA', // PROGRAMADA, COMPLETA, CANCELADA, FINALIZADA
    intensity: 'media',
    duration: '60 min',
    description: 'Fuerza, movilidad y resistencia en equipo.',
    requirements: 'Traé agua, una toalla y ropa cómoda. Llegá 10 minutos antes para prepararte.',
    enrolledStudents: [
      { id: 'MG', name: 'Martín García', code: 'FZ-0204', plan: 'Plan Premium', status: 'INSCRIPTO' },
      { id: 'VL', name: 'Valentina López', code: 'FZ-0312', plan: 'Plan Premium', status: 'INSCRIPTO' },
      { id: 'LF', name: 'Lucas Ferreira', code: 'FZ-0286', plan: 'Plan Premium', status: 'INSCRIPTO' },
      { id: 'SD', name: 'Sofía Díaz', code: 'FZ-0418', plan: 'Plan Premium', status: 'INSCRIPTO' },
      { id: 'PS', name: 'Pablo Suárez', code: 'FZ-0157', plan: 'Plan Premium', status: 'INSCRIPTO' },
      { id: 'CP', name: 'Carolina Pérez', code: 'FZ-0361', plan: 'Plan Premium', status: 'INSCRIPTO' },
      { id: 'NR', name: 'Nicolás Romero', code: 'FZ-0423', plan: 'Plan Premium', status: 'INSCRIPTO' },
      { id: 'JA', name: 'Julieta Acosta', code: 'FZ-0298', plan: 'Plan Premium', status: 'INSCRIPTO' },
    ],
    waitlist: [],
    isReservedByCurrentUser: false,
    isInWaitlistByCurrentUser: false,
  },
  {
    id: 'cls-2',
    title: 'Spinning',
    category: 'Spinning',
    date: 'Jueves 1 de octubre de 2026',
    dateShort: 'Jue 1 Oct',
    time: '19:00–19:45',
    startTime: '19:00',
    endTime: '19:45',
    instructor: 'Diego Ruiz',
    room: 'Sala ciclismo',
    sede: 'Sede Palermo',
    maxCapacity: 16,
    enrolledCount: 16,
    status: 'COMPLETA',
    intensity: 'alta',
    duration: '45 min',
    description: 'Entrenamiento cardiovascular de alta intensidad sobre bicicleta fija.',
    requirements: 'Botella de agua y toalla indispensables. Calzado deportivo firme.',
    enrolledStudents: Array(16).fill(null).map((_, i) => ({
      id: `SP-${i+1}`,
      name: `Socio ${i+1}`,
      code: `FZ-0${100+i}`,
      plan: 'Plan Premium',
      status: 'INSCRIPTO',
    })),
    waitlist: [
      { id: 'wait-1', name: 'Elena Blanco', position: 1, dateAdded: '28 Sep 09:15' },
      { id: 'wait-2', name: 'Facundo Gómez', position: 2, dateAdded: '28 Sep 09:22' },
      { id: 'wait-3', name: 'Martín García', position: 3, dateAdded: '28 Sep 09:30' },
    ],
    isReservedByCurrentUser: false,
    isInWaitlistByCurrentUser: true,
    waitlistPreference: 'Push',
  },
  {
    id: 'cls-3',
    title: 'Yoga',
    category: 'Yoga',
    date: 'Jueves 1 de octubre de 2026',
    dateShort: 'Jue 1 Oct',
    time: '20:00–21:00',
    startTime: '20:00',
    endTime: '21:00',
    instructor: 'Ana López',
    room: 'Sala zen',
    sede: 'Sede Palermo',
    maxCapacity: 14,
    enrolledCount: 0,
    status: 'CANCELADA',
    cancelReason: 'Instructor no disponible por licencia médica. No se tomarán reservas.',
    intensity: 'baja',
    duration: '60 min',
    description: 'Conexión cuerpo y mente, elongación y respiración consciente.',
    enrolledStudents: [],
    waitlist: [],
    isReservedByCurrentUser: false,
    isInWaitlistByCurrentUser: false,
  },
  {
    id: 'cls-4',
    title: 'Pilates',
    category: 'Pilates',
    date: 'Lunes 28 de septiembre de 2026',
    dateShort: 'Lun 28 Sep',
    time: '08:00–09:00',
    startTime: '08:00',
    endTime: '09:00',
    instructor: 'Laura Costa',
    room: 'Sala grupal',
    sede: 'Sede Palermo',
    maxCapacity: 10,
    enrolledCount: 6,
    status: 'FINALIZADA',
    intensity: 'media',
    duration: '60 min',
    description: 'Control postural, fortalecimiento del core y equilibrio.',
    enrolledStudents: [
      { id: 'MG', name: 'Martín García', code: 'FZ-0204', attendance: 'ASISTIO' },
      { id: 'VL', name: 'Valentina López', code: 'FZ-0312', attendance: 'ASISTIO' },
      { id: 'LF', name: 'Lucas Ferreira', code: 'FZ-0286', attendance: 'NO_ASISTIO' },
      { id: 'SD', name: 'Sofía Díaz', code: 'FZ-0418', attendance: 'PENDIENTE' },
      { id: 'PS', name: 'Pablo Suárez', code: 'FZ-0157', attendance: 'PENDIENTE' },
      { id: 'CP', name: 'Carolina Pérez', code: 'FZ-0361', attendance: 'PENDIENTE' },
    ],
    waitlist: [],
    isReservedByCurrentUser: true,
    isInWaitlistByCurrentUser: false,
  },
  {
    id: 'cls-5',
    title: 'Crossfit',
    category: 'Crossfit',
    date: 'Viernes 2 de octubre de 2026',
    dateShort: 'Vie 2 Oct',
    time: '09:00–10:00',
    startTime: '09:00',
    endTime: '10:00',
    instructor: 'Marcos Varela',
    room: 'Box de entrenamiento',
    sede: 'Sede Palermo',
    maxCapacity: 15,
    enrolledCount: 9,
    status: 'PROGRAMADA',
    intensity: 'alta',
    duration: '60 min',
    description: 'Entrenamiento funcional de alta exigencia metabólica y fuerza.',
    requirements: 'Calzado adecuado de cross-training y muñequeras recomendadas.',
    enrolledStudents: [
      { id: 'MG', name: 'Martín García', code: 'FZ-0204', plan: 'Plan Premium', status: 'INSCRIPTO' },
      { id: 'VL', name: 'Valentina López', code: 'FZ-0312', plan: 'Plan Premium', status: 'INSCRIPTO' },
    ],
    waitlist: [],
    isReservedByCurrentUser: false,
    isInWaitlistByCurrentUser: false,
  },
  {
    id: 'cls-6',
    title: 'Boxeo',
    category: 'Boxeo',
    date: 'Viernes 2 de octubre de 2026',
    dateShort: 'Vie 2 Oct',
    time: '19:00–20:00',
    startTime: '19:00',
    endTime: '20:00',
    instructor: 'Franco Benítez',
    room: 'Ring y Sala 2',
    sede: 'Sede Palermo',
    maxCapacity: 12,
    enrolledCount: 5,
    status: 'PROGRAMADA',
    intensity: 'alta',
    duration: '60 min',
    description: 'Técnica de golpeo, desplazamientos y preparación física de combate.',
    requirements: 'Vendas y guantes propios obligatorios.',
    enrolledStudents: [],
    waitlist: [],
    isReservedByCurrentUser: false,
    isInWaitlistByCurrentUser: false,
  }
];

const initialCourts = [
  {
    id: 'court-1',
    name: 'Paddle · Cancha 1',
    sport: 'Paddle',
    basePrice: 10000,
    status: 'DISPONIBLE',
    surface: 'Sintético / Vidrio Templado',
    covered: true,
    sede: 'Sede Palermo',
    slots: [
      { id: 's-16', time: '16:00–17:00', label: '16:00–17:00', isPeak: false, status: 'DISPONIBLE', price: 10000 },
      { id: 's-17', time: '17:00–18:00', label: '17:00–18:00', isPeak: false, status: 'OCUPADO', price: 10000 },
      { id: 's-18', time: '18:00–19:00', label: '18:00–19:00', isPeak: false, status: 'MANTENIMIENTO', price: 10000 },
      { id: 's-19', time: '19:00–20:00', label: '19:00–20:00', isPeak: true, status: 'DISPONIBLE', price: 12000 }, // +20% pico
      { id: 's-20', time: '20:00–21:00', label: '20:00–21:00', isPeak: true, status: 'RECIEN_TOMADO', price: 12000 },
      { id: 's-21', time: '21:00–22:00', label: '21:00–22:00', isPeak: true, status: 'DISPONIBLE', price: 12000 },
    ]
  },
  {
    id: 'court-2',
    name: 'Paddle · Cancha 2',
    sport: 'Paddle',
    basePrice: 10000,
    status: 'EN_MANTENIMIENTO',
    surface: 'Sintético / Vidrio Templado',
    covered: true,
    sede: 'Sede Palermo',
    maintenanceReason: 'Reparación del cerramiento.',
    maintenanceRange: '2 Oct 2026, 08:00 → 2 Oct 2026, 12:00',
    slots: []
  },
  {
    id: 'court-3',
    name: 'Fútbol 5 · Cancha 1',
    sport: 'Fútbol 5',
    basePrice: 16000,
    status: 'DISPONIBLE',
    surface: 'Césped Sintético Monofilamento',
    covered: false,
    sede: 'Sede Palermo',
    slots: [
      { id: 'f-17', time: '17:00–18:00', label: '17:00–18:00', isPeak: false, status: 'DISPONIBLE', price: 16000 },
      { id: 'f-18', time: '18:00–19:00', label: '18:00–19:00', isPeak: false, status: 'OCUPADO', price: 16000 },
      { id: 'f-19', time: '19:00–20:00', label: '19:00–20:00', isPeak: true, status: 'DISPONIBLE', price: 19200 },
      { id: 'f-20', time: '20:00–21:00', label: '20:00–21:00', isPeak: true, status: 'DISPONIBLE', price: 19200 },
    ]
  },
  {
    id: 'court-4',
    name: 'Tenis · Cancha 1',
    sport: 'Tenis',
    basePrice: 8000,
    status: 'DISPONIBLE',
    surface: 'Polvo de Ladrillo',
    covered: false,
    sede: 'Sede Palermo',
    slots: [
      { id: 't-16', time: '16:00–17:00', label: '16:00–17:00', isPeak: false, status: 'DISPONIBLE', price: 8000 },
      { id: 't-17', time: '17:00–18:00', label: '17:00–18:00', isPeak: false, status: 'OCUPADO', price: 8000 },
      { id: 't-18', time: '18:00–19:00', label: '18:00–19:00', isPeak: false, status: 'DISPONIBLE', price: 8000 },
      { id: 't-19', time: '19:00–20:00', label: '19:00–20:00', isPeak: true, status: 'DISPONIBLE', price: 9600 },
    ]
  },
  {
    id: 'court-5',
    name: 'Básquet · Cancha 1',
    sport: 'Básquet',
    basePrice: 7000,
    status: 'INACTIVA',
    surface: 'Piso Flotante Parquet',
    covered: true,
    sede: 'Sede Palermo',
    slots: []
  }
];

const initialCourtBookings = [
  {
    id: 'FZ-C1029',
    courtName: 'Paddle · Cancha 1',
    sport: 'Paddle',
    date: 'Vie 2 Oct 2026',
    dateFull: 'Viernes 2 de octubre de 2026',
    time: '19:00–20:00',
    duration: '1 hora · Horario pico',
    sede: 'Sede Palermo',
    address: 'Av. Santa Fe 3200',
    status: 'PENDIENTE_PAGO', // PENDIENTE_PAGO, CONFIRMADA, CANCELADA, FINALIZADA
    user: 'Martín García',
    userRole: 'Socio activo',
    basePrice: 10000,
    peakSurge: 2000,
    memberDiscount: -1800, // -15% sobre 12000
    totalPrice: 10200,
    voucherType: 'Factura A',
    cuit: '30-71234567-8',
  },
  {
    id: 'FZ-C1048',
    courtName: 'Paddle · Cancha 1',
    sport: 'Paddle',
    date: 'Sáb 3 Oct 2026',
    dateFull: 'Sábado 3 de octubre de 2026',
    time: '16:00–17:00',
    duration: '1 hora · Estándar',
    sede: 'Sede Palermo',
    address: 'Av. Santa Fe 3200',
    status: 'CONFIRMADA',
    user: 'Martín García',
    userRole: 'Socio activo',
    basePrice: 10000,
    peakSurge: 0,
    memberDiscount: -1500,
    totalPrice: 8500,
    voucherType: 'Factura B',
  },
  {
    id: 'FZ-C1012',
    courtName: 'Tenis · Cancha 1',
    sport: 'Tenis',
    date: 'Jue 1 Oct 2026',
    dateFull: 'Jueves 1 de octubre de 2026',
    time: '17:00–18:00',
    duration: '1 hora · Estándar',
    sede: 'Sede Palermo',
    address: 'Av. Santa Fe 3200',
    status: 'CANCELADA',
    user: 'Martín García',
    userRole: 'Socio activo',
    basePrice: 8000,
    peakSurge: 0,
    memberDiscount: -1200,
    totalPrice: 6800,
  },
  {
    id: 'FZ-C0996',
    courtName: 'Fútbol 5 · Cancha 1',
    sport: 'Fútbol 5',
    date: 'Mié 30 Sep 2026',
    dateFull: 'Miércoles 30 de septiembre de 2026',
    time: '20:00–21:00',
    duration: '1 hora · Horario pico',
    sede: 'Sede Palermo',
    address: 'Av. Santa Fe 3200',
    status: 'FINALIZADA',
    user: 'Martín García',
    userRole: 'Socio activo',
    basePrice: 16000,
    peakSurge: 3200,
    memberDiscount: -2880,
    totalPrice: 16320,
  }
];

const initialPayments = [
  {
    id: 'FZ-P83170',
    concept: 'Membresía · Plan Premium',
    detail: 'Renovación mensual · Oct 2026',
    amount: 15000,
    method: 'Tarjeta de crédito',
    status: 'CONFIRMADO', // CONFIRMADO, PENDIENTE, RECHAZADO
    date: '25 Sep 2026 · 14:32',
    voucher: 'Factura B · 0005-00008317',
    voucherType: 'Factura B',
    cae: '76451230987411',
    caeExp: '05 Oct 2026',
    cuit: 'Consumidor Final',
  },
  {
    id: 'FZ-P84521',
    concept: 'Reserva de cancha',
    detail: 'Paddle 1 · Sede Palermo',
    bookingId: 'FZ-C1029',
    amount: 10200,
    basePrice: 12000,
    discount: -1800,
    netTaxed: 8429.75,
    iva21: 1770.25,
    method: 'Transferencia',
    status: 'CONFIRMADO',
    date: '02 Oct 2026 · 19:02',
    voucher: 'Factura A · 0005-00008421',
    voucherType: 'Factura A',
    cae: '76451230987456',
    caeExp: '12 Oct 2026',
    cuit: '30-71234567-8 · Responsable inscripto',
  },
  {
    id: 'FZ-P84102',
    concept: 'Reserva de cancha',
    detail: 'Tenis 1 · Sede Palermo',
    amount: 8000,
    method: 'Tarjeta de débito',
    status: 'RECHAZADO',
    date: '28 Sep 2026 · 10:18',
    voucher: null,
    rejectReason: 'Límite diario excedido. El banco emisor rechazó la operación. Verificá tu límite o elegí otro medio de pago.',
  },
  {
    id: 'FZ-P79801',
    concept: 'Membresía · Plan Premium',
    detail: 'Renovación mensual · Sep 2026',
    amount: 15000,
    method: 'Tarjeta de crédito',
    status: 'CONFIRMADO',
    date: '25 Ago 2026 · 09:45',
    voucher: 'Factura B · 0005-00007980',
    voucherType: 'Factura B',
    cae: '76451230987019',
    caeExp: '05 Sep 2026',
    cuit: 'Consumidor Final',
  }
];

const initialAccessLogs = [
  { id: 1, name: 'Martín García', type: 'Ingreso', time: '09:41', date: '28 Sep 2026', status: 'PERMITIDO', reason: 'Membresía activa · ingreso registrado', memberId: 'FZ-0204', sede: 'Sede Palermo' },
  { id: 2, name: 'Valentina López', type: 'Egreso', time: '09:39', date: '28 Sep 2026', status: 'PERMITIDO', reason: 'Egreso regular', memberId: 'FZ-0312', sede: 'Sede Palermo' },
  { id: 3, name: 'Camila Torres', type: 'Intento Ingreso', time: '09:38', date: '28 Sep 2026', status: 'DENEGADO', reason: 'Membresía vencida · requiere regularización', memberId: 'FZ-0899', sede: 'Sede Palermo' },
  { id: 4, name: 'Lucas Ferreira', type: 'Ingreso', time: '09:36', date: '28 Sep 2026', status: 'PERMITIDO', reason: 'Membresía activa', memberId: 'FZ-0286', sede: 'Sede Palermo' },
  { id: 5, name: 'Sofía Díaz', type: 'Ingreso', time: '09:34', date: '28 Sep 2026', status: 'PERMITIDO', reason: 'Membresía activa', memberId: 'FZ-0418', sede: 'Sede Palermo' },
  { id: 6, name: 'Pablo Suárez', type: 'Intento Ingreso', time: '09:31', date: '28 Sep 2026', status: 'DENEGADO', reason: 'Ya registrado en otra sede (Sede Belgrano)', memberId: 'FZ-0157', sede: 'Sede Palermo' },
];

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(ROLES.SOCIO_ACTIVO);
  const [currentUser, setCurrentUser] = useState(initialUsers[ROLES.SOCIO_ACTIVO]);
  const [currentRoute, setCurrentRoute] = useState('home'); // home, classes, class-detail, waitlist, courts, court-confirm, reservations, checkout, voucher, history, profile, sedes, qr, recepcion-dashboard, recepcion-scanner, recepcion-aforo, recepcion-agenda, recepcion-attendance, recepcion-courts, recepcion-cash, gerente-dashboard, login, register
  const [routeParams, setRouteParams] = useState({});
  const [selectedSede, setSelectedSede] = useState('Sede Palermo');
  
  // Data stores
  const [sedes, setSedes] = useState(initialSedes);
  const [classes, setClasses] = useState(initialClasses);
  const [courts, setCourts] = useState(initialCourts);
  const [courtBookings, setCourtBookings] = useState(initialCourtBookings);
  const [payments, setPayments] = useState(initialPayments);
  const [accessLogs, setAccessLogs] = useState(initialAccessLogs);
  const [cashRegister, setCashRegister] = useState({
    status: 'ABIERTA',
    totalCollected: 286400,
    membershipsCollected: 210000,
    bookingsCollected: 76400,
    operationsCount: 18,
    closingTime: '14:00',
    cashier: 'Lucía Sánchez',
    registerName: 'Caja Palermo 01',
    lastOperation: { user: 'Camila Torres', concept: 'Reserva de cancha', amount: 12000, voucher: 'Ticket 0005-00008428' }
  });

  // UI helpers
  const [toasts, setToasts] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Switch role and update route accordingly (sin toasts de notificación de rol)
  const switchRole = (newRole) => {
    setCurrentRole(newRole);
    setCurrentUser(initialUsers[newRole]);
    setIsMobileMenuOpen(false);

    if (newRole === ROLES.RECEPCION) {
      setCurrentRoute('recepcion-dashboard');
    } else if (newRole === ROLES.GERENTE_CENTRAL) {
      setCurrentRoute('gerente-dashboard');
    } else if (newRole === ROLES.EXTERNO) {
      setCurrentRoute('home');
    } else if (newRole === ROLES.SOCIO_VENCIDO) {
      setCurrentRoute('home');
    } else {
      setCurrentRoute('home');
    }
  };

  const navigate = (route, params = {}) => {
    setCurrentRoute(route);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Trigger celebratory confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1B2A55', '#F26D6D', '#F0B429', '#2E9E5B']
      });
    } catch (e) {
      console.log('Confetti not available:', e);
    }
  };

  // Actions for Socio / Externo
  const reserveClass = (classId) => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        const isEnrolled = c.isReservedByCurrentUser;
        if (isEnrolled) {
          // Cancel reservation
          return {
            ...c,
            enrolledCount: Math.max(0, c.enrolledCount - 1),
            isReservedByCurrentUser: false,
            enrolledStudents: c.enrolledStudents.filter(s => s.name !== currentUser.name),
            status: c.status === 'COMPLETA' ? 'PROGRAMADA' : c.status,
          };
        } else {
          // Enroll
          const newCount = c.enrolledCount + 1;
          return {
            ...c,
            enrolledCount: newCount,
            isReservedByCurrentUser: true,
            status: newCount >= c.maxCapacity ? 'COMPLETA' : c.status,
            enrolledStudents: [...c.enrolledStudents, { id: 'ME', name: currentUser.name, code: currentUser.memberId || 'FZ-NEW', plan: currentUser.plan, status: 'INSCRIPTO' }]
          };
        }
      }
      return c;
    }));

    const targetClass = classes.find(c => c.id === classId);
    if (targetClass?.isReservedByCurrentUser) {
      addToast('Reserva Cancelada', `Liberaste tu lugar en ${targetClass.title}.`, 'info');
    } else {
      triggerConfetti();
      addToast('¡Lugar Reservado!', `Tu lugar para ${targetClass?.title} está asegurado.`, 'success');
    }
  };

  const toggleWaitlist = (classId, preference = 'Push') => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        const inList = c.isInWaitlistByCurrentUser;
        if (inList) {
          return {
            ...c,
            isInWaitlistByCurrentUser: false,
            waitlist: c.waitlist.filter(w => w.name !== currentUser.name),
          };
        } else {
          const nextPos = c.waitlist.length + 1;
          return {
            ...c,
            isInWaitlistByCurrentUser: true,
            waitlistPreference: preference,
            waitlist: [...c.waitlist, { id: `wait-${Date.now()}`, name: currentUser.name, position: nextPos, dateAdded: 'Hoy' }]
          };
        }
      }
      return c;
    }));

    const targetClass = classes.find(c => c.id === classId);
    if (targetClass?.isInWaitlistByCurrentUser) {
      addToast('Lista de Espera', 'Has salido de la lista de espera.', 'info');
    } else {
      addToast('Anotado en Lista de Espera', `Te avisaremos vía ${preference} si se libera un cupo.`, 'success');
    }
  };

  // Actions for Booking Court & Checkout Flow
  const startCourtBooking = (court, slot, dateStr) => {
    const isMember = currentRole === ROLES.SOCIO_ACTIVO;
    const base = slot.isPeak ? court.basePrice * 1.2 : court.basePrice;
    const discount = isMember ? -(base * 0.15) : 0;
    const total = base + discount;

    const newBooking = {
      id: `FZ-C${Math.floor(1000 + Math.random() * 9000)}`,
      courtName: court.name,
      sport: court.sport,
      date: dateStr || 'Vie 2 Oct 2026',
      dateFull: 'Viernes 2 de octubre de 2026',
      time: slot.time,
      duration: slot.isPeak ? '1 hora · Horario pico' : '1 hora · Estándar',
      sede: court.sede || selectedSede,
      address: 'Av. Santa Fe 3200',
      status: 'PENDIENTE_PAGO',
      user: currentUser.name,
      userRole: isMember ? 'Socio activo' : 'Cliente externo',
      basePrice: court.basePrice,
      peakSurge: slot.isPeak ? court.basePrice * 0.2 : 0,
      memberDiscount: discount,
      totalPrice: total,
      voucherType: 'Factura B',
      cuit: isMember ? '30-71234567-8' : 'Consumidor Final',
    };

    setCourtBookings(prev => [newBooking, ...prev]);
    navigate('court-confirm', { booking: newBooking });
  };

  const processPayment = (bookingOrConcept, paymentMethod, voucherType = 'Factura B', cuit = '') => {
    const isCourtBooking = !!bookingOrConcept.courtName;
    const amount = isCourtBooking ? bookingOrConcept.totalPrice : (bookingOrConcept.amount || currentUser.monthlyPrice);
    const opId = `FZ-P${Math.floor(10000 + Math.random() * 90000)}`;
    const voucherNumber = `0005-0000${Math.floor(8000 + Math.random() * 1000)}`;

    const newPayment = {
      id: opId,
      concept: isCourtBooking ? 'Reserva de cancha' : 'Membresía · Plan Premium',
      detail: isCourtBooking ? `${bookingOrConcept.sport} · ${bookingOrConcept.courtName}` : 'Renovación mensual · Oct 2026',
      bookingId: isCourtBooking ? bookingOrConcept.id : null,
      amount: amount,
      basePrice: isCourtBooking ? (bookingOrConcept.basePrice + bookingOrConcept.peakSurge) : amount,
      discount: isCourtBooking ? bookingOrConcept.memberDiscount : 0,
      netTaxed: +(amount / 1.21).toFixed(2),
      iva21: +(amount - (amount / 1.21)).toFixed(2),
      method: paymentMethod,
      status: 'CONFIRMADO',
      date: '02 Oct 2026 · 19:02',
      voucher: `${voucherType} · ${voucherNumber}`,
      voucherType: voucherType,
      cae: `764512${Math.floor(10000000 + Math.random() * 90000000)}`,
      caeExp: '12 Oct 2026',
      cuit: cuit || (voucherType === 'Factura A' ? '30-71234567-8 · Responsable inscripto' : 'Consumidor Final'),
      bookingData: isCourtBooking ? bookingOrConcept : null,
    };

    setPayments(prev => [newPayment, ...prev]);

    if (isCourtBooking) {
      setCourtBookings(prev => prev.map(b => b.id === bookingOrConcept.id ? { ...b, status: 'CONFIRMADA' } : b));
    } else {
      // If it was membership renewal
      setCurrentUser(prev => ({
        ...prev,
        membershipStatus: 'ACTIVO',
        validUntil: '15 Nov 2026',
        nextRenewal: '15 Oct 2026',
      }));
      if (currentRole === ROLES.SOCIO_VENCIDO) {
        setCurrentRole(ROLES.SOCIO_ACTIVO);
      }
    }

    triggerConfetti();
    addToast('¡Pago Confirmado!', `Operación ${opId} procesada exitosamente.`, 'success');
    navigate('voucher', { payment: newPayment });
  };

  const cancelCourtBooking = (bookingId) => {
    setCourtBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELADA' } : b));
    addToast('Reserva Cancelada', `La reserva ${bookingId} fue cancelada.`, 'info');
  };

  // Actions for Receptionist
  const registerCashPayment = (userQuery, conceptType, conceptDetail, amount) => {
    const opId = `FZ-P${Math.floor(10000 + Math.random() * 90000)}`;
    const ticketNumber = `Ticket 0005-0000${Math.floor(8000 + Math.random() * 1000)}`;
    
    const newPayment = {
      id: opId,
      concept: conceptType === 'Membresía' ? 'Membresía · Plan Premium' : 'Reserva de cancha',
      detail: conceptDetail,
      amount: Number(amount),
      method: 'Efectivo',
      status: 'CONFIRMADO',
      date: 'Hoy · Recepción',
      voucher: ticketNumber,
      voucherType: 'Ticket',
      cae: `764512${Math.floor(10000000 + Math.random() * 90000000)}`,
      caeExp: '12 Oct 2026',
      cuit: 'Consumidor Final',
      cashier: 'Lucía Sánchez · Caja Palermo 01',
      registeredUser: userQuery,
    };

    setPayments(prev => [newPayment, ...prev]);
    setCashRegister(prev => ({
      ...prev,
      totalCollected: prev.totalCollected + Number(amount),
      membershipsCollected: conceptType === 'Membresía' ? prev.membershipsCollected + Number(amount) : prev.membershipsCollected,
      bookingsCollected: conceptType !== 'Membresía' ? prev.bookingsCollected + Number(amount) : prev.bookingsCollected,
      operationsCount: prev.operationsCount + 1,
      lastOperation: { user: userQuery, concept: conceptType, amount: Number(amount), voucher: ticketNumber }
    }));

    triggerConfetti();
    addToast('Cobro en Efectivo Registrado', `${ticketNumber} emitido a ${userQuery} por $${Number(amount).toLocaleString('es-AR')}.`, 'success');
  };

  const logAccessScan = (name, memberId, forceDenied = false) => {
    const isDenied = forceDenied || name.includes('Vencida') || name.includes('Camila') || currentRole === ROLES.SOCIO_VENCIDO;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newLog = {
      id: Date.now(),
      name: name || currentUser.name,
      type: isDenied ? 'Intento Ingreso' : 'Ingreso',
      time: timeStr,
      date: 'Hoy',
      status: isDenied ? 'DENEGADO' : 'PERMITIDO',
      reason: isDenied ? 'Membresía vencida · requiere regularización' : 'Membresía activa · ingreso registrado',
      memberId: memberId || currentUser.memberId || 'FZ-0999',
      sede: selectedSede,
    };

    setAccessLogs(prev => [newLog, ...prev]);
    if (!isDenied) {
      // El indicador de aforo es influenciado ÚNICAMENTE por escaneos efectivos de QR de acceso
      setSedes(prev => prev.map(s => (s.fullName === selectedSede || s.name === selectedSede || selectedSede.includes(s.name)) ? { ...s, aforo: Math.min(s.maxAforo, s.aforo + 1) } : s));
    }
    return newLog;
  };

  const updateAttendance = (classId, studentCode, status) => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          enrolledStudents: c.enrolledStudents.map(s => s.code === studentCode ? { ...s, attendance: status } : s)
        };
      }
      return c;
    }));
    addToast('Asistencia Actualizada', `Estado guardado: ${status}`, 'info');
  };

  const addCourt = (newCourtData) => {
    const newCourt = {
      id: `court-${Date.now()}`,
      name: newCourtData.name,
      sport: newCourtData.sport,
      basePrice: Number(newCourtData.basePrice),
      status: newCourtData.status || 'DISPONIBLE',
      surface: newCourtData.surface || 'Superficie Sintética',
      covered: newCourtData.covered || false,
      sede: selectedSede,
      slots: [
        { id: 'n-16', time: '16:00–17:00', label: '16:00–17:00', isPeak: false, status: 'DISPONIBLE', price: Number(newCourtData.basePrice) },
        { id: 'n-17', time: '17:00–18:00', label: '17:00–18:00', isPeak: false, status: 'DISPONIBLE', price: Number(newCourtData.basePrice) },
        { id: 'n-19', time: '19:00–20:00', label: '19:00–20:00', isPeak: true, status: 'DISPONIBLE', price: Number(newCourtData.basePrice) * 1.2 },
      ]
    };
    setCourts(prev => [...prev, newCourt]);
    addToast('Cancha Creada', `${newCourt.name} ha sido dada de alta en ${selectedSede}.`, 'success');
  };

  const setCourtMaintenance = (courtId, reason, fromDate, toDate) => {
    setCourts(prev => prev.map(c => {
      if (c.id === courtId) {
        return {
          ...c,
          status: 'EN_MANTENIMIENTO',
          maintenanceReason: reason,
          maintenanceRange: `${fromDate} → ${toDate}`
        };
      }
      return c;
    }));
    addToast('Mantenimiento Programado', `Cancha inhabilitada temporalmente con protección de reservas.`, 'warning');
  };

  const cancelClassByAdmin = (classId, reason) => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          status: 'CANCELADA',
          cancelReason: reason || 'Instructor no disponible por licencia médica.',
          enrolledCount: 0,
        };
      }
      return c;
    }));
    addToast('Clase Cancelada', 'Se notificó a los inscriptos y se liberaron los cupos.', 'warning');
  };

  const editClassByAdmin = (classId, updatedData) => {
    setClasses(prev => prev.map(c => {
      if (c.id === classId) {
        return {
          ...c,
          ...updatedData,
          maxCapacity: Number(updatedData.maxCapacity || c.maxCapacity)
        };
      }
      return c;
    }));
    addToast('Clase Actualizada', 'Los cambios se guardaron en la agenda.', 'success');
  };

  const addNewClassByAdmin = (newClassData) => {
    const newClass = {
      id: `cls-${Date.now()}`,
      title: newClassData.title,
      category: newClassData.title,
      date: newClassData.date || 'Jueves 1 de octubre de 2026',
      dateShort: newClassData.dateShort || 'Jue 1 Oct',
      time: `${newClassData.startTime}–${newClassData.endTime}`,
      startTime: newClassData.startTime,
      endTime: newClassData.endTime,
      instructor: newClassData.instructor,
      room: newClassData.room || 'Sala grupal',
      sede: selectedSede,
      maxCapacity: Number(newClassData.maxCapacity || 12),
      enrolledCount: 0,
      status: 'PROGRAMADA',
      intensity: 'media',
      duration: '60 min',
      description: 'Clase programada en agenda.',
      enrolledStudents: [],
      waitlist: [],
      isReservedByCurrentUser: false,
      isInWaitlistByCurrentUser: false,
    };
    setClasses(prev => [newClass, ...prev]);
    addToast('Nueva Clase Creada', `${newClass.title} fue añadida a la agenda.`, 'success');
  };

  return (
    <AppContext.Provider value={{
      currentRole,
      currentUser,
      currentRoute,
      routeParams,
      selectedSede,
      setSelectedSede,
      sedes,
      classes,
      courts,
      courtBookings,
      payments,
      accessLogs,
      cashRegister,
      toasts,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      switchRole,
      navigate,
      addToast,
      removeToast,
      triggerConfetti,
      reserveClass,
      toggleWaitlist,
      startCourtBooking,
      processPayment,
      cancelCourtBooking,
      registerCashPayment,
      logAccessScan,
      updateAttendance,
      addCourt,
      setCourtMaintenance,
      cancelClassByAdmin,
      editClassByAdmin,
      addNewClassByAdmin,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
