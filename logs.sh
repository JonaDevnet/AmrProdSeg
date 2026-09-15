#!/usr/bin/env bash
# Visor de logs para AMR — revisá errores, solicitudes fallidas e IPs desde el VPS.
cd "$(dirname "$0")"

LOGS_DIR="$PWD/logs"
TRAEFIK="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E '^traefik[-_a-zA-Z0-9]*$' | head -1)"
[ -z "$TRAEFIK" ] && TRAEFIK="traefik-traefik-1"

# Colores
C_CYAN='\033[1;36m'; C_GREEN='\033[1;32m'; C_YELLOW='\033[1;33m'; C_RED='\033[1;31m'; C_DIM='\033[2m'; C_RESET='\033[0m'
nota() { echo -e "${C_DIM}$*${C_RESET}"; }
ok()   { echo -e "${C_GREEN}$*${C_RESET}"; }
err()  { echo -e "${C_RED}$*${C_RESET}"; }

# ¿Traefik tiene los access logs activos? (--accesslogs=true en el CMD)
access_logs_activos() {
    docker inspect "$TRAEFIK" --format '{{json .Config.Cmd}}' 2>/dev/null | grep -q 'accesslogs'
}

aviso_access() {
    err "  ⚠ Los access logs de Traefik no están activos."
    err "  Para activarlos, en el VPS editá /docker/traefik/docker-compose.yml y agregá:"
    echo "      - --accesslogs=true"
    echo "    + bloque 'logging' (json-file, max-size 10m / max-file 5), y luego:"
    echo "      cd /docker/traefik && docker compose up -d"
}

submenu_ips() {
    while true; do
        echo ""
        echo "  ── TODAS las IPs que ingresaron (Traefik) ──"
        echo "  a) IPs únicas — últimas 24 h"
        echo "  b) Top 10 IPs por cantidad de accesos (24 h)"
        echo "  c) Accesos de una IP puntual (últimas 48 h)"
        echo "  x) Volver al menú principal"
        read -r -p "  Opción: " sub
        case "$sub" in
            a)
                if access_logs_activos; then
                    echo ""
                    docker logs --since 24h "$TRAEFIK" 2>&1 | grep -oE '^[0-9a-fA-F:.]+' | sort -u
                else
                    aviso_access
                fi
                ;;
            b)
                if access_logs_activos; then
                    echo ""
                    docker logs --since 24h "$TRAEFIK" 2>&1 | grep -oE '^[0-9a-fA-F:.]+' | sort | uniq -c | sort -rn | head -10
                else
                    aviso_access
                fi
                ;;
            c)
                if access_logs_activos; then
                    read -r -p "  Ingresá la IP: " ip
                    [ -n "$ip" ] && docker logs --since 48h "$TRAEFIK" 2>&1 | grep "^$ip " | tail -n 50
                else
                    aviso_access
                fi
                ;;
            x) return ;;
            *) err "  Opción inválida." ;;
        esac
    done
}

while true; do
    echo ""
    echo -e "${C_CYAN}  AMR — Visor de logs${C_RESET}"
    echo "  ─────────────────────────────────────────────"
    echo "   1) Errores en vivo          tail -f logs/errors-*.log"
    echo "   2) Errores de hoy           tail 200 logs/errors-\$(date +%F).log"
    echo "   3) Todo el API en vivo      tail -f logs/amrprodseg-*.log"
    echo "   4) Solicitudes fallidas     Request 4xx/5xx (con IP y usuario)"
    echo "   5) Errores del frontend     [FrontendError]"
    echo "   6) IPs bloqueadas           GeoBlock"
    echo "   7) Búsqueda en logs         (palabra o fecha)"
    echo "   8) TODAS las IPs que ingresaron  (access logs de Traefik)"
    echo "   9) IPs con error            (del errors-*.log del API)"
    echo "  10) API desde Docker         docker compose logs -f api"
    echo "   0) Salir"
    read -r -p "  Opción: " op
    case "$op" in
        1)
            if [ -d "$LOGS_DIR" ]; then nota "  (Ctrl+C para salir)"; tail -f "$LOGS_DIR"/errors-*.log; else err "  No existe logs/. Desplegá primero (./actualizar.sh)."; fi
            ;;
        2)
            if [ -d "$LOGS_DIR" ]; then tail -n 200 "$LOGS_DIR"/errors-$(date +%F).log 2>/dev/null || err "  Sin errores hoy."; else err "  No existe logs/."; fi
            ;;
        3)
            if [ -d "$LOGS_DIR" ]; then nota "  (Ctrl+C para salir)"; tail -f "$LOGS_DIR"/amrprodseg-*.log; else err "  No existe logs/."; fi
            ;;
        4)
            if [ -d "$LOGS_DIR" ]; then grep -hE "Request [45][0-9]{2}" "$LOGS_DIR"/errors-*.log 2>/dev/null | tail -n 100; else err "  No existe logs/."; fi
            ;;
        5)
            if [ -d "$LOGS_DIR" ]; then grep -h "FrontendError" "$LOGS_DIR"/errors-*.log 2>/dev/null | tail -n 100; else err "  No existe logs/."; fi
            ;;
        6)
            if [ -d "$LOGS_DIR" ]; then grep -h "GeoBlock" "$LOGS_DIR"/*.log 2>/dev/null | tail -n 100; else err "  No existe logs/."; fi
            ;;
        7)
            if [ -d "$LOGS_DIR" ]; then read -r -p "  Palabra o fecha: " q; [ -n "$q" ] && grep -hiE "$q" "$LOGS_DIR"/*.log 2>/dev/null | tail -n 150; else err "  No existe logs/."; fi
            ;;
        8) submenu_ips ;;
        9)
            if [ -d "$LOGS_DIR" ]; then grep -hoE 'IP [0-9a-fA-F:.]+' "$LOGS_DIR"/errors-*.log 2>/dev/null | awk '{print $2}' | sort | uniq -c | sort -rn; else err "  No existe logs/."; fi
            ;;
        10) nota "  (Ctrl+C para salir)"; docker compose logs -f api ;;
        0) ok "  Chau."; exit 0 ;;
        *) err "  Opción inválida." ;;
    esac
done