#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
usage() {
  cat <<'MSG'
Uso:
  ./scripts/resolve.sh https://URL [--semi|--auto] [--background|--visible]
  ./scripts/resolve.sh --current [--semi|--auto] [--background|--visible]
Modo de navegador por defecto: --background (sin ventanas ni cambios de foco).
Para observarlo en cualquier momento: npm run watch (abre la URL local que imprime).
Para hacer login manual: lanza una sesión nueva con --visible, luego vuelve a --background.
MSG
}
URL=""
TARGET="auto"
MODE=""
FORCE=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --current) TARGET=current; shift ;;
    --semi) MODE=--semi; shift ;;
    --auto) MODE=--auto; shift ;;
    --visible) export PW_BROWSER_MODE=visible; shift ;;
    --background) export PW_BROWSER_MODE=background; shift ;;
    --force) FORCE=1; shift ;;
    http://*|https://*) URL="$1"; shift ;;
    *) echo "[ERROR] Argumento desconocido: $1" >&2; usage; exit 2 ;;
  esac
done
if [[ -z "$URL" && "$TARGET" == auto ]]; then
  echo "[ERROR] Indica una URL o --current." >&2; usage; exit 2
fi

# Impedir usar dos procesos con un perfil Chromium persistente; --force explícito.
if [[ "$FORCE" != 1 ]]; then
  lock="$ROOT_DIR/runtime/brave-profile/SingletonLock"
  if [[ -L "$lock" ]]; then
    target="$(readlink "$lock" || true)"
    locked_pid="${target##*-}"
    if [[ "$locked_pid" =~ ^[0-9]+$ ]] && kill -0 "$locked_pid" 2>/dev/null; then
      # Un servidor OpenCode V2 puede compartir su MCP entre sesiones del mismo proyecto.
      # Si el servidor ya gestiona este perfil, permitir reutilizarlo en vez de bloquear
      # todos los nuevos comandos (el servidor decide si debe crear otra instancia).
      if pgrep -af '@playwright/mcp' 2>/dev/null | grep -Fq -- "--user-data-dir $ROOT_DIR/runtime/brave-profile"; then
        echo "[INFO] Perfil ocupado por el MCP del proyecto; se reutilizará la sesión existente." >&2
      else
        echo "[ERROR] El perfil Brave del agente está en uso (PID $locked_pid)." >&2; exit 1
      fi
    fi
  fi
fi

if ! command -v opencode >/dev/null 2>&1 && [[ -x "$HOME/.opencode/bin/opencode" ]]; then
  export PATH="$HOME/.opencode/bin:$PATH"
fi
command -v opencode >/dev/null 2>&1 || { echo "[ERROR] No encuentro opencode" >&2; exit 1; }
ARGS="${URL:-"--current"} ${MODE}"
MODE_TEXT="semi (confirmar cada selección)"
if [[ "$MODE" == --auto ]]; then MODE_TEXT="auto (sin confirmación por pregunta)"; fi
PROMPT="Usa el agente exam-operator y la skill exam-resolver. Entrada: $ARGS. Modo: $MODE_TEXT. Detecta el examen primero; consulta exam-vision para preguntas visuales y exam-reviewer para razonamientos ambiguos; espera sus resultados antes de actuar. Verifica cada selección antes de avanzar. No eludas protecciones de sitios ni inventes respuestas ilegibles."
echo "[examResolve] navegador: ${PW_BROWSER_MODE:-background}; $MODE_TEXT"
if [[ "$MODE" == --auto ]]; then exec opencode --auto --prompt "$PROMPT"; fi
exec opencode --prompt "$PROMPT"
