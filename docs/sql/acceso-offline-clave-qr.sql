-- Pase QR firmado por el dispositivo del socio (RNF-01, acceso offline).
-- Agrega la columna con la clave pública ECDSA P-256 (SPKI en base64) de cada socio.
--
-- En local y dev la crea Hibernate (ddl-auto=update). En prod (ddl-auto=validate) hay que
-- correr este script ANTES de desplegar el backend, o el arranque falla al validar el esquema.
-- Es idempotente: se puede correr más de una vez.

ALTER TABLE fz_usr_usuarios
    ADD COLUMN IF NOT EXISTS qr_clave_publica varchar(200);
