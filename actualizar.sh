#!/usr/bin/env bash
# Actualiza el sistema completo en el VPS: código (back + front) y base de datos.
set -e
cd "$(dirname "$0")"

echo "→ Trayendo cambios de GitHub..."
git pull

echo "→ Actualizando la base de datos (schema idempotente)..."
SA=$(grep '^MSSQL_SA_PASSWORD=' .env | cut -d= -f2-)
if docker ps --format '{{.Names}}' | grep -q '^amr-db$'; then
    docker exec -i amr-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA" -C < AmrProdSeg_Schema.sql
    echo "  ✔ Schema aplicado."
else
    echo "  ⚠ El contenedor amr-db no está corriendo; se salta el schema (corrélo a mano después)."
fi

echo "→ Reconstruyendo y levantando contenedores..."
docker compose up -d --build

echo "→ Limpiando imágenes viejas..."
docker image prune -f

echo "✔ Actualizado: base de datos + backend + frontend."
