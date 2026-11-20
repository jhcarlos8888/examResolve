#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE_DIR="${BRAVE_AGENT_PROFILE:-$ROOT_DIR/runtime/brave-profile}"
OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR:-$ROOT_DIR/runtime/playwright-output}"
MCP_CONFIG="${PW_MCP_CONFIG:-$ROOT_DIR/scripts/playwright-mcp.config.json}"
MODE="${PW_BROWSER_MODE:-background}"
mkdir -p "$PROFILE_DIR" "$OUTPUT_DIR"

# background: sin ventana ni cambios de foco. visible: requiere pantalla X.
case "$MODE" in
  background|headless) MODE=background ;;
  visible|headed) MODE=visible ;;
  *) echo "[ERROR] PW_BROWSER_MODE debe ser background o visible (recibido: $MODE)" >&2; exit 2 ;;
esac

if [[ "$MODE" == visible ]]; then
  if [[ -z "${XAUTHORITY:-}" ]]; then
    auth="$(ls -t "${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"/.mutter-Xwaylandauth.* 2>/dev/null | head -1 || true)"
    if [[ -z "$auth" && -f "$HOME/.Xauthority" ]]; then auth="$HOME/.Xauthority"; fi
    if [[ -n "$auth" ]]; then export XAUTHORITY="$auth"; fi
  fi
  export DISPLAY="${DISPLAY:-${BRAVE_AGENT_DISPLAY:-:0}}"
  if ! command -v xdpyinfo >/dev/null || ! xdpyinfo >/dev/null 2>&1; then
    echo "[ERROR] No hay DISPLAY accesible. Usa PW_BROWSER_MODE=background o inicia una sesión gráfica." >&2
    exit 2
  fi
  echo "[examResolve] Brave visible (podría tomar el foco)." >&2
else
  echo "[examResolve] Brave oculto/headless: no interrumpe otras ventanas." >&2
fi

find_brave() {
  local candidate
  for candidate in "${BRAVE_EXECUTABLE:-}" \
    "$(command -v brave-browser-stable 2>/dev/null || true)" \
    "$(command -v brave-browser 2>/dev/null || true)" \
    /usr/bin/brave-browser-stable /usr/bin/brave-browser /opt/brave.com/brave/brave-browser
  do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return
    fi
  done
  return 1
}
BRAVE_BIN="$(find_brave)" || { echo "[ERROR] Brave no encontrado (BRAVE_EXECUTABLE=...)." >&2; exit 1; }
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || echo 0)"
if (( NODE_MAJOR < 20 )); then echo "[ERROR] Se requiere Node.js 20+." >&2; exit 1; fi

CAPS="${PW_CAPS:-vision,testing,network,storage,devtools,pdf,config}"
config_args=()
if [[ -f "$MCP_CONFIG" ]]; then config_args=(--config "$MCP_CONFIG"); fi
mode_args=()
if [[ "$MODE" == background ]]; then mode_args=(--headless); fi

# El perfil es independiente del navegador personal. La configuracion MCP
# expone un puerto CDP aleatorio SOLO a 127.0.0.1 para el visor de solo lectura.
exec npx -y "@playwright/mcp@0.0.83" \
  --executable-path "$BRAVE_BIN" \
  --user-data-dir "$PROFILE_DIR" \
  --output-dir "$OUTPUT_DIR" \
  --caps "$CAPS" \
  --snapshot-boxes \
  "${mode_args[@]}" \
  "${config_args[@]}"
