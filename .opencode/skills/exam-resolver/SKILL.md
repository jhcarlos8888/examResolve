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
- `references/dexway.md` — motor Dexway: voz, role-play, tests (V31-V76).
- `references/articulate-storyline.md` — motor Articulate Storyline (V24-V30).
- `references/moodle.md` — motor Moodle `mod/quiz` (V77-V81).
- `references/clevry.md` — motor Clevry / Santander Open Academy (V85).
- `references/netacad.md` — motor NetAcad / Cisco Skills for All (V89).
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

## Modelos especializados y delegación automática

`exam-operator` usa DeepSeek Flash; delega a un subagente y espera su respuesta
sin sustituir el modelo de la sesión principal.

- **Pregunta que necesita ver una fotografía, SVG, canvas, fórmula renderizada,
  tabla como imagen o gráfica:** invoca `exam-vision`
  (`opencode/nemotron-3.5-super-vl-free`) con pregunta, opciones y contexto.
  Captura vía Playwright MCP compartido. Espera antes de responder.
- **Pregunta textual ambigua, técnica o de razonamiento difícil:** consulta
  `exam-reviewer` (`opencode-go/glm-5.3-flash`); verifica la selección.
- **Texto claro:** DeepSeek responde sin llamadas extra.
- Si una captura no llega al subagente o la imagen sigue ilegible, aplica R5,
  no inventes. `--caps vision` habilita clics gráficos, NO interpreta imágenes.

Detalle y ruta de captura: `references/audio-y-visual.md`.

## Modos de operación

| Modo | Cuándo | Comportamiento |
| --- | --- | --- |
| `auto` | El usuario lo pide ("automático", "todo solo") o ya lo autorizó en el prompt | Responde todas las preguntas sin confirmar cada una, **pero con el ritmo que se acordó en la pregunta V95 (nunca a máxima velocidad)**; reporta al final |
| `semi` | El usuario lo pide ("semiautomático", "quiero confirmar") o es el default cuando no especifica | Tras cada pregunta: muestra enunciado + opciones + su respuesta elegida y **espera confirmación con la herramienta `question`** antes de seleccionar |

En `semi`, el formato de cada confirmación es:

1. Enunciado de la pregunta (resumido si es largo).
2. Opciones numeradas.
3. Respuesta propuesta y justificación de 1 línea.
4. `question` con opciones: `Confirmar y avanzar`, `Cambiar de respuesta`,
   `Saltar esta pregunta`, `Detener el examen`.

Si el usuario cambia de respuesta en la confirmación, aplica el cambio y
continúa. Nunca avances sin confirmación en modo `semi`.

### Ritmo: `--auto` NO es "velocidad máxima" (V88)

**`--auto` = "sin confirmar cada respuesta", no "lo más rápido posible".**
Si el usuario pide un ritmo — *"2 minutos entre preguntas"*, *"espera"*,
*"párate en cada una"* — **se respeta aunque el modo sea `--auto`**. Pedido
explícito de ritmo **manda sobre la eficiencia del agente**; un examen
terminado en 5 minutos cuando pidieron pausas es un fallo, no un acierto.

#### PREGUNTA DE RITMO OBLIGATORIA al inicio (V95) — ANTES de tocar el examen

**Antes del Paso 1 (detección), y sin importar que la entrada diga `--auto`,
hay que preguntar SIEMPRE el ritmo con `question`** una sola vez. El motivo
real: el usuario pidió "repartir el tiempo en una hora", pero esa instrucción
llegó cuando ya iban 16 de 21 preguntas contestadas y ya no había vuelta atrás
(un error del agente, no del usuario; r29/lectura-crítica).

Cómo se hace (una sola pregunta, con la **landing ya leída**):

1. Lee primero la landing: `N` de preguntas (navegateral/título), límite de
   tiempo y método de calificación — **sin abrir ninguna página de preguntas**.
2. Calcula el presupuesto: si el usuario pidió repartir el tiempo →
   `pausa ≈ (tiempo_límite − margen_envío) / N`.
