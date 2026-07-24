#!/usr/bin/env bash
# ============================================================================
# Backup de la base AmrProdSeg — INDEPENDIENTE de actualizar.sh.
# Hace un BACKUP DATABASE, lo VERIFICA, lo copia al HOST (fuera del volumen
# Docker, así sobrevive si el volumen se pierde) y rota los últimos N.
#
# Uso manual:   ./backup.sh
# Por cron (diario 03:00):
#   0 3 * * *  /ruta/al/repo/backup.sh >> /var/log/amr-backup.log 2>&1
#
# Config por variables de entorno (opcional):
#   BACKUP_DIR  destino en el host (default /opt/amr-backups)
#   KEEP        cuántos backups conservar    (default 14)
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

DB="AmrProdSeg"
CONT="amr-db"
BACKUP_DIR="${BACKUP_DIR:-/opt/amr-backups}"   # fuera del repo y del volumen Docker
KEEP="${KEEP:-14}"

if [ ! -f .env ]; then
  echo "✖ No se encontró .env (con MSSQL_SA_PASSWORD). Abortando."
  exit 1
fi
SA="$(grep '^MSSQL_SA_PASSWORD=' .env | cut -d= -f2-)"
if [ -z "$SA" ]; then
  echo "✖ MSSQL_SA_PASSWORD vacío en .env. Abortando."
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${CONT}$"; then
  echo "✖ El contenedor ${CONT} no está corriendo. Abortando."
  exit 1
fi

TS="$(date +%Y%m%d_%H%M%S)"
FILE="${DB}_${TS}.bak"
TMP="/var/opt/mssql/backup/${FILE}"   # ruta temporal DENTRO del contenedor
SQLCMD="/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ${SA} -C -b"

mkdir -p "$BACKUP_DIR"

echo "→ Backup de [${DB}]..."
docker exec "$CONT" mkdir -p /var/opt/mssql/backup
docker exec "$CONT" $SQLCMD -Q \
  "BACKUP DATABASE [${DB}] TO DISK = N'${TMP}' WITH INIT, CHECKSUM, NAME = N'${DB}-full';"

echo "→ Verificando integridad del backup..."
docker exec "$CONT" $SQLCMD -Q \
  "RESTORE VERIFYONLY FROM DISK = N'${TMP}';"

echo "→ Copiando al host: ${BACKUP_DIR}/${FILE}"
docker cp "${CONT}:${TMP}" "${BACKUP_DIR}/${FILE}"
docker exec "$CONT" rm -f "${TMP}"   # se borra la copia interna (no infla el volumen)

echo "→ Rotando (se conservan los últimos ${KEEP})..."
# shellcheck disable=SC2012
ls -1t "${BACKUP_DIR}/${DB}_"*.bak 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

# ── Copia OFF-SITE (opcional pero MUY recomendada) ──────────────────────────
# Si el VPS se pierde entero, los backups locales se pierden con él. Definí UNA
# de estas variables para mandar la copia afuera:
#   RCLONE_REMOTE  ej. "gdrive:amr-backups"  (necesita: rclone config previo)
#   RSYNC_DEST     ej. "user@otro-host:/backups/amr"  (necesita: ssh por clave)
if [ -n "${RCLONE_REMOTE:-}" ]; then
  echo "→ Off-site (rclone) → ${RCLONE_REMOTE}"
  rclone copy "${BACKUP_DIR}/${FILE}" "${RCLONE_REMOTE}"
  echo "  ✔ Subido off-site."
elif [ -n "${RSYNC_DEST:-}" ]; then
  echo "→ Off-site (rsync) → ${RSYNC_DEST}"
  rsync -az "${BACKUP_DIR}/${FILE}" "${RSYNC_DEST}/"
  echo "  ✔ Copiado off-site."
else
  echo "  ⚠ Sin copia off-site (definí RCLONE_REMOTE o RSYNC_DEST para activarla)."
fi

echo "✔ Backup OK → ${BACKUP_DIR}/${FILE}"
ls -lh "${BACKUP_DIR}/${FILE}"
