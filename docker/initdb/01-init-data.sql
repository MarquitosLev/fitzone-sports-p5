-- FitZone Sports — Semilla Inicial de Datos de Prueba (SCRUM-94)
-- Entorno local de PostgreSQL 16

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Sedes
INSERT INTO fz_sedes (id_sede, nombre, aforo_maximo, created_at, updated_at, created_by, updated_by, is_deleted)
VALUES
    (1, 'Sede Central', 150, NOW(), NOW(), 'system', 'system', false),
    (2, 'Sede Norte', 100, NOW(), NOW(), 'system', 'system', false)
ON CONFLICT (id_sede) DO NOTHING;

-- 2. Planes de Membresía
INSERT INTO fz_pag_planes (id_plan, nombre, precio_base, duracion_meses, created_at, updated_at, created_by, updated_by, is_deleted)
VALUES
    (1, 'Plan Mensual', 15000.00, 1, NOW(), NOW(), 'system', 'system', false),
    (2, 'Plan Trimestral', 40000.00, 3, NOW(), NOW(), 'system', 'system', false),
    (3, 'Plan Anual VIP', 140000.00, 12, NOW(), NOW(), 'system', 'system', false)
ON CONFLICT (id_plan) DO NOTHING;

-- 3. Usuarios de Prueba
INSERT INTO fz_usr_usuarios (id_usuario, dni, nombre, apellido, email, telefono, tipo_usuario, id_sede, auth_id, created_at, updated_at, created_by, updated_by, is_deleted)
VALUES
    (1, '00000001', 'Admin', 'Gerente', 'gerente@fitzone.com', '+5491100000000', 'GERENTE', 1, gen_random_uuid(), NOW(), NOW(), 'system', 'system', false),
    (2, '00000002', 'Lucía', 'Recepcionista', 'recepcionista@fitzone.com', '+5491100000001', 'RECEPCIONISTA', 1, gen_random_uuid(), NOW(), NOW(), 'system', 'system', false),
    (3, '00000003', 'Martín', 'Socio', 'socio@fitzone.com', '+5491100000002', 'SOCIO', null, gen_random_uuid(), NOW(), NOW(), 'system', 'system', false),
    (4, '00000004', 'Laura', 'Externo', 'externo@fitzone.com', '+5491100000003', 'EXTERNO', null, null, NOW(), NOW(), 'system', 'system', false),
    (5, '00000005', 'Pablo', 'Moroso', 'socio.vencido@fitzone.com', '+5491100000004', 'SOCIO', null, gen_random_uuid(), NOW(), NOW(), 'system', 'system', false)
ON CONFLICT (id_usuario) DO NOTHING;

-- 4. Membresías (Activa y Vencida para probar RN-03)
INSERT INTO fz_pag_membresias (id_membresia, id_usuario, id_plan, fecha_inicio, fecha_vencimiento, estado, created_at, updated_at, created_by, updated_by, is_deleted)
VALUES
    (1, 3, 1, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 'ACTIVO', NOW(), NOW(), 'system', 'system', false),
    (2, 5, 1, CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '10 days', 'VENCIDO', NOW(), NOW(), 'system', 'system', false)
ON CONFLICT (id_membresia) DO NOTHING;

-- 5. Canchas (Operativa y Mantenimiento)
INSERT INTO fz_cch_canchas (id_cancha, id_sede, nombre, tipo, precio_base_hora, en_mantenimiento, created_at, updated_at, created_by, updated_by, is_deleted)
VALUES
    (1, 1, 'Cancha Fútbol 5 - Palermo', 'FUTBOL_5', 20000.00, false, NOW(), NOW(), 'system', 'system', false),
    (2, 1, 'Cancha Paddle 1 (Mantenimiento)', 'PADDLE', 15000.00, true, NOW(), NOW(), 'system', 'system', false),
    (3, 2, 'Cancha Tenis - Belgrano', 'TENIS', 25000.00, false, NOW(), NOW(), 'system', 'system', false)
ON CONFLICT (id_cancha) DO NOTHING;

-- 6. Clases Grupales (Disponible y Completa para lista de espera)
INSERT INTO fz_cls_clases_grupales (id_clase, id_sede, nombre_actividad, fecha_hora_inicio, duracion_minutos, cupo_maximo, cupo_disponible, created_at, updated_at, created_by, updated_by, is_deleted)
VALUES
    (1, 1, 'Spinning Pro', (CURRENT_DATE + INTERVAL '1 day 18 hours'), 60, 20, 20, NOW(), NOW(), 'system', 'system', false),
    (2, 1, 'Yoga Integral (Completa)', (CURRENT_DATE + INTERVAL '2 days 10 hours'), 45, 1, 0, NOW(), NOW(), 'system', 'system', false)
ON CONFLICT (id_clase) DO NOTHING;
