-- SCRUM-147 / ADR-018: el cliente externo no se guarda como usuario.
-- Su reserva de cancha y su pago quedan sin id_usuario, y su nombre, DNI y email van al comprobante.
--
-- Hibernate con ddl-auto=update agrega las columnas nuevas pero NO quita un NOT NULL existente,
-- así que este script hace falta también en dev (Render) y en cualquier base creada antes del cambio.
-- En prod (ddl-auto=validate) hay que correrlo ANTES de desplegar el backend.
-- Es idempotente: solo altera lo que existe, y se puede correr más de una vez.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'fz_cch_reservas' AND column_name = 'id_usuario') THEN
        ALTER TABLE fz_cch_reservas ALTER COLUMN id_usuario DROP NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'fz_pag_transacciones' AND column_name = 'id_usuario') THEN
        ALTER TABLE fz_pag_transacciones ALTER COLUMN id_usuario DROP NOT NULL;
    END IF;

    IF to_regclass('fz_pag_comprobantes') IS NOT NULL THEN
        ALTER TABLE fz_pag_comprobantes
            ADD COLUMN IF NOT EXISTS cliente_nombre varchar(201),
            ADD COLUMN IF NOT EXISTS cliente_dni    varchar(20),
            ADD COLUMN IF NOT EXISTS cliente_email  varchar(255);
    END IF;

    -- Bases donde Hibernate ya creó la columna con 200: nombre (100) + espacio + apellido (100) no entraba
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'fz_pag_comprobantes' AND column_name = 'cliente_nombre') THEN
        ALTER TABLE fz_pag_comprobantes ALTER COLUMN cliente_nombre TYPE varchar(201);
    END IF;
END $$;

-- Consulta opcional, solo lectura: reservas de invitado anteriores al cambio que siguen sin pagar
-- y ocupan un turno futuro. Liberarlas es una decisión del equipo, no la hace este script.
-- SELECT r.id_reserva_cancha, r.codigo_reserva, r.fecha_hora_inicio
--   FROM fz_cch_reservas r
--   JOIN fz_usr_usuarios u ON u.id_usuario = r.id_usuario AND u.tipo_usuario = 'EXTERNO'
--  WHERE r.fecha_hora_inicio > now()
--    AND NOT EXISTS (SELECT 1 FROM fz_pag_transacciones t
--                     WHERE t.id_reserva_cancha = r.id_reserva_cancha AND t.estado_pago = 'CONFIRMADO');
