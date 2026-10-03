#!/usr/bin/env node
/**
 * Reconocimiento estructural de páginas de examen/cuestionario.
 *
 * Para cada URL: navega con Brave (headless), detecta qué tipos de controles
 * de examen existen y clasifica la página. No responde nada; solo observa.
 *
 * Uso:
 *   node scripts/recon.mjs urls.txt [salida.json]
 *   node scripts/recon.mjs https://una-url.com [salida.json]
 *
 * Formato del archivo de URLs: una URL por línea; "#" comenta.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BRAVE = process.env.BRAVE_EXECUTABLE ||
  ['/usr/bin/brave-browser-stable', '/usr/bin/brave-browser'].find(p => existsSync(p));

if (!BRAVE) {
  console.error('[ERROR] No encontré Brave. Define BRAVE_EXECUTABLE.');
  process.exit(1);
}

function parseArgs(argv) {
  const rest = argv.slice(2);
  const out = rest.find(a => a.endsWith('.json'));
  const input = rest.find(a => !a.endsWith('.json'));
  return { input, out: out || 'runtime/recon-output.json' };
}

function loadUrls(input) {
  if (!input) { console.error('Uso: node scripts/recon.mjs <urls.txt|url> [salida.json]'); process.exit(1); }
  if (/^https?:\/\//.test(input)) return [input];
  return readFileSync(input, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

async function inspect(page, url) {
  let entry = { url, ok: false };
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    entry.status = resp ? resp.status() : null;
    await page.waitForTimeout(2500); // da tiempo a quizzes que montan el DOM por JS
    const data = await page.evaluate(() => {
      const q = (s) => document.querySelectorAll(s).length;
      const txt = document.body.innerText || '';
      const low = txt.toLowerCase();
      const labelImgs = [...document.querySelectorAll('label img, .option img, [class*=option] img, [class*=answer] img')].length;
      const radioImgs = [...document.querySelectorAll('input[type=radio]')]
        .filter(r => (r.closest('label') || r.parentElement)?.querySelector('img')).length;
      const challenge = /just a moment|checking your browser|cf-browser-verification|attention required|enable javascript and cookies/i
        .test(document.title + ' ' + low.slice(0, 500));
      const snip = (re) => (txt.match(re) || [null])[0];
      const audioSrcs = [...document.querySelectorAll('audio, audio source')]
        .map(a => a.getAttribute('src') || (a instanceof HTMLMediaElement ? a.currentSrc : '') || '')
        .filter(Boolean).slice(0, 6);
      const mediaFrames = [...document.querySelectorAll('iframe')]
        .filter(f => /youtube|youtu\.be|vimeo|soundcloud|spotify|audio/i.test(f.src || ''))
        .map(f => (f.src || '').slice(0, 90)).slice(0, 4);
      const tracks = [...document.querySelectorAll('track')]
        .map(t => ({ kind: t.kind || 'subtitles', src: (t.src || '').slice(0, 80) })).slice(0, 4);
      return {
        title: document.title.slice(0, 120),
        challenge,
        counts: {
          forms: q('form'),
          radios: q('input[type=radio]'),
          checkboxes: q('input[type=checkbox]'),
          selects: q('select'),
          textInputs: q('input[type=text], input:not([type]), input[type=number], input[type=email]'),
          textareas: q('textarea'),
          imageInputs: q('input[type=image]'),
          buttons: q('button, input[type=submit], input[type=button], .btn'),
          iframes: q('iframe'),
          canvas: q('canvas'),
          svg: q('svg'),
          imgs: q('img'),
          audio: q('audio'),
          video: q('video'),
          labelOptionImgs: labelImgs,
          radioWithOptionsImg: radioImgs,
          ariaRadiogroup: q('[role=radiogroup], [role=radio], [role=checkbox], [role=option]')
        },
        media: {
          audioSrcs,
          mediaFrames,
          tracks,
          hasTranscript: /transcript|transcripci[oó]n|script for|listen and read/i.test(txt.slice(0, 20000)),
          playButtons: /play audio|listen|escucha|reproducir/i.test(low)
        },
        markers: {
          preguntaDe: snip(/pregunta\s*\d+\s*de\s*\d+|question\s*\d+\s*(of|\/)\s*\d+/i),
          start: /start (the )?(quiz|test)|comenzar|empezar/.test(low),
          next: /\bnext\b|siguiente|avanzar/.test(low),
          submit: /submit|enviar|finalizar|finish|see results|entregar/.test(low),
          score: /score|puntuaci[oó]n|resultado|correct answers|\d+\s*\/\s*\d+/.test(low),
          trueFalse: /verdadero\s*\/\s*falso|true\s*\/\s*false|\btrue\b[\s\S]{0,40}\bfalse\b/i.test(txt.slice(0, 4000))
        },
        snippet: txt.replace(/\s+/g, ' ').slice(0, 240)
      };
    });
    const c = data.counts;
    const examSignals =
      c.radios + c.checkboxes + c.ariaRadiogroup + c.selects + c.imageInputs +
      (data.markers.preguntaDe ? 5 : 0) + (data.markers.start ? 2 : 0) +
      (data.markers.submit && (c.radios || c.checkboxes || c.buttons > 3) ? 3 : 0);
    const hasAudio = c.audio > 0 || (data.media && (data.media.audioSrcs.length || data.media.mediaFrames.length));
    let kind = data.challenge ? 'BLOQUEO/CHALLENGE'
      : examSignals >= 5 ? 'EXAMEN'
      : examSignals >= 2 ? 'POSIBLE'
      : 'SIN EXAMEN';
    if (kind === 'EXAMEN' && hasAudio) kind = 'EXAMEN+AUDIO';
    else if (hasAudio && examSignals >= 2) kind = 'POSIBLE+AUDIO';
    else if (hasAudio) kind = 'SOLO-AUDIO';
    entry = {
      ...entry,
      ok: true,
      ...data,
      examSignals,
      kind,
      visual: (c.labelOptionImgs + c.radioWithOptionsImg > 0) ? 'opciones-con-imagen'
        : c.canvas > 0 ? 'canvas'
        : null
    };
  } catch (e) {
    entry.error = String(e.message || e).slice(0, 160);
    entry.kind = 'ERROR';
  }
  return entry;
}

const { input, out } = parseArgs(process.argv);
const urls = loadUrls(input);
console.log(`Escaneando ${urls.length} URL(s) con Brave (${BRAVE})…`);

const browser = await chromium.launch({
  executablePath: BRAVE,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
});
const results = [];
for (const u of urls) {
  const page = await ctx.newPage();
  const r = await inspect(page, u);
  results.push(r);
  await page.close().catch(() => {});
  await new Promise(res => setTimeout(res, 400));
  console.log(
    `[${r.kind.padEnd(15)}] ${u}` +
    (r.ok ? ` → radios=${r.counts.radios} chk=${r.counts.checkboxes} sel=${r.counts.selects} canvas=${r.counts.canvas} imgs=${r.counts.imgs}` +
      ` audio=${r.counts.audio}` +
      (r.media && r.media.hasTranscript ? ' [transcript]' : '') +
      (r.visual ? ` [${r.visual}]` : '') : ` (${r.error || ''})`)
  );
}
await browser.close();

writeFileSync(out, JSON.stringify(results, null, 2));
const tally = results.reduce((a, r) => (a[r.kind] = (a[r.kind] || 0) + 1, a), {});
console.log('\nResumen:', JSON.stringify(tally));
console.log('Detalle en', out);
