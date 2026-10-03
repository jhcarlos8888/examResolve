#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ok=0
fail=0
check_cmd() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    echo "[OK] $name -> $(command -v "$name")"
    ok=$((ok+1))
  else
    echo "[FAIL] $name no encontrado"
    fail=$((fail+1))
  fi
}

check_cmd opencode
check_cmd node
check_cmd npm
check_cmd npx

if command -v brave-browser-stable >/dev/null 2>&1; then
  echo "[OK] Brave -> $(command -v brave-browser-stable)"
elif command -v brave-browser >/dev/null 2>&1; then
  echo "[OK] Brave -> $(command -v brave-browser)"
elif [[ -x /opt/brave.com/brave/brave-browser ]]; then
  echo "[OK] Brave -> /opt/brave.com/brave/brave-browser"
else
  echo "[FAIL] Brave no encontrado"
  fail=$((fail+1))
fi

if command -v node >/dev/null 2>&1; then
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if (( major >= 20 )); then
    echo "[OK] Node $(node -v)"
  else
    echo "[FAIL] Node 20+ requerido; tienes $(node -v)"
    fail=$((fail+1))
  fi
fi

if [[ -f opencode.json ]] && node -e 'JSON.parse(require("fs").readFileSync("opencode.json","utf8")); console.log("[OK] opencode.json válido")'; then
  :
else
  echo "[FAIL] opencode.json inválido"
  fail=$((fail+1))
fi

check_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    echo "[OK] $f"
    ok=$((ok+1))
  else
    echo "[FAIL] $f no encontrado"
    fail=$((fail+1))
  fi
}

check_exec() {
  local f="$1"
  if [[ -f "$f" && -x "$f" ]]; then
    echo "[OK] $f (ejecutable)"
    ok=$((ok+1))
  else
    echo "[FAIL] $f falta o no es ejecutable (chmod +x $f)"
    fail=$((fail+1))
  fi
}

# Piezas del flujo de resolución de exámenes
check_file ".opencode/skills/exam-resolver/SKILL.md"
check_file ".opencode/command/resolver.md"
check_file "docs/capacidades-playwright.md"
check_exec "scripts/resolve.sh"
check_exec "scripts/run.sh"
check_exec "scripts/playwright-mcp-brave.sh"

echo
echo "Resultado: $ok comprobaciones OK, $fail fallos."
if (( fail > 0 )); then exit 1; fi
