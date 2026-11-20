#!/usr/bin/env node
// Visor de SOLO LECTURA: se conecta por CDP sin activar ni controlar la ventana.
import { createServer } from 'node:http';
import { readFile, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profile = resolve(process.env.BRAVE_AGENT_PROFILE || join(root, 'runtime/brave-profile'));
const portfile = join(profile, 'DevToolsActivePort');
const token = randomBytes(24).toString('hex');
const portOption = process.argv.find(x => x.startsWith('--port='));
const listenPort = portOption ? Number(portOption.split('=')[1]) : 0;
if (!Number.isInteger(listenPort) || listenPort < 0 || listenPort > 65535) {
  console.error('Puerto inválido (--port=0..65535)'); process.exit(2);
}

let browser, connecting;
async function currentBrowser() {
  if (browser?.isConnected()) return browser;
  if (connecting) return connecting;
  connecting = (async () => {
    if (!existsSync(portfile)) throw new Error('Aún no se ha abierto Brave del agente. Ejecuta una acción del MCP.');
    const port = Number(readFileSync(portfile, 'utf8').split(/\r?\n/)[0]);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error('DevToolsActivePort inválido.');
    browser = await chromium.connectOverCDP('http://127.0.0.1:' + port, { timeout: 3500 });
    return browser;
  })();
  try { return await connecting; } finally { connecting = null; }
}
async function pages() {
  const b = await currentBrowser();
  return b.contexts().flatMap(c => c.pages()).filter(p => !p.isClosed() && p.url() !== 'about:blank');
}
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
};
function send(res, code, type, content) {
  res.writeHead(code, { ...commonHeaders, 'Content-Type': type });
  res.end(content);
}
function safeLabel(p) {
  try { const u = new URL(p.url()); return u.origin + u.pathname; } catch { return '(página local)'; }
}
const server = createServer(async (req, res) => {
  const u = new URL(req.url || '/', 'http://127.0.0.1');
  const host = req.headers.host || '';
  if (!/^((127\.0\.0\.1)|(localhost)):\d+$/.test(host)) return send(res, 403, 'text/plain', 'Host no permitido');
  if (req.method !== 'GET') return send(res, 405, 'text/plain', 'Sólo GET');
  if (u.searchParams.get('key') !== token) return send(res, 403, 'text/plain', 'Acceso denegado');
  try {
    if (u.pathname === '/') {
      return readFile(join(root, 'scripts/monitor.html'), (err, content) =>
        err ? send(res, 500, 'text/plain', 'Monitor no disponible') :
          send(res, 200, 'text/html; charset=utf-8', content));
    }
    if (u.pathname === '/api/pages') {
      const all = await pages();
      const data = await Promise.all(all.map(async (p, i) => ({
        id: i, title: (await p.title().catch(() => '')) || 'Pestaña ' + (i + 1), url: safeLabel(p)
      })));
      return send(res, 200, 'application/json', JSON.stringify({ connected: true, pages: data }));
    }
    if (u.pathname === '/api/screenshot') {
      const all = await pages();
      const raw = u.searchParams.get('id');
      const index = raw === null ? all.length - 1 : Number(raw);
      if (!Number.isInteger(index) || index < 0 || index >= all.length) {
        return send(res, 404, 'application/json', JSON.stringify({ error: 'No hay pestaña disponible' }));
      }
      const shot = await all[index].screenshot({ timeout: 7500, type: 'jpeg', quality: 72 });
      return send(res, 200, 'image/jpeg', shot);
    }
    send(res, 404, 'text/plain', 'No encontrado');
  } catch (err) {
    browser = undefined;
    send(res, 503, 'application/json', JSON.stringify({ connected: false, error: String(err?.message || err) }));
  }
});
server.listen(listenPort, '127.0.0.1', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const url = 'http://127.0.0.1:' + port + '/?key=' + token;
  console.log('Visor local de examResolve, SOLO LECTURA:');
  console.log(url);
  console.log('Abre este enlace cuando quieras observar el navegador oculto; CTRL+C cierra sólo el visor.');
  if (process.argv.includes('--open')) {
    const opener = spawn('xdg-open', [url], { stdio: 'ignore' });
    opener.on('error', e => console.error('No se pudo abrir el visor:', e.message));
  }
});