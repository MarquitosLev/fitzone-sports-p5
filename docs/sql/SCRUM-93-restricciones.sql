-- =====================================================================================
-- FitZone Sports — SCRUM-93: claves foráneas y CHECK en bases ya creadas
-- =====================================================================================
-- Para qué sirve:
--   Hibernate (ddl-auto=update) crea las FK y los CHECK de las entidades solo al crear una
--   tabla nueva. En una base que ya existía:
--     * no agrega los CHECK nuevos (ck_gym_accesos_una_reserva, ck_pag_transacciones_origen);
--     * no actualiza fz_pag_transacciones_concepto_check, que quedó con los valores viejos del
--       enum TipoOrigenTransaccion (solo RESERVA_EXTERNO y RESERVA_SOCIO) y rechaza MEMBRESIA y
--       RESERVA_CANCHA;
--     * en prod (ddl-auto=validate) no crea nada.
--   Este script deja la base igual que una creada de cero por la app.
--
-- Cuándo correrlo: una sola vez por base (local de docker, Supabase dev, Supabase prod), con la
-- app ya levantada al menos una vez para que existan las tablas. Es idempotente: se puede volver
-- a correr sin romper nada.
--
-- Cómo correrlo:
--   Local (docker compose):
--     docker exec -i fitzone_postgres_local psql -U fitzone_user -d fitzone_db -v ON_ERROR_STOP=1 < docs/sql/SCRUM-93-restricciones.sql
--   Supabase: pegarlo entero en el SQL Editor del proyecto y ejecutarlo.
--
-- Si falla: el bloque 1 corta con un mensaje cuando hay datos que no cumplen las restricciones
-- (ids que apuntan a registros que no existen, o pagos con el destino mal cargado). Corregir esas
-- filas y volver a correrlo. Todo va en una transacción, así que un error no deja nada a medias.
-- =====================================================================================

BEGIN;

-- -------------------------------------------------------------------------------------
-- 1. Datos que impedirían crear las restricciones
-- -------------------------------------------------------------------------------------
DO $$
DECLARE
    problemas TEXT := '';
    n BIGINT;
BEGIN
    SELECT count(*) INTO n FROM fz_usr_usuarios u
     WHERE u.id_sede IS NOT NULL AND NOT EXISTS (SELECT 1 FROM fz_sedes s WHERE s.id_sede = u.id_sede);
    IF n > 0 THEN problemas := problemas || format(E'\n  - %s usuarios con id_sede inexistente', n); END IF;

    SELECT count(*) INTO n FROM fz_gym_accesos
     WHERE id_reserva_clase IS NOT NULL AND id_reserva_cancha IS NOT NULL;
    IF n > 0 THEN problemas := problemas || format(E'\n  - %s accesos con reserva de clase y de cancha a la vez', n); END IF;

    SELECT count(*) INTO n FROM fz_pag_transacciones
     WHERE concepto NOT IN ('RESERVA_EXTERNO', 'RESERVA_SOCIO', 'MEMBRESIA', 'RESERVA_CANCHA');
    IF n > 0 THEN problemas := problemas || format(E'\n  - %s transacciones con un concepto desconocido', n); END IF;

    SELECT count(*) INTO n FROM fz_pag_transacciones
     WHERE NOT ((concepto = 'MEMBRESIA' AND id_membresia IS NOT NULL AND id_reserva_cancha IS NULL)
             OR (concepto = 'RESERVA_CANCHA' AND id_reserva_cancha IS NOT NULL AND id_membresia IS NULL)
             OR (concepto IN ('RESERVA_EXTERNO', 'RESERVA_SOCIO') AND id_membresia IS NULL));
    IF n > 0 THEN problemas := problemas || format(E'\n  - %s transacciones cuyo destino no coincide con el concepto', n); END IF;

    IF problemas <> '' THEN
        RAISE EXCEPTION 'SCRUM-93: hay datos que no cumplen las restricciones:%', problemas;
    END IF;
END $$;

-- -------------------------------------------------------------------------------------
-- 2. Claves foráneas
--    Si la columna ya tiene una FK (por ejemplo con el nombre aleatorio que le puso Hibernate)
--    solo se renombra; si no tiene, se crea.
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.fz_asegurar_fk(tabla TEXT, columna TEXT, tabla_ref TEXT, columna_ref TEXT, nombre TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    actual TEXT;
BEGIN
    SELECT c.conname INTO actual
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
     WHERE c.contype = 'f'
       AND c.conrelid = tabla::regclass
       AND c.confrelid = tabla_ref::regclass
       AND array_length(c.conkey, 1) = 1
       AND a.attname = columna
     LIMIT 1;

    IF actual IS NULL THEN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I (%I)',
                       tabla, nombre, columna, tabla_ref, columna_ref);
        RAISE NOTICE 'FK creada: %', nombre;
    ELSIF actual <> nombre THEN
        EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I', tabla, actual, nombre);
        RAISE NOTICE 'FK renombrada: % -> %', actual, nombre;
    END IF;
END $$;

