// Prueba funcional: Brave headless + CDP en localhost + visor, sin navegador real del usuario.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profile = mkdtempSync(join(tmpdir(), 'examresolve-browser-test-'));
let ctx, viewer;
let passed = 0;
const check = (cond, msg) => { assert.ok(cond, msg); passed++; console.log('[OK]', msg); };

function waitForViewer(proc) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(() => reject(Error('Visor no inició')), 9000);
    proc.stdout.on('data', chunk => {
      buffer += chunk.toString('utf8');
      const url = buffer.match(/http:\/\/127\.0\.0\.1:\d+\/\?key=[a-f0-9]+/);
      if (url) { clearTimeout(timeout); resolve(url[0]); }
    });
    proc.once('exit', code => { clearTimeout(timeout); reject(Error('Visor finalizó antes de iniciar: ' + code)); });
    proc.once('error', reject);
  });
}
try {
  ctx = await chromium.launchPersistentContext(profile, {
    headless: true,
    executablePath: process.env.BRAVE_EXECUTABLE || '/usr/bin/brave-browser',
    args: ['--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0'],
    viewport: { width: 1100, height: 750 }
  });
  const page = await ctx.newPage();
  await page.goto('data:text/html,' + encodeURIComponent('<title>Simulador visual</title><h1>Pregunta gráfica</h1><svg width="200" height="150"><circle cx="80" cy="60" r="35" fill="blue"/></svg>'));
  check(existsSync(join(profile, 'DevToolsActivePort')), 'CDP accesible en el perfil aislado');
  const focusBefore = await page.evaluate(() => document.hasFocus());

  viewer = spawn(process.execPath, [join(root, 'scripts/watch-browser.mjs')], {
    cwd: root, env: { ...process.env, BRAVE_AGENT_PROFILE: profile }, stdio: ['ignore', 'pipe', 'pipe']
  });
  const url = await waitForViewer(viewer);
  const good = new URL(url);
  const denied = await fetch(good.origin + '/api/pages');
  check(denied.status === 403, 'Visor rechaza accesos sin token');
  const html = await fetch(url);
  check(html.status === 200 && (await html.text()).includes('SÓLO LECTURA'), 'Interfaz de monitor disponible');
  const result = await fetch(good.origin + '/api/pages?key=' + good.searchParams.get('key'));
  const info = await result.json();
  check(result.ok && info.pages.some(p => p.title === 'Simulador visual'), 'Detecta pestaña desde CDP');
  const id = info.pages.find(p => p.title === 'Simulador visual').id;
  const snap = await fetch(good.origin + '/api/screenshot?key=' + good.searchParams.get('key') + '&id=' + id);
  const bytes = Buffer.from(await snap.arrayBuffer());
  check(snap.status === 200 && snap.headers.get('content-type').includes('image/jpeg') && bytes.length > 2000, 'Captura JPEG enviada al visor');
  check((await page.title()) === 'Simulador visual', 'La sesión original sigue navegable');
  check((await page.evaluate(() => document.hasFocus())) === focusBefore, 'Observar no cambia el foco de la página');
  console.log('Regresión del visor: ' + passed + ' OK, 0 fallos');
} catch (err) {
  console.error('[FAIL]', err);
  process.exitCode = 1;
} finally {
  if (viewer && !viewer.killed) viewer.kill('SIGTERM');
  if (ctx) await ctx.close().catch(() => {});
  rmSync(profile, { recursive: true, force: true });
}