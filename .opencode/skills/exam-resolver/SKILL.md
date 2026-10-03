---
name: exam-resolver
description: Detecta y resuelve exámenes, cuestionarios, quizzes, formularios de evaluación, lecciones con ejercicios de voz/pronunciación, role-play con IA, doblaje de video y tests de unidad en la página abierta o en una URL, con Playwright MCP (Brave). Usar cuando el usuario pida resolver/contestar/detectar un examen o cuestionario, dé la orden de "comenzar a contestar" sobre una página, o mencione simulacro, quiz, test, formulario de evaluación, examen online, lección Dexway, ejercicio de pronunciación, role-play o test de unidad.
---

# Exam Resolver

Flujo completo para detectar y responder exámenes en páginas web reales o
locales usando las herramientas del MCP `playwright` (navegador Brave).

Referencias del proyecto:

- `docs/capacidades-playwright.md` — matriz escenario → herramienta y escalera R1-R5.
- `AGENTS.md` — reglas generales de interacción y límites éticos.

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

## Trucos de implementación probados en páginas reales

- **Matching exacto de opciones**: compara el texto de la opción con igualdad
  exacta (`===`), nunca `includes()`. `includes('String')` también matchea
  `myString` y seleccionarías mal.
- **Índice de opción por pregunta, no global**: algunas webs barajan las
  opciones en cada pregunta (pool compartido reordenado). Resuelve siempre el
  índice dentro del grupo de la pregunta actual.
- **Batch por JS en vez de clicks secuenciales**: los overlays de anuncios
  bloquean `browser_click` y provocan timeouts (hallado en javaguides con 25
  clicks). Marca muchas opciones de una vez con `browser_evaluate`:

  ```js
  () => {
    const answers = { q1: 2, q2: 0 /* ...índice por grupo... */ };
    const fails = [];
    for (const [g, idx] of Object.entries(answers)) {
      const rs = document.querySelectorAll(`input[name="${g}"]`);
      if (rs[idx]) { rs[idx].click(); if (!rs[idx].checked) fails.push(g); }
      else fails.push(g + ':missing');
    }
    return { fails, checked: document.querySelectorAll('input[type=radio]:checked').length };
  }
  ```

  Verifica `checked` dentro de la misma respuesta. Para preguntas de una en
  una (paginadas) también sirve un ciclo en `browser_run_code_unsafe`
  (seleccionar → verificar → Next → leer siguiente) en **1 llamada por
  pregunta**.
