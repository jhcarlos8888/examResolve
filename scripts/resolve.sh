#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'MSG'
Uso:
  ./scripts/resolve.sh <url> [--semi|--auto]     Abrir y resolver el examen de la URL
  ./scripts/resolve.sh --current [--semi|--auto] Resolver el examen de la pestaña activa
  Opciones: --force  Ignorar la guardia de perfil de Brave en uso

Ejemplos:
  ./scripts/resolve.sh https://ejemplo.com/examen --semi
  ./scripts/resolve.sh --current --auto

Arranca OpenCode (TUI) con un prompt que sigue la skill exam-resolver.
También puedes usar el comando /resolver dentro de OpenCode.
Requiere que el MCP playwright esté habilitado en opencode.json.
MSG
}

URL=""
TARGET="auto"
MODE=""
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --current) TARGET="current"; shift ;;
    --semi) MODE="--semi"; shift ;;
    --auto) MODE="--auto"; shift ;;
    --force) FORCE=1; shift ;;
    http://*|https://*) URL="$1"; shift ;;
    *) echo "[ERROR] Argumento no reconocido: $1" >&2; usage; exit 1 ;;
  esac
done

# Guardia: el perfil persistente de Brave solo admite una instancia.
# Si otra sesión de OpenCode/Playwright ya lo usa, lanzar otra chocaría.
if [[ "$FORCE" -ne 1 ]]; then
  LOCK="$ROOT_DIR/runtime/brave-profile/SingletonLock"
  locked_pid=""
  if [[ -e "$LOCK" ]]; then
    target="$(readlink "$LOCK" 2>/dev/null || basename "$LOCK" 2>/dev/null || true)"
    locked_pid="${target##*-}"
  fi
  if [[ -n "$locked_pid" && "$locked_pid" =~ ^[0-9]+$ ]] && kill -0 "$locked_pid" 2>/dev/null; then
    echo "[ERROR] runtime/brave-profile está en uso por el proceso $locked_pid." >&2
    echo "        Cierra esa sesión de OpenCode/Brave (o espera a que termine)" >&2
    echo "        antes de lanzar otra. Si es intencionado, repite con --force." >&2
    exit 1
  fi
  if pgrep -f "@playwright/mcp" >/dev/null 2>&1; then
    echo "[ERROR] Ya hay un servidor MCP playwright corriendo (probablemente" >&2
    echo "        la sesión de OpenCode actual). Usa esa sesión con /resolver," >&2
    echo "        ciérrala, o repite con --force si sabes lo que haces." >&2
    exit 1
  fi
fi

if [[ -z "$URL" && "$TARGET" == "auto" ]]; then
  echo "[ERROR] Indica una URL o --current." >&2
  usage
  exit 1
fi

if [[ -n "$URL" ]]; then
  ARGS="$URL ${MODE:-}"
else
  ARGS="--current ${MODE:-}"
fi

MODE_TXT="semiautomático (confirma cada respuesta con question)"
if [[ "$MODE" == "--auto" ]]; then
  MODE_TXT="automático (responde todo sin pausar)"
fi

PROMPT="Resuelve un examen siguiendo la skill exam-resolver (equivalente al comando /resolver). Entrada: ${ARGS}. Modo: ${MODE_TXT}. Detecta primero si la página contiene un examen; si no lo hay, dilo y no inventes preguntas. Después responde, verifica cada selección y avanza hasta el resultado final. No evadas protecciones del sitio."
echo "[resolve] Prompt: $PROMPT"
exec opencode --prompt "$PROMPT"
