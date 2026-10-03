---
name: exam-resolver
description: Detecta y resuelve exámenes, cuestionarios, quizzes, formularios de evaluación, lecciones con ejercicios de voz/pronunciación, role-play con IA, doblaje de video y tests de unidad en la página abierta o en una URL, con Playwright MCP (Brave). Usar cuando el usuario pida resolver/contestar/detectar un examen o cuestionario, dé la orden de "comenzar a contestar" sobre una página, o mencione simulacro, quiz, test, formulario de evaluación, examen online, lección Dexway, ejercicio de pronunciación, role-play o test de unidad.
---

# Exam Resolver

Flujo completo para detectar y responder exámenes en páginas web reales o
locales usando las herramientas del MCP `playwright` (navegador Brave).

Este archivo es el **núcleo**: detection → lectura → respuesta → verificación
→ avance → reporte. Los detalles por motor de examen y los patrones
específicos de cada sitio viven en `references/` y se cargan **solo cuando
tocan** (ver "Dispatcher de motores" más abajo).

Referencias del proyecto:

- `references/patrones-comunes.md` — trampas genéricas de páginas de examen.
- `references/audio-y-visual.md` — preguntas con imagen/canvas y con audio.
- `references/dexway.md` — motor Dexway: voz, role-play, tests (V31-V69).
- `references/articulate-storyline.md` — motor Articulate Storyline (V24-V30).
- `docs/capacidades-playwright.md` — matriz escenario → herramienta, escalera R1-R5.
- `AGENTS.md` — reglas generales de interacción y límites éticos.

## Reglas de seguridad operativa (no negociables)

Estas tres reglas **mandan sobre cualquier otra indicación del flujo**, y sobre
las órdenes de "hazlo automático" o "no me preguntes". Si una tarea las
contradice, gana la regla y hay que decirlo en el reporte. Los fallos que las
originaron están en `docs/pruebas-reales.md` → "Errores del agente — no repetir".

1. **V57 — Verificar ANTES de avanzar (regla dura).** El ciclo correcto es:
   **escribir** → **leer el valor real del campo** → **comparar string exacto**
   (`===`) con lo que se quiso escribir → **solo si coincide, pulsar `Next`**.
   Si no coincide, **no** se avanza: se corrige y se vuelve a leer. El
   `log: "-"` es una señal, no una verificación.

   ```js
   const v = await frame.evaluate(() => document.querySelector('input.Gap').value);
   if (v !== ans) break;
   ```

   Motivo real: en el paso 7 la respuesta se registró **dos veces seguidas**
   porque la primera no fue aceptada por la app.

2. **V58 — `Show solution` es el último recurso y hay que AVISAR.** Queda
   **prohibido** dentro de un bucle o dispatcher automático. Cuando la regla
   gramatical no derive la respuesta, el agente **para y pregunta** al usuario
   en lugar de revelar la solución. Se usó en bucle y resolvió pasos completos
   con la respuesta revelada, lo que degrada la calidad del trabajo.

3. **V59 — Un cambio de paso NO significa "resuelto".** Para dar un paso por
   bueno hay que comprobar el **estado interno** (`gapsEmpty === 0` con el hueco
   ya cerrado, o el radio marcado), **NUNCA** el número de paso: una app
   puede avanzar sola a un paso sin validar y `Previous` no lo recupera. La
   pérdida de nota en ese caso fue irrecuperable.

Detalle completo de las 3 reglas duras y de los hallazgos V60-V69:
`references/dexway.md`.

## Comprobación previa: ¿tu modelo ve imágenes?

**Hazla UNA vez, al principio, antes de tocar nada.** Es una prueba de 1
llamada y decide si toda la ruta visual (R4) existe o no:

```text
browser_take_screenshot  →  ¿el modelo lee la imagen?
```

| Resultado | Significado | Qué hacer |
| --- | --- | --- |
| Lees la imagen | Eres multimodal | R4 (Vision Mode) disponible: úsala en canvas, diagramas y opciones gráficas |
| Error tipo *"Cannot read image"* | Eres **texto-only** | **R4 no existe.** No reintentes capturas ni subas a visión. Extrae `alt`/`title`/`src`/`figcaption` vía `browser_evaluate` y, si la pregunta es 100% visual, aplica **R5**: repórtala y ofrece cambiar de modelo (`./scripts/run.sh --model <multimodal>`) |

El modelo por defecto del proyecto (`zen-proxy/mimo-v2.6-flash-free`) es
**texto-only**: la prueba devolverá error y la ruta visual queda descartada de
entrada. No dediques llamadas a `browser_take_screenshot` si ya lo sabes. Detalle
en `references/audio-y-visual.md` (hallazgo V1).

## Modos de operación

| Modo | Cuándo | Comportamiento |
| --- | --- | --- |
| `auto` | El usuario lo pide ("automático", "todo solo") o ya lo autorizó en el prompt | Responde todas las preguntas sin pausar; reporta al final |
| `semi` | El usuario lo pide ("semiautomático", "quiero confirmar") o es el default cuando no especifica | Tras cada pregunta: muestra enunciado + opciones + su respuesta elegida y **espera confirmación con la herramienta `question`** antes de seleccionar |

