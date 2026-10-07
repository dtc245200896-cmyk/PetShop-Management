\set ON_ERROR_STOP on
\getenv app_password APP_DB_PASSWORD

BEGIN;

SELECT 'CREATE ROLE petshop_app LOGIN'
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'petshop_app'
)
\gexec

ALTER ROLE petshop_app
    NOSUPERUSER NOCREATEDB NOCREATEROLE
    NOREPLICATION NOBYPASSRLS
    PASSWORD :'app_password';

SELECT format(
    'GRANT CONNECT ON DATABASE %I TO petshop_app',
    current_database()
)
\gexec

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO petshop_app;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.customers, public.pets,
         public.services, public.appointments
TO petshop_app;

GRANT USAGE, SELECT
ON SEQUENCE public.customers_id_seq, public.pets_id_seq,
            public.services_id_seq, public.appointments_id_seq
TO petshop_app;

COMMIT;
