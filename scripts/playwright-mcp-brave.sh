#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE_DIR="${BRAVE_AGENT_PROFILE:-$ROOT_DIR/runtime/brave-profile}"
OUTPUT_DIR="${PLAYWRIGHT_OUTPUT_DIR:-$ROOT_DIR/runtime/playwright-output}"
mkdir -p "$PROFILE_DIR" "$OUTPUT_DIR"

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

exec npx -y "@playwright/mcp@0.0.83" \
  --executable-path "$BRAVE_BIN" \
  --user-data-dir "$PROFILE_DIR" \
  --output-dir "$OUTPUT_DIR" \
  --caps "$CAPS" \
  --snapshot-boxes