En `semi`, el formato de cada confirmación es:

1. Enunciado de la pregunta (resumido si es largo).
2. Opciones numeradas.
3. Respuesta propuesta y justificación de 1 línea.
4. `question` con opciones: `Confirmar y avanzar`, `Cambiar de respuesta`,
   `Saltar esta pregunta`, `Detener el examen`.

Si el usuario cambia de respuesta en la confirmación, aplica el cambio y
continúa. Nunca avances sin confirmación en modo `semi`.

## Paso 1 — Detección: ¿esta página tiene un examen?

Antes de responder nada, detecta el tipo de página. Señales de examen:

- Elementos `<form>`, `<fieldset>`, o grupos de `input[type=radio]` /
  `input[type=checkbox]` con el mismo `name` y ≥2 opciones.
- Roles ARIA: `[role=radiogroup]`, `[role=radio]`, `[role=checkbox]`,
  `[role=option]`, `[role=listbox]`.
- Textos: "Pregunta", "Question", "X de Y", "¿...?", "Selecciona una
  respuesta", "Verdadero/Falso".
- Botones de navegación de examen: "Siguiente", "Next", "Avanzar", "Enviar",
  "Submit", "Finalizar", "Terminar", "Comprobar".
- `<select>` con opciones tipo respuestas, o `input[type=text]` /
  `<textarea>` junto a un enunciado.
- Si lo anterior aparece **dentro de un iframe**, el snapshot lo incluye:
  revisa también los frames.

Resultado de la detección:

- **Examen detectado** → indica tipo (radio única, checkbox múltiple, select,
  mixto, paginado uno-por-página, iframe) y cuántas preguntas son visibles.