3. Pregunta con `question`:

   ```text
   Este examen tiene N preguntas y un límite de X minutos.
   Ritmo propuesto: <pausa> entre cada pregunta (≈ X min en total).
   ¿Confirmas este ritmo o lo cambias?
   ```

   Opciones: `Ritmo propuesto (Recommended)` / `Más lento` / `Más rápido` /
   `Sin pausas` / `Empezar`.

4. **El ritmo elegido se aplica aunque el modo sea `--auto`** (pausas con
   `shell sleep` entre respuestas). Nunca empieces a responder sin haber
   cerrado esta pregunta — es lo que impide que un `--auto` se coma el
   examen entero en 4 minutos.
5. Si la entrada trae ya un ritmo explícito (*"pausa de 2 min"*), NO se
   pregunta: se usa ese ritmo directamente (la pregunta solo es obligatoria
   cuando **no** viene indicado).

Cómo pausar sin timers (`execute` no tiene `setTimeout`, V86):

```text
marcar → verificar (:checked) → shell `sleep 120` → siguiente pregunta
```

- Pausa **entre** preguntas, no solo entre páginas (si hay 2/página, dormir
  tras cada una).
- Comprueba que la pausa total cabe en el límite de tiempo del quiz antes de
  empezar: `N` preguntas × pausa ≤ tiempo límite.
- En `semi`, la pausa del usuario **no sustituye** la confirmación con
  `question`: van los dos.

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

Y **si la detección da examen** (o vayas a generar volcados de cualquier modo),
**crea ya** la carpeta de registro de esta sesión:
`resolveLogs/<AAAA-MM-DD>_<dominio>/` en la raíz del proyecto. Escribe ahí
directamente cualquier volcado crudo (`*-find.yml`, snapshot) — así no ensucian la
raíz aunque la sesión termine a medias (ver "Deja el registro de la sesión"). Si
no hay examen y no generas volcados, no crees la carpeta.

## Paso 2 — Lectura completa de la pregunta

**PROHIBICIÓN UNIVERSAL: se contesta EN TIEMPO REAL y en orden, en CUALQUIER
plataforma** (Moodle, NetAcad, Zajuna, Clevry, Dexway, Storyline…). Nunca
hagas una pasada previa por todas las preguntas y luego volver a responder:

- **Aunque la plataforma permita retroceder, no se hace.** Donde no lo
  permite (Zajuna, navegación restringida, expiración) el resultado puede ser
  un intento **roto sin forma de recuperarlo**.
- Cada salto por URL arriesga **perder respuestas sin guardar** (V82), dispara
  `beforeunload` (V87) y **consume el tiempo límite** (en Zajuna esa lectura
  previa se llevó ~10 de 20 minutos).
- Ciclo pregunta a pregunta: **leer → procesar → responder → verificar →
  avanzar**; después, la siguiente. **Nunca "leo todo primero".** Antes de
  empezar solo se mira la **landing** (límite, método, N de preguntas — este
  en el navegador lateral, **sin abrir ninguna página**).

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
| **Opciones con imágenes** | Delegar a `exam-vision` para lectura visual real; R5 solo si la captura falla o no es interpretable (ver `references/audio-y-visual.md`) |
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

### Deja el registro de la sesión (siempre, al cerrar)

La carpeta `resolveLogs/<AAAA-MM-DD>_<dominio>/` se creó en el Paso 1; aquí se
cierra su contenido. Es **archivo**, no se lee al arrancar:

1. Comprueba que ningún volcado quedó suelto en la raíz: mueve los
   `*-find.yml`/snapshots dentro de la carpeta (`/*-find.yml` está en
   `.gitignore` como red de seguridad, no como licencia para dejarlos fuera).
2. Escribe `resolveLogs/…/sesion.md`: URL/fecha, motor detectado, estructura
   observada, resultado real (modo, puntuación) y qué quedó **por confirmar**.
   Sin datos inventados: si no lo anotaste, dilo como pendiente, y
   distingue lo **visto en un volcado** de lo **inferido**.
3. Si apareció un **patrón o motor nuevo**, propón su promoción a
   `references/<motor>.md` + una entrada `V*` en `docs/pruebas-reales.md` — ahí es
   donde queda versionado y de verdad reutilizable.

