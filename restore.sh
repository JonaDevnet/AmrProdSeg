#!/usr/bin/env bash
# ============================================================================
# Restaura la base AmrProdSeg desde un .bak, en UN solo paso.
#
# Uso:   ./restore.sh <archivo.bak> [-y]
# Ej:    ./restore.sh /opt/amr-backups/AmrProdSeg_20260724_030000.bak
#        ./restore.sh /opt/amr-backups/AmrProdSeg_20260724_030000.bak -y   (sin confirmar)
#
# Qué hace: verifica el backup → para amr-api → RESTORE WITH REPLACE →
#           levanta amr-api. ⚠️ REEMPLAZA todos los datos actuales.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

CONT="amr-db"
DB="AmrProdSeg"
BACKUP_DIR="${BACKUP_DIR:-/opt/amr-backups}"

# --- argumentos ---
FORCE=0
BAK=""
for a in "$@"; do
  case "$a" in
    -y|--yes) FORCE=1 ;;
    *)        BAK="$a" ;;
  esac
done

if [ -z "$BAK" ]; then
  echo "Uso: ./restore.sh <archivo.bak> [-y]"
  echo "Backups disponibles en ${BACKUP_DIR}:"
  ls -1t "${BACKUP_DIR}"/*.bak 2>/dev/null | head -10 || echo "  (ninguno)"
  exit 1
fi
[ -f "$BAK" ] || { echo "✖ No existe el archivo: $BAK"; exit 1; }
[ -f .env ]   || { echo "✖ No se encontró .env (con MSSQL_SA_PASSWORD)."; exit 1; }
SA="$(grep '^MSSQL_SA_PASSWORD=' .env | cut -d= -f2-)"
[ -n "$SA" ]  || { echo "✖ MSSQL_SA_PASSWORD vacío en .env."; exit 1; }

if ! docker ps --format '{{.Names}}' | grep -q "^${CONT}$"; then
  echo "✖ El contenedor ${CONT} no está corriendo."
  exit 1
fi

echo "⚠  RESTAURAR la base [${DB}] desde:"
echo "     $BAK"
echo "   Esto REEMPLAZA TODOS los datos actuales por los del backup."
if [ "$FORCE" -ne 1 ]; then
  read -r -p "   Escribí 'RESTAURAR' para confirmar: " ans
  [ "$ans" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }
fi

SQLCMD="/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ${SA} -C -b"
TMP="/var/opt/mssql/backup/_restore.bak"

# Si paramos la API, la volvemos a levantar pase lo que pase (éxito o error).
API_UP=0
restart_api() { if [ "$API_UP" -eq 1 ]; then docker start amr-api >/dev/null 2>&1 || true; fi; }
trap restart_api EXIT

echo "→ Copiando el backup al contenedor..."
docker exec "$CONT" mkdir -p /var/opt/mssql/backup
docker cp "$BAK" "${CONT}:${TMP}"

echo "→ Verificando integridad del backup..."
docker exec "$CONT" $SQLCMD -Q "RESTORE VERIFYONLY FROM DISK = N'${TMP}';"

if docker ps --format '{{.Names}}' | grep -q '^amr-api$'; then
  echo "→ Parando amr-api (libera conexiones a la base)..."
  docker stop amr-api >/dev/null
  API_UP=1
fi

echo "→ Restaurando [${DB}]..."
docker exec "$CONT" $SQLCMD -Q "
  IF DB_ID('${DB}') IS NOT NULL ALTER DATABASE [${DB}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
  RESTORE DATABASE [${DB}] FROM DISK = N'${TMP}' WITH REPLACE, RECOVERY;
  ALTER DATABASE [${DB}] SET MULTI_USER;"

docker exec "$CONT" rm -f "${TMP}"

echo "✔ Restauración completa desde $(basename "$BAK")."
# El trap EXIT levanta amr-api.
