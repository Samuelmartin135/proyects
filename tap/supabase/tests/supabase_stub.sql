-- =============================================================================
-- Imitación mínima de Supabase para probar las migraciones en un Postgres local.
-- (En Supabase real todo esto ya existe; este archivo NO se aplica allá.)
-- =============================================================================

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (
  id    uuid primary key,
  email text
);

-- Igual que en Supabase: el id del usuario sale del JWT de la petición.
create function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

-- Como en Supabase: por defecto todos los roles reciben todo en las tablas nuevas
-- de public. Las migraciones de TAP recortan esos permisos.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