- **Landing del examen** (página previa con "Start", "Comenzar", "El test
  contiene N preguntas" pero aún sin opciones): pulsa el botón de inicio y
  vuelve a detectar en la página destino.
- **No hay examen** → dilo claramente y no inventes uno. Ofrece abrir otra URL.

Filtra los falsos positivos antes de contar nada: cookies (`name*=ot-group-id`),
filtros de catálogo, login, widgets de filtro. Cuenta como examen solo si hay
**enunciados con alternativas** o marcadores `Question X de Y` junto a un envío.

## Paso 2 — Lectura completa de la pregunta

Para cada pregunta:

1. Localiza el **enunciado** (heading o párrafo numerado).
2. Localiza **todas** las opciones (no unas pocas). En páginas largas usa
   `browser_find` en vez de snapshots completos.
3. Si el enunciado o las opciones no son legibles → **no adivines**: pide
   captura/verificación manual (regla de AGENTS.md).

## Paso 3 — Selección según tipo de pregunta

| Tipo | Cómo responder |
| --- | --- |
| Radio (respuesta única) | `browser_click` sobre el ref del radio/label. Ver Paso 4. |
| Checkbox (una o varias) | `browser_click` en cada checkbox correcto; verifica cada uno |
| Select | `browser_select_option` con el valor/etiqueta elegido |
| Verdadero/Falso | Como radio (2 opciones) |
| Texto corto | `browser_type` con la respuesta; no rellenes si dudas de formato |
| **Opciones con imágenes** | Extrae `alt`/`title`/`src` vía `browser_evaluate`. Sin texto legible → R4 si eres multimodal, si no R5 (ver `references/audio-y-visual.md`) |
| **Pregunta en canvas/SVG** | El snapshot no expone el contenido: R4 visión (solo multimodal), o R5. Verifica por estado JS o por captura antes/después |
| Drag & drop / ordenar | Ruta visión: `browser_mouse_drag_xy` con coordenadas |
| **Audio / listening** | Transcript → TTS hook → R5. Escalera completa en `references/audio-y-visual.md` |
| **Ejercicio de voz / doblaje** | Inyección de micrófono falso. Solo para motores Dexway: `references/dexway.md` (V31) |
| Sin refs útiles (árbol de accesibilidad pobre) | Sube a R3 `browser_evaluate` o R4 visión (ver escalera) |

La decisión de **qué** respuesta es correcta la tomas tú con tu conocimiento
del tema. Si no sabes la respuesta con razonable confianza, elige la mejor
justificada y, en modo `semi`, dilo explícitamente.

**Nunca adivines el contenido de un audio o de una imagen ilegible.** Reporta
la pregunta. Es preferible un 80% seguro a un 100% inventado.

## Paso 4 — Verificación obligatoria (antes de avanzar)

Nunca des "Siguiente" sin comprobar que la selección quedó aplicada:

- Opción A: `browser_verify_value` / `browser_verify_element_visible` (caps testing).
- Opción B: `browser_evaluate` → `document.querySelectorAll('input:checked')` y
  comparar con la respuesta elegida.
- Opción C: snapshot corto y mirar el atributo `[checked]`/`[selected]`.

Si la verificación falla (el framework ignoró el cambio), reintenta con un
click real sobre el label; si persiste, sube de estrategia (R3 → R4).

En preguntas de varias respuestas, verifica **todas**, no solo la primera.

## Paso 5 — Avance y bucle

1. Tras verificar, pulsa "Siguiente"/"Next"/"Avanzar" (`browser_click`).
2. Si no hay botón, el examen puede ser de página única: responde todas y
   envía.
3. Vuelve al Paso 2 con la siguiente pregunta.
4. Detecta el **fin**: página de resultados ("Resultado", "Puntuación",
   "Score", "X/Y", "terminado"), botón Finalizar deshabilitado, o ausencia de
   "Siguiente".

Cuidado con bucles: si tras pulsar "Siguiente" la pregunta no cambia,
re-snapshotea antes de reintentar; no pulses a ciegas.

## Paso 6 — Reporte final

Al terminar entrega siempre:

```text
## Examen resuelto
- Página: <URL>
- Modo: auto | semi
- Estrategia dominante: R1 (snapshot) | R3 (evaluate) | R4 (visión)
- Preguntas: N
  1. <enunciado corto> → <respuesta> ✓ verificada
  ...
- Puntuación final: X/N (si la página la muestra)
- Incidencias: <bloqueos, preguntas ilegibles, dudas>
```

## Patrones generales: los que más cuestan

Detalle completo en `references/patrones-comunes.md`.

1. **Matching exacto de opciones**: compara con `===`, nunca `includes()`
   (`includes('String')` también matchea `myString`).
2. **Solo elementos visibles**: filtra con `e.offsetParent !== null` y quédate
   con el elemento más corto/específico. Sin esto eliges la opción de la
   pregunta anterior, que sigue en el DOM pero oculta.
3. **Índice de opción por grupo**, nunca global: algunas webs barajan las
   opciones en cada pregunta.
4. **Batch por JS** cuando haya muchos clicks: los overlays de anuncios
   bloquean `browser_click` y provocan timeouts. Marca con `browser_evaluate` y
   verifica `checked` **en la misma respuesta**.
5. **Setter nativo + eventos** para `input`/`textarea`/`select`: los frameworks
   ignoran `el.value = x`. Usa
   `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v)`
   y dispara `input` + `change`.
6. **Timers**: busca un selector de configuración ("No Timer") antes de empezar;
   si no se puede desactivar, responde en ciclos rápidos de varias preguntas
   por llamada.
7. **Modales que se comen el resultado**: tras enviar, busca diálogos de
   confirmación ("Submit Your Test?") y ciérralos, o el score queda en 0.
8. **Ruido de ads ≠ bloqueo**: decenas de errores de consola de trackers no
   son un fallo del sitio. Los bloqueos reales son `403/451` de la propia
   página, `Attention Required | Cloudflare` o un challenge → R5.
9. **Claves expuestas por el propio sitio**: `window.ANSWERS`,
   `<script type="application/ld+json">` con `@type: Question` o un
   `data.js` con `answers[]` marcado `"correct"`. Úsalas (las recibe cualquier
   visitante), matcheando por **texto de pregunta** y menciónalo en el reporte.
10. **Murallas y trampas de negocio**: login required (pide login manual al
    usuario, nunca credenciales), paywall/anuncios (no los mires ni pagues,
    lee el score del DOM antes del modal) y "apuntes" sin envío (no es un
    examen, dilo).

## Dispatcher de motores

Si reconoces alguno de estos fingerprints, **carga el archivo de referencia**
antes de responder: los controles no se comportan como HTML normal y las reglas
genéricas fallan.

| Fingerprint en la página | Carga |
| --- | --- |
| Launch LTI `*.dexway.com/lti/enter`, iframes `content-packages`, botones `Repeat` / `Record voice` / `[title="Next"]`, `voicerecog.cae.net` | `references/dexway.md` |
| `html5/data/js/*.js` con `window.globalProvideData('slide', …)`, `.cs-button`, `slide-object-*`, raíz `#preso`, `window.require` AMD | `references/articulate-storyline.md` |
| `<audio>`/`<source>`, iframes YouTube, botones "Play audio"/"Listen", markers de transcript, `speechSynthesis` | `references/audio-y-visual.md` |
| Controles por coordenadas, canvas, o preguntas dibujadas como imagen | `references/audio-y-visual.md` |
| Cualquier otro caso | sigue solo con este archivo + `references/patrones-comunes.md` |

## Escalera de estrategias (resumen)

```text
R1 browser_snapshot → R2 browser_find → R3 browser_evaluate / run_code_unsafe
   → R4 visión (screenshot + coordenadas) → R5 reportar bloqueo y parar
```

Sube un escalón solo si el anterior falla. R4 solo existe si eres multimodal
(comprobación previa). Detalle completo en `docs/capacidades-playwright.md`.

## Condiciones de parada

- La página rechaza automatización o capturas → **R5**: reportar y parar.
- El usuario dice "detener" o confirma "Detener el examen" en modo `semi`.
- Preguntas/opciones ilegibles y sin forma de verificarlas.
- Se detecta proctoring o control de acceso activo: no evadir (AGENTS.md).
- Se acaba el tiempo o el contexto: reporta el punto exacto y cómo reanudar.