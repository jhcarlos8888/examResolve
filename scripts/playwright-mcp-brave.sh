#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE_DIR="${BRAVE_AGENT_PROFILE:-$ROOT_DIR/runtime/brave-profile}"
OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR:-$ROOT_DIR/runtime/playwright-output}"
mkdir -p "$PROFILE_DIR" "$OUTPUT_DIR"

# V92 — SIN DISPLAY NO HAY VENTANA.
# Si este proceso no hereda DISPLAY (p. ej. opencode serve lanzado desde un
# servicio, una sesión sin X o un terminal sin entorno gráfico), Playwright
# detecta que no hay XServer y **cae automáticamente a headless**: el
# navegador corre, pero el usuario NO ve ninguna ventana y por tanto no puede
# iniciar sesión ni seguir la simulación. El MCP no expone --headed, así que
# la única vía es garantizar el display aquí, antes de arrancar.
#
# DISPLAY también lo declara opencode.json (mcp.servers.playwright.environment);
# este bloque es la red de seguridad para cuando se arranca el script fuera de
# opencode o el servicio no trae el entorno gráfico.
#
# OJO: forzar headed SIN autorización X rompe el MCP de forma total (Playwright
# aborta con "Authorization required"), peor que el headless. Por eso:
#   1) se localiza la cookie XAUTHORITY (cambia en cada sesión de escritorio),
#   2) se VALIDA el display con xdpyinfo,
#   3) si no es alcanzable, se retira y se degrada a headless (funcional).
# 1) XAUTHORITY — se resuelve SIEMPRE que falte, independientemente de DISPLAY
#    (DISPLAY puede venir del config, XAUTHORITY no: opencode no lo tiene).
if [[ -z "${XAUTHORITY:-}" ]]; then
  _xauth="$(ls -t "${XDG_RUNTIME_DIR:-/run/user/1000}"/.mutter-Xwaylandauth.* 2>/dev/null | head -1 || true)"
  if [[ -z "$_xauth" && -f "${HOME}/.Xauthority" ]]; then
    _xauth="${HOME}/.Xauthority"
  fi
  if [[ -n "$_xauth" ]]; then
    export XAUTHORITY="$_xauth"
  fi
  unset _xauth
fi

# 2) DISPLAY — si aún falta, proponer :0 (opencode.json ya lo declara).
if [[ -z "${DISPLAY:-}" ]]; then
  export DISPLAY="${BRAVE_AGENT_DISPLAY:-:0}"
fi

# 3) Validación — headed sin X alcanzable deja el MCP INUTILIZABLE (Playwright
#    aborta con "Authorization required"), peor que headless. Si xdpyinfo no
#    conecta, se retira el display y se degrada a headless funcional.
if [[ -n "${DISPLAY:-}" ]] && command -v xdpyinfo >/dev/null 2>&1; then
  if xdpyinfo >/dev/null 2>&1; then
    echo "[playwright-mcp-brave] DISPLAY=$DISPLAY XAUTHORITY=${XAUTHORITY:-ninguna} (headed)" >&2
  else
    unset DISPLAY XAUTHORITY
    echo "[playwright-mcp-brave] display no alcanzable -> headless (degradado)" >&2
  fi
fi
if [[ -z "${WAYLAND_DISPLAY:-}" && -n "${BRAVE_AGENT_WAYLAND:-}" ]]; then
  export WAYLAND_DISPLAY="$BRAVE_AGENT_WAYLAND"
fi

find_brave() {
  local candidates=(
    "${BRAVE_EXECUTABLE:-}"
    "$(command -v brave-browser-stable 2>/dev/null || true)"
    "$(command -v brave-browser 2>/dev/null || true)"
    "/usr/bin/brave-browser-stable"
    "/usr/bin/brave-browser"
    "/opt/brave.com/brave/brave-browser"
  )

  local p
  for p in "${candidates[@]}"; do
    if [[ -n "$p" && -x "$p" ]]; then
      printf '%s\n' "$p"
      return 0
    fi
  done

  return 1
}

BRAVE_BIN="$(find_brave || true)"
if [[ -z "$BRAVE_BIN" ]]; then
  cat >&2 <<MSG
[ERROR] No encontré Brave.

Busca el ejecutable con:
  command -v brave-browser-stable
  command -v brave-browser

O define:
  export BRAVE_EXECUTABLE=/ruta/al/brave-browser
MSG
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if (( NODE_MAJOR < 20 )); then
  echo "[ERROR] Este proyecto espera Node.js 20+; detectado: $(node -v 2>/dev/null || echo 'no instalado')" >&2
  exit 1
fi

# Playwright MCP 0.0.83 is pinned for reproducibility.
# All capabilities enabled:
#   vision    -> coordinate-based mouse tools (fallback when a11y tree is useless)
#   testing   -> verify values/visibility of selected answers
#   network   -> inspect requests (diagnose blocked/failed quiz calls)
#   storage   -> cookies/localStorage (login state between runs)
#   devtools  -> tracing/video/highlight (debugging stubborn pages)
#   pdf       -> export page as PDF (read-only capture of question sets)
#   config    -> inspect resolved MCP configuration
# Override if token cost becomes an issue, e.g.:
#   PW_CAPS=vision,testing ./scripts/run.sh
# The browser still starts headed so the user can watch the simulation.
CAPS="${PW_CAPS:-vision,testing,network,storage,devtools,pdf,config}"

# V93 — ventana chica y a un costado (no maximizada): la ventana del agente
# NUNCA debe tapar la pantalla del usuario. Sin esto, Playwright arranca
# maximizado (2560x1392+0+0) y cada interacción la sube al frente.
# El config (scripts/playwright-mcp.config.json) aporta
#   browser.launchOptions.args = --window-size=1120,700 --window-position=1120,0
#
# OJO: Chromium RESTAURA el estado de la ventana guardado en el perfil
# (Default/Preferences -> browser.window_placement, p. ej. "maximized": true)
# y eso anula --window-size/--window-position. Por eso, antes de arrancar se
# limpia esa clave SOLO si nadie tiene abierto el perfil (si otro proceso del
# agente lo usa, no se toca para no corromper su sesión).
if [[ -f "$PROFILE_DIR/Default/Preferences" ]] && ! pgrep -f "user-data-dir=$PROFILE_DIR" >/dev/null 2>&1; then
  python3 - "$PROFILE_DIR/Default/Preferences" <<'PYEOF' || true
import json, sys
p = sys.argv[1]
try:
    d = json.load(open(p, encoding="utf8"))
except Exception:
    sys.exit(0)
b = d.get("browser") or {}
if "window_placement" in b:
    b.pop("window_placement", None)
    json.dump(d, open(p, "w", encoding="utf8"), ensure_ascii=False)
    print("[playwright-mcp-brave] window_placement limpiado (arranca sin maximizar)", file=sys.stderr)
PYEOF
fi
MCP_CONFIG="${PW_MCP_CONFIG:-$ROOT_DIR/scripts/playwright-mcp.config.json}"
CONFIG_ARGS=()
if [[ -f "$MCP_CONFIG" ]]; then
  CONFIG_ARGS=(--config "$MCP_CONFIG")
else
  echo "[playwright-mcp-brave] sin $MCP_CONFIG -> ventana por defecto (maximizada)" >&2
fi

exec npx -y "@playwright/mcp@0.0.83" \
  --executable-path "$BRAVE_BIN" \
  --user-data-dir "$PROFILE_DIR" \
  --output-dir "$OUTPUT_DIR" \
  --caps "$CAPS" \
  --snapshot-boxes \
  "${CONFIG_ARGS[@]}"