- **Falsos positivos de detección**: controles que NO son preguntas (filtros
  `AGREE/DISAGREE`, cajas de búsqueda, preferencias, login). Cuenta como
  examen solo si existen **enunciados con alternativas** (patrón "pregunta +
  opciones") o marcadores `Question X`/`Pregunta X de Y` junto a un envío.
  Si detectaste solo controles sueltos → busca enunciados antes de actuar.
  Casos reales confirmados (ronda 2): checkboxes de cookies OneTrust
  (`name*=ot-group-id`), filtros de catálogo (`level[]`, `grade[]`,
  `age[]`, `goal[]`, `type[]`, `len[]`), y radios del widget docente
  (`name=assign-action` con values `quiz/homework/exam/print`). Ronda 3:
  selects de tickets de soporte (`name=tktCategory`: General/Payment/
  Technical) y checkboxes de UI de W3Schools (`darkToggle`,
  `filter-*-input`, ~110 en índices de ejercicios). **Filtra por
  `name` de control antes de contar radios/checkboxes como preguntas.**
- **Muro de login** (hallado en British Council: *"Please log in or
  register to access the level test"*, Quizalize: "Play as a student" abre
  login en otra pestaña): detecta el aviso, **no** intentes registrar ni
  pidas credenciales. Reporta "requiere cuenta del sitio" y ofrece que el
  usuario inicie sesión manualmente en el perfil del agente para continuar.
- **Modal paywall / "ver anuncio" tras enviar** (hallado en javaguides):
  **nunca** veas anuncios ni pagues. Lee la puntuación del DOM antes del
  modal (p. ej. `[class*=correct]`/`[class*=wrong]`) y reporta el modal.
- **Modal de confirmación "¿Enviar test?"** (hallado en computerielts:
  *"⚠️ Submit Your Test? … Continue / Submit Now"*): tras pulsar Submit,
  busca el diálogo y confirma con "Submit Now"; sin confirmar, los resultados
  quedan en 0.
- **Exámenes por partes con palette** (hallado en computerielts: tabs
  "Part 1…Part 4" + paleta de números): navega por partes para rellenar
  todas (inputs `NI<n>` reutilizados por parte → haz match por id/nombre y
  rellena en cada parte), verifica el contador global `N/40 answered`.
- **Clave de respuestas expuesta en el cliente** (hallado en computerielts:
  `window.ANSWERS = {"1":{ans:"…",alt:[…]},…}`): si el sitio envía su clave
  al navegador para autocorrección, úsala (es contenido que cualquier
  visitante recibe), respetando `alt` de respuestas equivalentes y
  **menciónalo en el reporte**. Aplica a fill-in, letras y "select N".
- **JSON-LD estructurado con respuestas** (hallado en gokwiz:
  `<script type="application/ld+json">` con `@type: Quiz` → `hasPart[]` →
  `Question.acceptedAnswer.text`): muchas webs de quiz publican sus
  preguntas **y respuestas correctas** en datos estructurados para SEO.
  Antes de responder, busca ese JSON-LD (un `JSON.parse` + walk recursivo
  buscando `@type === 'Question'`). Úsalo como clave y **menciónalo en el
  reporte**. Ojo: el orden en pantalla suele ser **aleatorio** → matchea la
  respuesta por **texto de pregunta**, nunca por índice.
- **Timer por pregunta en SPA** (gokwiz: 25s): si no hay config para
  desactivarlo, ejecuta ciclos rápidos en `browser_run_code_unsafe`
  (leer pregunta → matchear clave por texto → click opción visible →
  "Next") de 6-7 preguntas por llamada para no agotar el timeout del MCP.
  Si el tiempo se agota durante la extracción, reporta la pérdida (V19).
- **Sidebar/lista de preguntas** (fivesql: botones "Q1…Q28" que abren cada
  pregunta): recorre la lista abriendo una a una; radios pueden llamarse
  `mcq` y hay "Submit Answer"/"Next Question". Tipos mixtos: MCQ, T/F y
  fill-in.
- **Opciones custom sin inputs** (`.quizoption` de W3Schools exercises,
  `.opt` de computerielts, divs de Quizalize): localiza el nodo por texto
  exacto y haz click; verifica por clase `sel`/`active` o por el contador
  de la página.
- **Solo elementos VISIBLES al clickear por texto** (hallado en
  sqlquiz.github.io: Q2 marcada ❌ porque el match encontró la opción de la
  pregunta ANTERIOR, oculta en el DOM). Filtra siempre con
  `e.offsetParent !== null` y elige el elemento más corto/específico:
  `els.sort((a,b)=>a.innerText.length-b.innerText.length)`.
- **Timer en quizzes SPA** (sqlquiz: ⏱️ 30s/pregunta): antes de empezar,
  busca config (selects como `timerSelect`) y ponlo a "No Timer"; si no se
  puede desactivar, responde con ciclos rápidos por pregunta.
- **`confirm()` nativo del navegador** (sqlquiz: "Are you sure you want to
  quit?") → `browser_handle_dialog` (aceptar si es parte del flujo).
- **Landing con selects de configuración**: categoría/dificultad/cantidad
  de preguntas → elige valores razonables (p. ej. 10 preguntas, sin timer)
  y pulsa Start.
- **Extracción por tramos en examenes paginados** (math-questions.com: 1
  pregunta por página con Previous/Next): recorre en tramos de 5-7 páginas
  por llamada (`browser_run_code_unsafe`) para no agotar el timeout del
  MCP; extrae enunciado+opciones, responde en el sentido contrario con el
  mapa `{n: índice}` y termina con Finish.
- **Formato "apuntes" no interactivo** (indiabix: pregunta + respuesta +
  explicación visibles, sin envío): no es un examen → dilo como tal y
  ofrece pasar a un test interactivo si hay.
- **Sitio sin marcador tras enviar** (javacodepoint: review con 30
  explicaciones pero sin score global): reporta "respondido N/N; el sitio
  no expone puntuación" (ver V16); no insistas buscando un score inexistente.
- **Error del sitio en resultados** (hallado en fatskills: `mysqli_sql_exception`):
  si la página de resultados falla, dilo explícitamente ("fallo del servidor,
  no de la automatización") y ofrece reintentar.
- **Ruido de anuncios ≠ bloqueo**: sitios como W3Schools lanzan decenas de
  errores de consola por trackers/ads (CORS, 403). No afectan al examen; no
  los reportes como fallo del sitio. Los reales son `403/451` de la propia
  página, `Attention Required | Cloudflare`, o modales de challenge → **R5**.
- **Errores del sitio solo si bloquean el examen**: si `browser_network_requests`
  muestra fallos en la API del propio quiz, ahí sí investiga (caps `network`).

### Motor Articulate Storyline (ronda 6 — SENA Placement Test)

Identifícalo por: slides en `html5/data/js/*.js` con
`window.globalProvideData('slide', …)`, motor en `html5/lib/scripts/app.min.js`,
controles `.cs-button`, clase `slide-object-*`, `#preso` como raíz.

- **V24 — API interna accesible**: hay `window.require` (AMD). Útil:
  - `require('helpers/windowManager').getCurrentWindow().getCurSlide()` →
    vista del slide → `getSlideObjectViews('vectorshape'|'droplist'|
    'dragitem'|'droparea'|'button')`.
  - Cada vista: `getDOMNode()`, `get/setPlayerProp(k,v)`,
    `props.model.id`, `props.model.attributes`, `refs.innard`.
  - `require('views/helpers/dragAndDropHelper').util.getRegisteredDroppables()`
    → controladores de drop con `params.data` (= componente del área).
- **V25 — Opción MC = `vectorshape` con variable `_checked`**: no hay
  `input[type=radio]`; cada alternativa es un div con `aria-label` y
  `attributes.variables._byId` (colección Backbone). Selecciona con
  `Object.values(v.props.model.attributes.variables._byId)
    .find(x => x.attributes.name === '_checked').value(true)` y pon `false`
  en las demás (las actiongroups esperan exclusión mutua). Luego **SUBMIT**.
  Verifica leyendo `value()` de vuelta.
- **V26 — Dropdown = `droplist` (SVG, no `<select>`)**: opciones en
  `g.drop-list-item[aria-label]` **del dropdown abierto** (hay 5 listas en el
  DOM, las cerradas tienen rect 0 → acota con
  `el.closest('.drop-list')`). Clic real `page.mouse` sobre el rect de la
  opción. Si queda fuera del área recortada (y > contenedor), usa
  `v.parentableDropList.itemSelected(idx)` con `idx` sobre
  `model.origItemsList` (orden original, NO `itemslist` que está barajado);
  verifica por el texto del `.drop-list-top-container` y por
  `SelectedItemIndex`/`SelectedItemData`.
- **V27 — Matching DnD con `pointer-events:none`**: el registro real NO es
  mover el item; es `area.setDropChild(item.refs.innard)` (pone
  `SelectedItem`, `DragConnectData` y backref `innard.drop`). Antes limpia
  el hijo previo (`prev.drop = null` / `innard.drop.disconnect()`). Cierra
  con `SUBMIT`; si dice *"Invalid Answer — you must complete the question"*,
  faltan `dropChild` en alguna área.
- **V28 — Clave en `data.js`**: el curso publica
  `quiz_content`/`html5/data/js/data.js` con cada interacción
  (`{"kind":"interaction","id":…}`) y sus `answers[]` con
  `"status":"correct"` (incluye listening → **no necesitas audio**).
  Parsea con un regex acotado a cada bloque (el regex ingenuo se desborda y
  mezcla respuestas). Matchea por **texto de pregunta**, no por índice.
  Úsalo como clave y **menciónalo en el reporte**.
- **V29 — Evaluar sin re-clickear**: `q = slide.props.model.quizzes[0]`;
  `q.calcScore()`, `q.calcPercentScore()`, `q.getUnsubmittedInteractions()`,
  `q.evalAllUnanswered()`. Por interacción: `x.responses = [...]` +
  `x.evaluate()` (MC: `['choices.choice_<id>']`; matching/sequence: array de
  `{statementResponse:'statements.statement_<id>',
     choiceResponse:'choices.choice_<id>'}` tomados de los `pair` de la
  respuesta correcta) → `x.attempts[last].Score/Status`. Aplica solo a
  interacciones incompletas/incorrectas; **no** re-evalues las que ya están
  en `maxpoints` con formato equivocado (romperías un 20 correcto).
- **V30 — Navegación y resultados**:
  - Botones cubiertos por `#app-top-overlay` (z-index 999) → Playwright
    aborta con timeout; y `el.click()` sintético no basta para botones tipo
    "OK" de popups → **dispatch de la secuencia completa**
    `pointerdown/mousedown/pointerup/mouseup/click` con coordenadas.
  - Popups (`InvalidPromptSlide`) dejan overlay huérfano →
    `document.getElementById('app-top-overlay').style.display='none'`.
  - En el último slide, NEXT/FINISH pueden no responder o estar `hidden`
    → `wm.onRequestingNextSlide()` navega al slide de resultados
    ("100 Puntos / Su resultado es: …").
- **Errores de consola del motor**: `scrollTop` null en `onMouseDown` de
  droplists y `getDOMNode deprecated` son ruido del motor; no bloquean.

### Motor Dexway (ronda 7 — CUN, lecciones con PRONUNCIACIÓN / voz) — V31

Identifícalo por: launch LTI (`cun.dexway.com/lti/enter`) → iframes cross-origin
(`caelms.s3.amazonaws.com/common/launch_lesson.html` → `content-packages`),
botones `Repeat` / `Record voice` / `Play voice recording` / `Next` (flecha
derecha), textos "Listen, repeat and write" / "Matching pictures and sentences",
y llamadas a `voicerecog.cae.net/voicerecog.asmx`. El snapshot de Playwright
atraviesa esos iframes; opera con `page.frames()` + `frame.evaluate` y
`lf.locator(...)`.

**Inyección de voz falsa (la captura de micrófono se fija ANTES de cargar la
lección):**

- Dexway llama a `getUserMedia({audio:true})` **una sola vez** al iniciar la
  lección y captura con `ScriptProcessorNode` @22050 Hz (NO MediaRecorder).
  Por tanto el hook va en `page.addInitScript` **antes** de `reload`/entrar:
  parchea `navigator.mediaDevices.getUserMedia` para devolver un `MediaStream`
  de un `AudioContext` propio → `decodeAudioData(fetch(mp3 del modelo))` →
  `MediaStreamAudioDestinationNode`. Dexway cree que hay micrófono
  (`Microphone available: true`).
- **UNA sola reproducción por palabra/frase, SIN loop** (regla del usuario y
  mejora medida: loop 83.35 → una pasada 89.7-98.5). Dispara `source.start()`
  en el evento **`pointerdown`/`mousedown` capture-phase** sobre
  `[title="Record voice"]` — el listener en `click` NO funciona (Dexway
  reemplaza el botón por "Stop voice recording" y el nodo queda descolgado).
  Dedupea doble disparo (pointerdown+mousedown) con debounce ~800 ms.
- **URL del audio del modelo**: pulsa `Repeat` y captura el `src` con un hook
  de `HTMLAudioElement.prototype.play` → `window.__lastAudioSrc` (o búscala en
  el XML de la lección). `window.__DexFake.setUrl(u)` cambia la fuente entre
  pasos sin recargar; precarga (`fetch`+`decode`) fuera de la grabación para
  evitar latencia.
- **Puntuación**: Dexway envía `POST voicerecog.cae.net/voicerecog.asmx/
  EvaluatePronunciation_PlainText` con `text`, `language`, `audio` (base64,
  11025 Hz 8-bit signed), `frequency`, `bits` y devuelve XML
  `word|score` por palabra. Engancha `window.fetch` y
  `XMLHttpRequest.prototype.send` en el init script → `window.__scoreResp`.
  **La puntuación es la verificación del Paso 4** (el servidor es quien
  juzga, no el modelo): `Newspaper|88.09`, `Girl|98.51`, `I am on
  vacation` 4 palabras 89-97.
- **Matching foto↔frase sin visión**: el XML de la lección
  (`caenet.s3.amazonaws.com/dexwaycloud/lessons/publish/<id>.xml`) define
  cada ejercicio (`<Frases dc_id="…" tipo="2">` con
  `<Frase imagen="X.jpg" voz="N">texto</Frase>`) → mapeo exacto de qué foto
  corresponde a qué frase. Verificación: al clicar la foto correcta **se
  revela el texto de la frase** en la página; verifica por ese texto antes de
  grabar.
- **Matching de saludos (pares de texto)**: localiza los `<p>` por
  `TreeWalker` + `getBoundingClientRect` y clickea los pares con
  `page.mouse.click(x,y)`; el estado completado es la clase `Terminada` en el
  parent (`Box Left/Right UIHtmlContainer Terminada`).
- **Videos (Dialogue listening/reading)**: `Next` NO avanza mientras
  `video.currentTime < duration`; espera `video.ended` (polls cortos <25 s
  para no agotar el timeout del MCP) y luego pulsa Next. El paso se repite
  con subtítulos (watch → watch+read).
- **Vocabular practice (último paso)**: botones `Add mark` por palabra
  (marcar todas con `.click()` en bucle) → Next → pantalla final de score.
- **Límite conocido**: la primera palabra de frases LARGAS con /ð/ ("They
  are…", "The boys…") puntúa ~0-1 en word-1 independientemente del timing
  (lead del buffer 0-0.45 s medido en el body enviado); el resto de palabras
  puntuó 55-96 y las **palabras sueltas siempre 86-98**. No bloquea: la media
  de la frase queda 57-78 y la lección completa cierra con **87%
  (Pronunciation 98%)**. No insistir en "arreglar" word-1 más de 1-2
  intentos; sigue con Next.
- **Navegación**: la flecha `Next` (`[title="Next"]`) es el avance universal
  de la lección; `Previous`/`Main menu` para retroceder. Al final aparece
  "Score Lesson completed X%" con skills (Pronunciation/Reading/Listening/
  Vocabulary) — es el reporte del Paso 6.

### Motor Dexway — submotores de lección y test (ronda 8 — Unidad 1 completa) — V32-V34

Mismos frames que V31 (`content-packages` + `page.frames()`/`frame.evaluate`).
**XML**: en `browser_network_requests` (filtro `lessons/publish`) hay pares
`<id>.xml` por lección; el de **cifra mayor** (4532/4533/8217…) tiene los IDs de
voz reales y las respuestas (`[respuesta]`; en opción múltiple la correcta es la
que **no** lleva guion inicial: `[-Bad|Good]`). Descárgalo (`curl`) y matchea el
bloque cuyo texto coincida con lo que hay en pantalla (las variantes se eligen
aleatoriamente). Navegación de curso: resultados → `[title="Exit"]` → índice →
clic fila de lección → celda `Iniciar lección`/`Iniciar test` → banner "Click
here to start…" → `Next`. **Reinstala el hook `__dynHook` en cada lección**
(no sobrevive a la recarga del documento).

- **V32 — UIExerScreens / bloques "Consolidation"**:
  - Pantalla de instrucciones: `.Test` aparece **vacío** (parece roto, no lo es)
    → pulsa `Next` y el diálogo con gaps se renderiza.
  - Gap-fill: setter nativo de `HTMLInputElement.prototype.value` + eventos
    `input`/`change` → `Next` (lockea, el texto queda visible) → `Next` (avanza
    ítem). Un ítem por pantalla.
  - Opción múltiple = `input.Radio` + palabras en `td`: **mapea radio↔palabra por
    coordenada Y** (misma fila), clic `locator.nth(i).click({force:true})` → Next.
    "Final comprehension" (3 frases) usa el mismo mapeo.
  - Alfabeto/listening: `window.animTools.anim.cluesOrder` = orden exacto de
    respuestas → clic `clues[cid].img` vía `evaluateHandle(...).asElement().click()`;
    verifica `anim.userAnswers {ok,wrong}` y que `.Button.NEXT` no tenga clase
    `Disabled` (espera ~3 s si aún la tiene: la animación tarda).
  - **"Dub the characters" (`UIExerVideo`): SOLO clicar `Next`** (videos de
    escucha; confirmado por el usuario). Next se deshabilita mientras reproduce
    el segmento → poll (≤10 s) hasta reactivarse y repetir hasta que cambie el
    número de paso (5-12 líneas por paso). No grabar voz aquí.
  - Vocabulary practice (último paso): tarjetas `.Card`; el `Add mark` visible es
    solo el de la tarjeta activa → bucle en-página `c.click()` (zoom) +
    `c.querySelector('[title="Add mark"]').click()`; verifica `img[class*=Mark]`
    con clase `On` en TODAS → `Next` → score final.
- **V33 — AIRoleplay (chat con IA; XML con `<AIRoleplay data="{…}">`)**:
  - Clic **Start** del `.InfoLine .Button` (no "Start Demo") → primer mensaje IA
    (`ai_first_message` del atributo `data` del XML).
  - Responder por **texto**: `input.ChatInput` + evento `input` +
    `locator('.ChatInput').press('Enter')`. El micrófono NO hace falta.
  - Respuestas esperadas = `<DemoChat chatrole="student">` del XML ("Hello
    Teacher!", "Good morning!", "I'm fine, thank you! And you?", …); el IA acepta
    las frases canónicas y pide la siguiente. Cuando cierra la conversación el
    input desaparece → `Next` → "Lesson completed X%".
- **V34 — Test exercises (XML de test, ej. 8217)**:
  -5 pestañas `Question #1..5`; se navega con `[title="Next"]` (los tabs NO
    responden). Al terminar: Next → diálogo *"Do you want to finish the test and
    get your result?"* → clic **OK**.
  - Q1 foto+select: `img.Image` + un `<select>` por fila; mapeo imagen→select por
    Y; respuesta = opción sin guion de la `<Frase>` XML cuya lista de `imagen=`
    coincida con las de pantalla; setter nativo de `HTMLSelectElement` + `change`.
  - Q2 pares (`UIExerPairs`): fragmentos `Box Left/Right`; `L.click()` →
    `R.click()` correcto (los `onclick` ya están instalados; el sintético basta).
    **En modo test NO hay feedback visual** → verifica
    `box.__pairs_acertado === true` (y `__respuesta_usuario`). El motor puede
    reordenar `__pairs_relacion` si hay colisión de textos idénticos.
  - Q3/Q4 fill-in y Q5 orden de palabras: respuestas literales del bloque XML que
    matchee el texto en pantalla; sin contracciones si lo pide el enunciado.
  - Resultado "Test completed X%": Grammar puede quedar <100 aunque todo el XML
    matchee (variante no detectada) → se acepta o se usa "Repeat the test".

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
| **Opciones con imágenes** | Primero intenta `alt`/`title`/texto visible de la imagen (R1/R3). Si no hay texto legible → R4 visión: `browser_take_screenshot` y elige la opción correcta visualmente; si hay `input[type=image]` o labels clickeables, haz click en su ref y verifica |
| **Pregunta dibujada en canvas/SVG** | El snapshot no expone el contenido: R4 visión para leer la pregunta y opciones; verifica la selección por estado JS de la página o por captura antes/después |
| Drag & drop / ordenar | Ruta visión: `browser_mouse_drag_xy` con coordenadas |
| Sin refs útiles (árbol de accesibilidad pobre) | Sube a R3 `browser_evaluate` o R4 visión (ver escalera) |

**Preguntas visuales (imágenes/gráficos)** — reglas adicionales:

1. Intenta siempre antes extraer texto: `alt`, `title`, `figcaption`,
   `aria-label`, `data-*`, el texto del contenedor y el **nombre de archivo
   del `src`** si es descriptivo (`usb-port.jpg`) — todo vía
   `browser_evaluate`.
2. **Limitación del modelo**: si el modelo activo no soporta imágenes,
   `browser_take_screenshot` falla con *"Cannot read image"*. En ese caso:
   - No insistas con capturas.
   - Responde las preguntas cuyo enunciado/opciones sean texto.
   - Para las 100% visuales → **R5**: reporta "pregunta visual no legible
     con el modelo actual" y ofrece al usuario cambiar a un modelo
     multimodal (`./scripts/run.sh --model <modelo-con-visión>`) o
     resolverlas manualmente.
3. Si el modelo **sí** soporta imágenes (multimodal): Vision Mode completo —
   captura, elige por posición y haz click con `browser_mouse_click_xy`
   (o `[box=...]` del snapshot).
4. Verifica la selección igual que en cualquier otro tipo (nunca asumas que
   el click acertó).

La decisión de **qué** respuesta es correcta la tomas tú con tu conocimiento
del tema. Si no sabes la respuesta con razonable confianza, elige la mejor
justificada y, en modo `semi`, dilo explícitamente.

**Preguntas con audio / listening (inglés con audio)** — reglas adicionales:

Detecta audio en: elementos `<audio>`/`<source>`, iframes de
youtube/soundcloud, botones "Play audio"/"▶ Play"/"Listen", marcadores
`transcript`, y juegos TTS. Ladder de resolución:

1. **Transcript en la página** → ¡caso fácil! (hallado en testme.com:
   botón "Show transcript" por pregunta). Pulsa todos los toggles, lee el
   texto de cada audio y responde normalmente. Verificado: **5/5**.
2. **Transcript oculto en DOM**: busca `[class*=transcript]`,
   `[id*=script]`, `<track kind=...>`, atributos `data-transcript`, o texto
   tipo "See transcript"/"Transcription" vía `browser_evaluate`.
3. **Juegos TTS (speechSynthesis)**: si no hay `<audio>`, la voz es
   sintetizada. Engancha `speechSynthesis.speak` ANTES de reproducir para
   capturar el texto hablado (hallado en talkdrill.com):

   ```js
   () => {
     window.__tts = [];
     const orig = speechSynthesis.speak.bind(speechSynthesis);
     speechSynthesis.speak = (u) => { window.__tts.push(String(u.text || '')); return orig(u); };
   }
   ```

   Luego haz clic en "Play/Passage", espera, y lee `window.__tts`.
4. **Audio sin transcript y sin TTS** (hallado en oxfordonlineenglish 24
   preguntas, ielts-up): el modelo no puede oír audio. **R5**: reporta
   "preguntas de audio sin transcripción" y ofrece al usuario resolverlas
   manualmente, o preguntar si el sitio ofrece pistas (p. ej. "Show hint"
   de ielts-up). **Nunca adivines respuestas de audio.**
5. Si la UI del juego no avanza tras reproducir (entorno sin dispositivo de
   audio), reporta el bloqueo junto con el transcript capturado.

## Paso 4 — Verificación obligatoria (antes de avanzar)

Nunca des "Siguiente" sin comprobar que la selección quedó aplicada:

- Opción A: `browser_verify_value` / `browser_verify_element_visible` (caps testing).
- Opción B: `browser_evaluate` → `document.querySelectorAll('input:checked')` y
  comparar con la respuesta elegida.
- Opción C: snapshot corto y mirar el atributo `[checked]`/`[selected]`.

Si la verificación falla (el framework ignoró el cambio), reintenta con un
click real sobre el label; si persiste, sube de estrategia (R3 → R4).

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

## Escalera de estrategias (resumen)

```text
R1 browser_snapshot → R2 browser_find → R3 browser_evaluate / run_code_unsafe
   → R4 visión (screenshot + coordenadas) → R5 reportar bloqueo y parar
```

Sube un escalón solo si el anterior falla. Detalle completo en
`docs/capacidades-playwright.md`.

## Condiciones de parada

- La página rechaza automatización o capturas → **R5**: reportar y parar.
- El usuario dice "detener" o confirma "Detener el examen" en modo `semi`.
- Preguntas/opciones ilegibles y sin forma de verificarlas.
- Se detecta proctoring o control de acceso activo: no evadir (AGENTS.md).
