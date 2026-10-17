#!/usr/bin/env bash
# Prueba las migraciones de TAP en un Postgres local temporal (sin Docker ni Supabase).
#
#   bash supabase/tests/run-local.sh
#
# Requiere Postgres 15+ instalado (initdb, pg_ctl, psql). Si se corre como root,
# usa el usuario del sistema "postgres", porque Postgres no arranca como root.
set -euo pipefail

PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS="$DIR/../migrations"

if [[ "$(id -u)" == "0" ]]; then
  # Copia los SQL a una carpeta temporal que el usuario postgres pueda leer.
  WORK="$(mktemp -d)"
  mkdir -p "$WORK/tests" "$WORK/migrations"
  cp "$DIR"/*.sql "$DIR/run-local.sh" "$WORK/tests/"
  cp "$MIGRATIONS"/*.sql "$WORK/migrations/"
  chown -R postgres "$WORK"
  trap 'rm -rf "$WORK"' EXIT
  runuser -u postgres -- env PG_BIN="$PG_BIN" bash "$WORK/tests/run-local.sh"
  exit $?
fi

TMP="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
cleanup() {
  "$PG_BIN/pg_ctl" -D "$TMP/data" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

"$PG_BIN/initdb" -D "$TMP/data" -U postgres --auth=trust >/dev/null
"$PG_BIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" -w start >/dev/null

PSQL=("$PG_BIN/psql" -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)

echo "→ Imitación de Supabase"
"${PSQL[@]}" -f "$DIR/supabase_stub.sql"

for f in "$MIGRATIONS"/*.sql; do
  echo "→ Migración $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

echo "→ Pruebas de seguridad"
"${PSQL[@]}" -f "$DIR/rls_test.sql" 2>&1 >/dev/null | sed "s/^psql:[^:]*:[0-9]*: NOTICE:  //"
