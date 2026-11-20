#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [[ ! -f opencode.json ]]; then echo "[ERROR] Falta opencode.json" >&2; exit 1; fi
# El ejecutable del usuario suele vivir fuera del PATH de servicios/terminales no interactivas.
if ! command -v opencode >/dev/null 2>&1 && [[ -x "$HOME/.opencode/bin/opencode" ]]; then
  export PATH="$HOME/.opencode/bin:$PATH"
fi
command -v opencode >/dev/null 2>&1 || { echo "[ERROR] OpenCode no está instalado." >&2; exit 1; }
# La ventana es oculta por defecto; para hacer login: PW_BROWSER_MODE=visible ./scripts/run.sh
exec opencode "$@"
