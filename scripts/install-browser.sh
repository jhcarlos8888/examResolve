#!/usr/bin/env bash
set -euo pipefail

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if (( NODE_MAJOR < 20 )); then
  echo "Node.js 20+ es requerido. Actual: $(node -v 2>/dev/null || echo 'no instalado')" >&2
  exit 1
fi

echo "Descargando/verificando Playwright MCP 0.0.83..."
npx -y @playwright/mcp@0.0.83 --help >/dev/null

echo "OK. Playwright MCP está disponible vía npx."
