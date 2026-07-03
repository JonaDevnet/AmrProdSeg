#!/usr/bin/env bash
# Actualiza el sistema en el VPS: trae los últimos cambios y reconstruye los contenedores.
set -e
cd "$(dirname "$0")"

echo "→ Trayendo cambios de GitHub..."
git pull

echo "→ Reconstruyendo y levantando contenedores..."
docker compose up -d --build

echo "→ Limpiando imágenes viejas..."
docker image prune -f

echo "✔ Actualizado. Si tocaste la base (tablas/SP), acordate de correr el schema:"
echo "  docker exec -i amr-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"\$MSSQL_SA_PASSWORD\" -C < AmrProdSeg_Schema.sql"
