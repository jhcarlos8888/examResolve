#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ok=0
fail=0
warn=0

pass() { ok=$((ok+1)); echo "[OK] $1"; }
bad()  { fail=$((fail+1)); echo "[FAIL] $1"; }
soft() { warn=$((warn+1)); echo "[AVISO] $1"; }

check_cmd() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    pass "$name -> $(command -v "$name")"
  else
    bad "$name no encontrado"
  fi
}

echo "== Dependencias del sistema =="
for c in opencode node npm npx python3; do check_cmd "$c"; done

BRAVE=""
for p in "${BRAVE_EXECUTABLE:-}" /usr/bin/brave-browser-stable /usr/bin/brave-browser \
         /opt/brave.com/brave/brave-browser "$(command -v brave-browser-stable 2>/dev/null || true)" \
         "$(command -v brave-browser 2>/dev/null || true)"; do
  if [[ -n "$p" && -x "$p" ]]; then BRAVE="$p"; break; fi
done
if [[ -n "$BRAVE" ]]; then
  pass "Brave -> $BRAVE"
else
  bad "Brave no encontrado (define BRAVE_EXECUTABLE=/ruta/al/brave-browser)"
fi

if command -v node >/dev/null 2>&1; then
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if (( major >= 20 )); then
    pass "Node $(node -v)"
  else
    bad "Node 20+ requerido; tienes $(node -v)"
  fi
fi

echo
echo "== Configuración =="
if [[ -f opencode.json ]] && node -e 'JSON.parse(require("fs").readFileSync("opencode.json","utf8"))'; then
  pass "opencode.json válido"
else
  bad "opencode.json inválido o ausente"
fi

if node -e '
  const c = JSON.parse(require("fs").readFileSync("opencode.json","utf8"));
  const p = c.mcp && c.mcp.playwright;
  if (!p) { console.error("falta mcp.playwright"); process.exit(1); }
  if (p.enabled !== true) { console.error("mcp.playwright no está enabled"); process.exit(1); }
  if (!p.command || !Array.isArray(p.command)) { console.error("mcp.playwright sin command"); process.exit(1); }
  if ((p.timeout ?? 0) < 30000) { console.error("timeout del MCP < 30000 ms: el primer npx puede tardar más"); process.exit(1); }
  if (!c.model) { console.error("sin model fijado"); process.exit(1); }
' 2>/dev/null; then
  pass "mcp.playwright enabled, con command y timeout >= 30s"
else
  bad "mcp.playwright mal configurado (enabled/command/timeout>=30000)"
fi

if [[ -f tsconfig.json ]]; then
  pass "tsconfig.json presente"
else
  bad "tsconfig.json ausente (npm run typecheck no funcionará)"
fi

echo
echo "== Dependencias de npm =="
if [[ -d node_modules/playwright-core ]]; then
  pass "playwright-core instalado"
else
  bad "playwright-core ausente → ejecuta: npm install"
fi
if [[ -d node_modules/@types/node ]]; then
  pass "@types/node instalado"
else
  bad "@types/node ausente → ejecuta: npm install"
fi
if [[ -x node_modules/.bin/tsc ]]; then
  pass "typescript instalado"
else
  bad "typescript ausente → ejecuta: npm install"
fi

echo
echo "== Scripts del flujo =="
for s in resolve.sh run.sh playwright-mcp-brave.sh doctor.sh install-browser.sh; do
  if [[ -f "scripts/$s" && -x "scripts/$s" ]]; then
    pass "scripts/$s (ejecutable)"
  elif [[ -f "scripts/$s" ]]; then
    bad "scripts/$s no es ejecutable → chmod +x scripts/$s"
  else
    bad "scripts/$s ausente"
  fi
done

for s in recon.mjs smoke.mjs; do
  if [[ -f "scripts/$s" ]]; then
    pass "scripts/$s"
  else
    bad "scripts/$s ausente"
  fi
done

for js in scripts/*.mjs; do
  if node --check "$js" 2>/dev/null; then
    pass "sintaxis OK: $js"
  else
    bad "error de sintaxis en $js"
  fi
done

echo
echo "== Piezas de la skill =="
for f in .opencode/skills/exam-resolver/SKILL.md \
         .opencode/command/resolver.md \
         docs/capacidades-playwright.md; do
  if [[ -f "$f" ]]; then pass "$f"; else bad "$f ausente"; fi
done

missing_refs=0
for f in .opencode/skills/exam-resolver/references/*.md; do
  [[ -e "$f" ]] || { bad "references/ vacío: la skill no tiene archivos de referencia"; missing_refs=1; }
done
if (( missing_refs == 0 )); then
  pass "references/ con $(ls -1 .opencode/skills/exam-resolver/references/*.md 2>/dev/null | wc -l) archivos"
fi

# La skill no debe crecer sin límite: el núcleo se lee en cada invocación.
skill_lines="$(wc -l < .opencode/skills/exam-resolver/SKILL.md 2>/dev/null || echo 0)"
if (( skill_lines > 350 )); then
  soft "SKILL.md tiene $skill_lines líneas (>350): mueve el detalle a references/"
else
  pass "SKILL.md tiene $skill_lines líneas (núcleo legible)"
fi

echo
echo "== Simuladores y runtime =="
sims=0
for f in simulators/*.html; do
  [[ -e "$f" ]] || continue
  sims=$((sims+1))
done
if (( sims >= 4 )); then
  pass "$sims simuladores locales para validar la cadena"
else
  bad "solo $sims simuladores (se esperan 4+)"
fi

if mkdir -p runtime/.doctor-test 2>/dev/null && rmdir runtime/.doctor-test 2>/dev/null; then
  pass "runtime/ es escribible"
elif [[ -d runtime ]]; then
  bad "runtime/ no es escribible: el perfil de Brave fallará"
else
  bad "runtime/ no existe (créalo con mkdir -p runtime)"
fi

if pgrep -f "@playwright/mcp" >/dev/null 2>&1; then
  soft "ya hay un servidor MCP playwright corriendo: el perfil de Brave está ocupado"
fi

echo
echo "Resultado: $ok OK, $warn avisos, $fail fallos."
if (( fail > 0 )); then exit 1; fi