`resolveLogs/*/*` (volcados crudos) está en `.gitignore`: no ensucian el repo.
**El `sesion.md` sí se versiona** (`!resolveLogs/*/sesion.md`): es el resumen
curado que sobrevive aunque borres los volcados. Los `ref` de accesibilidad de los
volcados cambian en cada sesión: nunca los reutilices como selectores.

## Patrones generales: los que más cuestan

Carga `references/patrones-comunes.md` para matching exacto,
visibilidad, setters, frameworks, temporizadores, modales y
verificación de respuestas. No dupliques aquí sus 10 reglas.

## Dispatcher de motores

Si reconoces alguno de estos fingerprints, **carga el archivo de referencia**
antes de responder: los controles no se comportan como HTML normal y las reglas
genéricas fallan.

| Fingerprint en la página | Carga |
| --- | --- |
| Launch LTI `*.dexway.com/lti/enter`, iframes `content-packages`, botones `Repeat` / `Record voice` / `[title="Next"]`, `voicerecog.cae.net` | `references/dexway.md` |
| `html5/data/js/*.js` con `window.globalProvideData('slide', …)`, `.cs-button`, `slide-object-*`, raíz `#preso`, `window.require` AMD | `references/articulate-storyline.md` |
| URL `/mod/quiz/view.php?id=…` con botón "Intento de cuestionario" y diálogo "Comenzar intento", `/mod/quiz/attempt.php` o `/mod/quiz/summary.php`, bloque "Navegación por el cuestionario" con enlaces `Pregunta N` / "Esta página" / "Terminar intento...", `group "Pregunta N Respuesta"` (interfaz comprobada en español) | `references/moodle.md` |
| URL `sb.clevry.com` / `sb-es.clevry.com` `/Candidate/*.aspx`, `__doPostBack` de ASP.NET, radios iCheck (`iradio_square` / `iCheck-helper`), "Submit Responses", "Iniciar cuestionario" | `references/clevry.md` |
| `www.netacad.com/launch?id=…&tab=curriculum`, Course Outline con `[role=treeitem]`, pestañas `a#Launch-tab-gradebook`, iframe `authoring-resources/index.html?xAPILaunchKey=…`, actividad xAPI `cisco_i2mai_final-exam`, botones "Iniciar" / "Enviar página" / "Enviar todo y terminar", checkbox `#confirm-exam`, insignia Credly | `references/netacad.md` |
| `<audio>`/`<source>`, iframes YouTube, botones "Play audio"/"Listen", markers de transcript, `speechSynthesis` | `references/audio-y-visual.md` |
| Controles por coordenadas, canvas, o preguntas dibujadas como imagen | `references/audio-y-visual.md` |
| Cualquier otro caso | sigue solo con este archivo + `references/patrones-comunes.md` |

## Escalera de estrategias (resumen)

```text
R1 browser_snapshot → R2 browser_find → R3 browser_evaluate / run_code_unsafe
   → R4 visión (screenshot + coordenadas) → R5 reportar bloqueo y parar
```

Sube un escalón solo si el anterior falla. R4 requiere delegar el análisis visual a `exam-vision` cuando el principal no
pueda interpretar capturas. Detalle en `docs/capacidades-playwright.md`.

### Dos reglas de herramienta que evitan cagarla (V86)

1. **Dentro de `{ code }` no hay timers**: `setTimeout`/`setInterval` no
   existen → `ReferenceError`. Si necesitas esperar, usa `shell` con `sleep`.
2. **Un `execute` fallido no deshace el clic que ya hizo.** Un error de
   herramienta **no prueba que la acción no ocurriera**: antes de reintentar,
   lee `location.href` y el estado real del DOM. Los `ref` de un snapshot
   **caducan al navegar** — en acciones repetidas usa selectores estables.

## Condiciones de parada

- La página rechaza automatización o capturas → **R5**: reportar y parar.
- El usuario dice "detener" o confirma "Detener el examen" en modo `semi`.
- Preguntas/opciones ilegibles y sin forma de verificarlas.
- Se detecta proctoring o control de acceso activo: no evadir (AGENTS.md).
- Se acaba el tiempo o el contexto: reporta el punto exacto y cómo reanudar.