SELECT pg_temp.fz_asegurar_fk('fz_usr_usuarios',        'id_sede',           'fz_sedes',               'id_sede',           'fk_usr_usuarios_sedes');
SELECT pg_temp.fz_asegurar_fk('fz_pag_membresias',      'id_usuario',        'fz_usr_usuarios',        'id_usuario',        'fk_pag_membresias_usuarios');
SELECT pg_temp.fz_asegurar_fk('fz_pag_membresias',      'id_plan',           'fz_pag_planes',          'id_plan',           'fk_pag_membresias_planes');
SELECT pg_temp.fz_asegurar_fk('fz_cch_canchas',         'id_sede',           'fz_sedes',               'id_sede',           'fk_cch_canchas_sedes');
SELECT pg_temp.fz_asegurar_fk('fz_cch_reservas',        'id_cancha',         'fz_cch_canchas',         'id_cancha',         'fk_cch_reservas_canchas');
SELECT pg_temp.fz_asegurar_fk('fz_cch_reservas',        'id_usuario',        'fz_usr_usuarios',        'id_usuario',        'fk_cch_reservas_usuarios');
SELECT pg_temp.fz_asegurar_fk('fz_cls_clases_grupales', 'id_sede',           'fz_sedes',               'id_sede',           'fk_cls_clases_sedes');
SELECT pg_temp.fz_asegurar_fk('fz_cls_reservas',        'id_clase',          'fz_cls_clases_grupales', 'id_clase',          'fk_cls_reservas_clases');
SELECT pg_temp.fz_asegurar_fk('fz_cls_reservas',        'id_usuario',        'fz_usr_usuarios',        'id_usuario',        'fk_cls_reservas_usuarios');
SELECT pg_temp.fz_asegurar_fk('fz_cls_lista_espera',    'id_clase',          'fz_cls_clases_grupales', 'id_clase',          'fk_cls_lista_espera_clases');
SELECT pg_temp.fz_asegurar_fk('fz_cls_lista_espera',    'id_usuario',        'fz_usr_usuarios',        'id_usuario',        'fk_cls_lista_espera_usuarios');
SELECT pg_temp.fz_asegurar_fk('fz_gym_accesos',         'id_usuario',        'fz_usr_usuarios',        'id_usuario',        'fk_gym_accesos_usuarios');
SELECT pg_temp.fz_asegurar_fk('fz_gym_accesos',         'id_sede',           'fz_sedes',               'id_sede',           'fk_gym_accesos_sedes');
SELECT pg_temp.fz_asegurar_fk('fz_gym_accesos',         'id_reserva_clase',  'fz_cls_reservas',        'id_reserva_clase',  'fk_gym_accesos_reservas_clase');
SELECT pg_temp.fz_asegurar_fk('fz_gym_accesos',         'id_reserva_cancha', 'fz_cch_reservas',        'id_reserva_cancha', 'fk_gym_accesos_reservas_cancha');
SELECT pg_temp.fz_asegurar_fk('fz_pag_transacciones',   'id_usuario',        'fz_usr_usuarios',        'id_usuario',        'fk_pag_transacciones_usuarios');
SELECT pg_temp.fz_asegurar_fk('fz_pag_transacciones',   'id_sede',           'fz_sedes',               'id_sede',           'fk_pag_transacciones_sedes');
SELECT pg_temp.fz_asegurar_fk('fz_pag_transacciones',   'id_membresia',      'fz_pag_membresias',      'id_membresia',      'fk_pag_transacciones_membresias');
SELECT pg_temp.fz_asegurar_fk('fz_pag_transacciones',   'id_reserva_cancha', 'fz_cch_reservas',        'id_reserva_cancha', 'fk_pag_transacciones_reservas_cancha');
SELECT pg_temp.fz_asegurar_fk('fz_pag_comprobantes',    'id_transaccion',    'fz_pag_transacciones',   'id_transaccion',    'fk_pag_comprobantes_transacciones');

-- -------------------------------------------------------------------------------------
-- 3. CHECK
-- -------------------------------------------------------------------------------------
-- 3.1 Valores de concepto: los 4 de TipoOrigenTransaccion (la versión vieja solo tenía 2)
ALTER TABLE fz_pag_transacciones DROP CONSTRAINT IF EXISTS fz_pag_transacciones_concepto_check;
ALTER TABLE fz_pag_transacciones ADD CONSTRAINT fz_pag_transacciones_concepto_check
    CHECK (concepto IN ('RESERVA_EXTERNO', 'RESERVA_SOCIO', 'MEMBRESIA', 'RESERVA_CANCHA'));

-- 3.2 Un acceso se asocia como mucho a una reserva (clase o cancha)
ALTER TABLE fz_gym_accesos DROP CONSTRAINT IF EXISTS ck_gym_accesos_una_reserva;
ALTER TABLE fz_gym_accesos ADD CONSTRAINT ck_gym_accesos_una_reserva
    CHECK (id_reserva_clase IS NULL OR id_reserva_cancha IS NULL);

-- 3.3 El concepto define a qué se imputa el pago (mismo texto que @Check en Transaccion)
ALTER TABLE fz_pag_transacciones DROP CONSTRAINT IF EXISTS ck_pag_transacciones_origen;
ALTER TABLE fz_pag_transacciones ADD CONSTRAINT ck_pag_transacciones_origen
    CHECK ((concepto = 'MEMBRESIA' AND id_membresia IS NOT NULL AND id_reserva_cancha IS NULL)
        OR (concepto = 'RESERVA_CANCHA' AND id_reserva_cancha IS NOT NULL AND id_membresia IS NULL)
        OR (concepto IN ('RESERVA_EXTERNO', 'RESERVA_SOCIO') AND id_membresia IS NULL));

COMMIT;

-- Verificación (opcional): lista las FK y CHECK que quedaron
-- SELECT conrelid::regclass AS tabla, conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--  WHERE connamespace = 'public'::regnamespace AND contype IN ('f', 'c')
--  ORDER BY 1, 2;
