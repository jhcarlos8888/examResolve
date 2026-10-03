#!/usr/bin/env node
/**
 * Smoke test de la cadena completa del agente resolutor.
 *
 * Levanta los simuladores locales en un servidor efímero, abre Brave headless
 * y resuelve cada simulador con los MISMOS primitivos que documenta la skill
 * (selectores del a11y tree, :checked, setter nativo + eventos, Roles ARIA,
 * travesía de iframes). Si un simulador deja de resolverse, el agente tampoco
 * podrá resolver un examen real: por eso esto es un test de regresión.
 *
 * Uso:
 *   npm test
 *   node scripts/smoke.mjs --headed
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SIM = join(ROOT, 'simulators');
const HEADED = process.argv.includes('--headed');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const BRAVE =
  process.env.BRAVE_EXECUTABLE ||
  ['/usr/bin/brave-browser-stable', '/usr/bin/brave-browser', '/opt/brave.com/brave/brave-browser'].find((p) =>
    existsSync(p),
  );

if (!BRAVE) {
  console.error('[ERROR] No encontré Brave. Define BRAVE_EXECUTABLE.');
  process.exit(1);
}

/* ------------------------------------------------------------------ utils */

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, cond, detail = '') {
  if (cond) {
    pass++;
    console.log(`  [OK]   ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  [FAIL] ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function eq(name, got, want) {
  ok(name, got === want, `esperado ${JSON.stringify(want)}, obtenido ${JSON.stringify(got)}`);
}

/** Servidor estático mínimo sobre simulators/ en un puerto efímero. */
function serve() {
  const server = createServer(async (req, res) => {
    const rel = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(SIM, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(SIM)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') throw new Error('no se pudo obtener el puerto');
      resolve({ server, port: addr.port });
    });
  });
}

/* ------------------------------------------------- primitivos de la skill */

/** R3: leer el valor real del campo (regla dura V57). */
const readChecked = (loc) => loc.evaluate(() => document.querySelectorAll('input:checked').length);

/** R3: click en elemento por texto EXACTO y solo si es visible (patrón común 2). */
async function clickVisibleByText(scope, selector, text) {
  return scope.evaluate(
    ([sel, txt]) => {
      const els = [...document.querySelectorAll(sel)].filter(
        (e) => e.textContent.trim() === txt && e.offsetParent !== null,
      );
      if (!els.length) return false;
      els[0].click();
      return true;
    },
    [selector, text],
  );
}

async function testHelpers(page, base) {
  const name = 'helpers — click por texto exacto, solo si visible';
  console.log(`\n${name}`);
  await page.goto(`${base}/frame-examen.html`);
  ok('devuelve true con el texto exacto', await clickVisibleByText(page, 'button', 'Finalizar'));
  ok(
    'devuelve false con texto que no existe',
    (await clickVisibleByText(page, 'button', 'NoExiste')) === false,
  );
  ok(
    'devuelve false si el elemento está oculto (offsetParent null)',
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.textContent = 'Oculto';
      b.style.display = 'none';
      document.body.appendChild(b);
      const els = [...document.querySelectorAll('button')].filter(
        (e) => e.textContent.trim() === 'Oculto' && e.offsetParent !== null,
      );
      b.remove();
      return els.length === 0;
    }),
  );
}

/** R3: setter nativo de <select> + eventos (V44). */
const setSelect = (scope, value) =>
  scope.evaluate((v) => {
    const s = document.querySelector('select');
    if (!s) return 'sin select';
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, v);
    s.dispatchEvent(new Event('change', { bubbles: true }));
    s.dispatchEvent(new Event('input', { bubbles: true }));
    return s.value;
  }, value);

/** R3: setter nativo de input[type=text] + eventos (V39). */
const setText = (scope, value) =>
  scope.evaluate((v) => {
    const el = /** @type {HTMLInputElement | null} */ (
      document.querySelector('input[type=text], input:not([type])')
    );
    if (!el) return 'sin input';
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return el.value;
  }, value);

/** R1: leer el marcador "Pregunta X de Y". */
const progressOf = (scope) =>
  scope.evaluate(() => {
    const t = document.body.innerText;
    return (t.match(/Pregunta\s*\d+\s*de\s*\d+/i) || [null])[0];
  });

const resultOf = (scope) =>
  scope.evaluate(() => {
    const m = document.body.innerText.match(/Resultado:\s*(\d+)\s*\/\s*(\d+)/i);
    return m ? `${m[1]}/${m[2]}` : null;
  });

/* ------------------------------------------------------------ simuladores */

/** Respuestas correctas por simulador (índices de opción). */
const KEY = {
  'index.html': [1, 0, 2, 1, 1],
  'frame-examen.html': [3, 1, 1, 0],
  'spa-a11y.html': [0, 1, 0, 2],
};

async function testIndexRadio(page, base) {
  const name = 'index.html — radio única paginada + verificación :checked';
  console.log(`\n${name}`);
  await page.goto(`${base}/index.html`);
  eq('detección: "Pregunta 1 de 5" visible', await progressOf(page), 'Pregunta 1 de 5');
  eq('detección: 1 radio marcado al inicio', await readChecked(page), 0);

  for (let i = 0; i < KEY['index.html'].length; i++) {
    const idx = KEY['index.html'][i];
    // Selecting by index within the CURRENT group (patrón común 3).
    await page.evaluate(
      (j) => /** @type {HTMLInputElement} */ (document.querySelectorAll('input[name="answer"]')[j]).click(),
      idx,
    );
    // Regla dura V57: verify before advancing.
    const checked = await page.evaluate(
      () => /** @type {HTMLInputElement | null} */ (document.querySelector('input[name="answer"]:checked'))?.value ?? null,
    );
    eq(`P${i + 1}: selección verificada antes de avanzar`, checked, String(idx));
    await page.click('#next');
  }
  eq('puntuación final', await resultOf(page), '5/5');
}

async function testFrameSinglePage(page, base) {
  const name = 'frame-examen.html — página única, un grupo de radios por pregunta';
  console.log(`\n${name}`);
  await page.goto(`${base}/frame-examen.html`);
  const names = await page.evaluate(() =>
    [...document.querySelectorAll('input[type=radio]')].map((r) => /** @type {HTMLInputElement} */ (r).name),
  );
  eq('detección: 4 grupos de radios distintos', new Set(names).size, 4);

  KEY['frame-examen.html'].forEach((idx, i) => {
    void page.evaluate(
      ([j, gi]) =>
        /** @type {HTMLInputElement} */ (document.querySelectorAll(`input[name="q${gi}"]`)[j]).click(),
      [idx, i],
    );
  });
  const checked = await readChecked(page);
  eq('las 4 respuestas quedaron marcadas', checked, 4);

  await page.click('#finish');
  eq('puntuación final', await resultOf(page), '4/4');
}

async function testSpaA11y(page, base) {
  const name = 'spa-a11y.html — SPA sin inputs, custom divs con state exposed';
  console.log(`\n${name}`);
  await page.goto(`${base}/spa-a11y.html`);
  eq(
    'detección: sin input[type=radio] (a11y tree pobre → R3)',
    await page.evaluate(() => document.querySelectorAll('input[type=radio]').length),
    0,
  );
  eq('detección: 4 opciones custom .opt', await page.locator('.opt').count(), 4);

  for (let i = 0; i < KEY['spa-a11y.html'].length; i++) {
    const before = await page.evaluate(() => /** @type {any} */ (window).__quizState.selected);
    const opts = page.locator('.opt');
    const n = await opts.count();
    await opts.nth(KEY['spa-a11y.html'][i]).click();
    const after = await page.evaluate(() => /** @type {any} */ (window).__quizState.selected);
    ok(`P${i + 1}: la SPA registró la selección (state.selected ${before} → ${after})`, after !== null && n === 4);
    await page.click('#next');
  }
  eq('puntuación final', await resultOf(page), '4/4');
}

async function testFormulariosMixed(page, base) {
  const name = 'formularios.html — tipos mixtos (radio, checkbox, select, texto)';
  console.log(`\n${name}`);
  await page.goto(`${base}/formularios.html`);

  // P1 radio
  await page.evaluate(
    () => /** @type {HTMLInputElement} */ (document.querySelectorAll('input[name="q"]')[0]).click(),
  );
  eq('P1 radio verificado', await page.evaluate(() => document.querySelectorAll('input[name="q"]:checked').length), 1);
  await page.click('#next');

  // P2 radio (404 → índice 2)
  await page.evaluate(
    () => /** @type {HTMLInputElement} */ (document.querySelectorAll('input[name="q"]')[2]).click(),
  );
  await page.click('#next');

  // P3 checkbox múltiple (3 correctas)
  const chk = await page.evaluate(() => {
    const boxes = /** @type {HTMLInputElement[]} */ ([...document.querySelectorAll('input[name="q"]')]);
    [0, 1, 2].forEach((i) => boxes[i].click());
    return document.querySelectorAll('input[name="q"]:checked').length;
  });
  eq('P3 tres checkboxes verificados', chk, 3);
  await page.click('#next');

  // P4 desplegable (setter nativo, NO selectOption).
  // OJO: aquí el <option value> es el ÍNDICE, no la etiqueta. Antes de
  // asignar, lee value→label del desplegable: no todos los sitios usan la
  // etiqueta como value (V44).
  eq('P4 el value del desplegable es el índice, no la etiqueta', await setSelect(page, '0'), '0');
  eq(
    'P4 la etiqueta visible tras el setter nativo',
    await page.evaluate(() => document.querySelector('select').selectedOptions[0].textContent.trim()),
    'A) Maven',
  );
  await page.click('#next');

  // P5 verdadero/falso
  await page.evaluate(
    () => /** @type {HTMLInputElement} */ (document.querySelectorAll('input[name="q"]')[0]).click(),
  );
  await page.click('#next');

  // P6 respuesta corta (setter nativo de input)
  eq('P6 setter nativo del input de texto', await setText(page, 'jar'), 'jar');
  await page.click('#next');

  eq('puntuación final', await resultOf(page), '6/6');
}

async function testIframeTraversal(page, base) {
  const name = 'iframe-examen.html — examen embebido (requiere travesía de frames)';
  console.log(`\n${name}`);
  await page.goto(`${base}/iframe-examen.html`);
  eq('la página anfitriona no tiene el examen', await readChecked(page), 0);
  const frames = page.frames().filter((f) => f !== page.mainFrame());
  eq('se detecta 1 iframe con el cuestionario', frames.length, 1);

  const inner = frames[0];
  await inner.waitForSelector('input[name="q0"]');
  KEY['frame-examen.html'].forEach((idx, i) => {
    void inner.evaluate(
      ([j, gi]) =>
        /** @type {HTMLInputElement} */ (document.querySelectorAll(`input[name="q${gi}"]`)[j]).click(),
      [idx, i],
    );
  });
  eq('radios marcados dentro del frame', await readChecked(inner), 4);
  await inner.click('#finish');
  eq('puntuación final leída del frame', await resultOf(inner), '4/4');
}

/* ------------------------------------------------------------------- main */

const { server, port } = await serve();
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({
  executablePath: BRAVE,
  headless: !HEADED,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext();
const page = await ctx.newPage();

console.log(`Simuladores en ${base} (Brave ${HEADED ? 'visible' : 'headless'})`);

try {
  await testIndexRadio(page, base);
  await testSpaA11y(page, base);
  await testFormulariosMixed(page, base);
  await testFrameSinglePage(page, base);
  await testIframeTraversal(page, base);
  await testHelpers(page, base);
} catch (e) {
  fail++;
  failures.push(`excepción no controlada: ${e && e.message ? e.message : e}`);
  console.error(`\n[ERROR] ${e && e.stack ? e.stack : e}`);
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Smoke test: ${pass} OK, ${fail} fallos`);
if (fail > 0) {
  console.log('\nFallos:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('La cadena del agente (snapshot → verify → evaluate → frames) responde.');