# Pruebas con páginas reales

Registro de ejecuciones del agente contra sitios externos. Entorno: OpenCode +
`zen-proxy/mimo-v2.6-flash-free` + Playwright MCP 0.0.83 (todas las caps) +
Brave con perfil `runtime/brave-profile/`.

**Herramienta de escaneo**: `node scripts/recon.mjs docs/urls-recon.txt`
(reconocimiento estructural headless, no interactúa). Salida:
`runtime/recon-output.json`. Ronda 2 (con detección de audio/media):

```bash
node scripts/recon.mjs docs/urls-recon-r2.txt runtime/recon-r2-output.json
```

## Resumen global

- **Ronda 1 — 29 URLs escaneadas**: 7 EXAMEN, 8 POSIBLE (landings con
  Start), 12 sin examen, 1 bloqueo Cloudflare, 1 error DNS.
- **Ronda 2 — 30 URLs nuevas escaneadas** (10 con audio/listening, 11 tech,
  9 plataformas): **4 EXAMEN+AUDIO**, 4 EXAMEN, 6 POSIBLE, 15 sin examen,
  1 error DNS.
- **Ronda 3 — 23 URLs nuevas escaneadas** (IELTS/transcript, trivia,
  ejercicios, español): 4 EXAMEN, 5 POSIBLE, 1 bloqueo challenge, 10 sin
  examen, 3 error DNS.
- **Ronda 4 — 24 URLs nuevas escaneadas** (SQL/BD, matemáticas/estadística,
  aptitud/entrevistas, redes, inglés): 6 EXAMEN, 6 POSIBLE, 11 sin examen,
  1 error certificado.
- **Ronda 6 — 14 URLs nuevas escaneadas** (CUN/SENA/Colombia + tech):
  2 EXAMEN, 2 POSIBLE, 1 POSIBLE+AUDIO, 8 sin examen, 1 timeout.
  Total acumulado: **120 URLs**.
- **Ronda 7 — Dexway CUN (lección con pronunciación/voz)**: sin recon nuevo
  (página autenticada por sesión); ensayo profundo del motor de voz.
- **Ronda 8 — Dexway CUN, Unidad 1 COMPLETA** (sin recon nuevo): lecciones
  People, Introducing yourself, Role-play y el Test exercises con los
  submotores V32-V34; Unidad 1 cerrada 5/5 (ver detalle más abajo).
- **Ronda 9 — Dexway CUN, Unidad 2 (parcial)** (sin recon nuevo): lección
  "How old are you?" completada al 100% tras caducar la sesión; hallazgos
  V35-V38 (saltar vídeo, micrófono silencioso, `UIExerPairs` clic-clic y
  reanudación server-side).
- **Ronda 10 — Dexway CUN, Unidad 2 COMPLETA** (sin recon nuevo): "How are the
  children?", "Happy birthday!", "Mediation: Introducing your friends"
  (writing assignment) y "Test exercises" con los submotores V39-V48;
  Unidad 2 cerrada **5/5** (ver detalle más abajo).
- **Ronda 11 — Dexway CUN, Unidad 3 (parcial)** (sin recon nuevo): "Meeting new
  people" completada al 84% (Progreso 47% → 52%) y "Where I'm from" en curso,
  con los hallazgos V49-V56 (`addInitScript`, `UIExerImageIdentification`,
  showroom con clic real, `img.Radio`, driver `window.__auto`); mapa completo
  del curso leído del índice.
- **Ronda 12 — Dexway CUN, Unidad 3 "Where I'm from" (en curso)** (sin recon
  nuevo): 3 reglas duras de seguridad (V57-V59) y los hallazgos V60-V69
  (diccionario popup, ítem ya resuelto, las dos plantillas de oraciones,
  interrogativos por respuesta, clic real en radios, selección de frame,
  lectura del sujeto con `childNodes`, forma larga/corta de *to be*). Incluye
  el registro de **errores del agente** y qué corregir en cada caso.
- **43 páginas/flujo probados en profundidad** (11 r1 + 7 r2 + 2 r3 + 4 r4
  + 2 r5 + 5 r6 + 1 r7 + 3 r8 + 1 r9 + 4 r10 + 2 r11 + 1 r12) y **4 modos de
  disparo validados**: `auto`, `semi`
  (confirmación con `question`), pestaña activa (`browser_tabs`) y URL
  (`resolve.sh` con guardia de perfil).
- Hallazgos **V1-V69**.
- Fecha: 2026-10-03.

### Ronda 6 — CUN / SENA / Colombia (2026-10-03)

| # | Página | Tipo detectado | Estrategia | Resultado |
|---|--------|----------------|-----------|-----------|
| 27 | `ejecucionformacion.sena.edu.co/placement_test/` (SENA Placement Test, 49 interacciones / 300 pts, 45 min) | Articulate Storyline: matching DnD + droplists SVG + MC `vectorshape` + listening (22 slides de audio) | **V24-V30**: API AMD interna (`require('helpers/windowManager')`), `setDropChild`, `_checked`, `itemSelected`, **clave en `data.js`** (`answers[].status:"correct"` → incluye listening sin oír audio), `responses`+`evaluate()`, `onRequestingNextSlide()` | ✅ **100/300 → 100 Puntos — 100%** en pantalla de resultados (grammar 21/21, matching 5/5, sequence 5/5, reading 10/10, listening 15/15) |
| 28 | `es.open-exam-prep.com/practica/examen-unal-colombia` (UNAL, 200 preg) | Quiz SPA con botones-options, iframe de anuncio tapando "Siguiente" | V18b: clave embebida en HTML (JSON escapado) + JS click | ✅ **198/200 — 99% "Buen resultado"** |
| 29 | `prepmaster-paa.vercel.app` (PAA College Board — usado para admisión CUN) | Static pages con `onclick` inline / array global de respuestas | V20 (`check(this,ans,...)`) y V21 (`window.__QUESTIONS` + Enter) | ✅ **60/60 Fracciones** y **800/800 Diagnóstico Matemáticas (55/55)** |
| 30 | `certification-exam.com/.../1z0-808-questions/quiz.html` (Java SE 8 — catálogo certification-questions) | Quiz con botón "Show Answer" que revela la clave | V22: leer `Right Answer: X` y seleccionar por texto | ✅ **10/10** |
| 31 | `simuladorpruebasena.web.app` | 25 imágenes sin `alt`, preguntas figurales | V1: modelo sin visión | ⛔ **R5 documentado** (no adivinar) |

Ronda 6 (recon, 14 URLs en `docs/urls-recon-r5.txt`): 2 EXAMEN, 2 POSIBLE,
1 POSIBLE+AUDIO, 8 sin examen, 1 timeout. **Total acumulado: 120 URLs.**
Detalle del hallazgo V24-V30 en el skill (sección "Motor Articulate
Storyline").

### Ronda 7 — Dexway CUN: lección "Greetings" con pronunciación (2026-10-03)

| # | Página | Tipo detectado | Estrategia | Resultado |
|---|--------|----------------|-----------|-----------|
| 32 | `cun.dexway.com/lti/enter` (lección Greetings, 26 pasos, curso CUN Virtual English A1) | LTI → iframes S3; **grabación de voz** (`getUserMedia` + ScriptProcessor 22050 Hz → `voicerecog.cae.net/EvaluatePronunciation_PlainText`), matching foto↔frase, matchings de saludos, 3 videos, vocab practice | **V31**: init script con `getUserMedia` falso (mp3 del modelo → `MediaStreamAudioDestinationNode`), **una sola reproducción sin loop** disparada en `pointerdown` de `Record voice`, URL por hook de `HTMLAudioElement.play` + `setUrl()`, score capturado con hooks fetch/XHR, mapeo frase↔foto desde `lessons/publish/<id>.xml`, pares por coordenadas + clase `Terminada`, videos con espera a `video.ended` | ✅ **26/26 pasos → "Lesson completed 87%"** (Pronunciation **98%**, Reading 100%, Listening 75%, Vocabulary 75%) |

Detalle V31 en el skill (sección "Motor Dexway"). Datos de la lección:

- **Palabras sueltas** (una reproducción): Teacher 89.7, Boy 94.4, Newspaper
  88.1, Student 86.3, **Girl 98.5**, Book 88.3, Tourists 86.2, Bus 88.0.
- **Frases** (una reproducción): You are hungry 92.2, I am Spanish 86.2, We
  are American 83.8, **I am on vacation 93.2**, You are tall 91.3, I am short
  88.9.
- **Matching fotos**: 8 fotos acertadas (6 al primer clic, 2 tras probar);
  frases 57.9-78.2 (word-1 /ð/ es el límite, ver V31).
- **Matchings de saludos** (13/19/25): 12/12 pares en "Terminada".
- **A/B de loop**: con el mp3 en loop la palabra "Teacher" obtuvo 83.35;
  **sin loop (una sola vez) subió a 89.7** y después 86-98 en todas —
  confirmado por el usuario: "si solo dice una palabra, una sola vez".

### Ronda 5 (pendientes r4: gokwiz, fivesql)

| # | Página | Tipo detectado | Estrategia | Resultado |
|---|--------|----------------|-----------|-----------|
| 25 | `gokwiz.com/quiz/statistics-and-probability` (20 Q) | Landing "Start Quiz" → SPA con timer 25s/preg y orden aleatorio | **JSON-LD** (`acceptedAnswer`) como clave + loops rápidos por texto | ✅ **19/20 — 95%** (Q1 perdida por timeout durante la extracción) |
| 26 | `fivesql.com/quiz.html` (28+ Q mixtas) | Sidebar de preguntas Q1-Q28 + radio `mcq` + Submit/Next | Apertura por pregunta; selección y verificación | ✅ mecánica resuelta (MCQ + T/F + fill-in); navegación por sidebar confirmada |

## Resultados de las pruebas en profundidad

### Ronda 1

| # | Página | Tipo detectado | Estrategia | Resultado |
|---|--------|----------------|-----------|-----------|
| 1 | `w3schools.com/quiztest/...qtest=JAVA` | Radio paginado 25 (landing + Start) | R1 + R3 batch | **25/25 — 100%** |
| 2 | `javainuse.com/quiz/boot` (Spring Boot) | 35 radios, todo en 1 página, "Check Answer" | R3 extract-all + batch | **34/35** (su clave difiere en 1) |
| 3 | `javaguides.net/...spring-boot-online-test.html` | 25 radios + Submit | R3 batch JS-click | **25/25** (clases `correct`) |
| 4 | `proprofs.com/...test_5458` (puertos/conectores) | 17 radios **con imagen en el enunciado** | R1 para opciones; imagen → **R5** (ver hallazgo V1) | Parcial: estructura resuelta, preguntas visuales no legibles con el modelo actual |
| 5 | `mymcqs.net/mcqs/computer-graphics-mcqs/` | 21 checkbox — **falso positivo** | Detección | Filtros de UI (`AGREE/DISAGREE`, search), no examen |
| 6 | `tutorialspoint.com/spring/spring_online_test.htm` | "Test" legado | Detección | **Sin examen**: solo tutorial + 60 iframes de ads |
| 7 | `sanfoundry.com/java-questions-answers-101-200/` | Bloqueo | **R5** | Cloudflare 403 "Attention Required" → reportado, sin evadir |
| 8 | `fatskills.com/...ports-and-connectors-devices-cables` | 25 radios, opciones barajadas, mezcla texto+imagen | R3 | Selección OK; **página de resultados rota** (error PHP/MySQL del sitio) |
| 9 | `tutorialspoint.com/java/java_online_quiz.htm` | Detección negativa | — | Ya no es quiz (control) |
| 10 | `indiabix.com/java/questions/` | Detección negativa | — | Índice de categorías, no test |
| 11 | `quizlet.com/...flash-cards/` | Control negativo | — | Flashcards, correctamente clasificado como no-examen |

### Ronda 2 (audio/listening + motores nuevos)

| # | Página | Tipo detectado | Estrategia | Resultado |
|---|--------|----------------|-----------|-----------|
| 12 | `testme.com/english-listening-test` | 5 radios + **audio TTS con "Show transcript"** | Transcript → responder | **5/5 — 100%** (ver V9) |
| 13 | `oxfordonlineenglish.com/english-level-test/listening` | 24 grupos (96 radios) + 6 MP3, **sin transcript** | R5 | Audio no transcribible con el modelo → reportado (V10) |
| 14 | `ielts-up.com/listening/multiple-choice.html` | 5 grupos + MP3, sin transcript, "Show hint" | R5 | Enunciados legibles, respuesta requiere audio → reportado (V10) |
| 15 | `7esl.com/listening/` | 37 checkboxes — **falso positivo** | Detección | Filtros de catálogo (`level[]`, `grade[]`, `age[]`); hub de escenas (V11) |
| 16 | `learnenglish.britishcouncil.org` (A1 + level test) | 14 checkboxes — **falso positivo**; test con login | Detección | Checkboxes = cookies OneTrust; "Please log in or register" → muro de login (V11/V12) |
| 17 | `resources.quizalize.com/...networking-tools` | Vista teacher con 20 preguntas legibles | Lectura OK; juego requiere cuenta | "Play as a student" → abre login en otra pestaña → reportado (V12); radios = widget `assign-action` (V11) |
| 18 | `talkdrill.com/games/listening-quiz/` | Juego de audio **TTS (speechSynthesis)**, sin `<audio>` | R3 hook de `speak` → transcript capturado | Transcripción completa obtenida (10 utterances); la UI no avanza sin dispositivo de audio → reportado con transcript (V13) |

### Ronda 3 (modos + motores nuevos)

| # | Página | Tipo detectado | Estrategia | Resultado |
|---|--------|----------------|-----------|-----------|
| 19 | `computerielts.com/...practice-test-1/` | **Modo auto**: landing → Start → test paginado por partes (palette), fill-in `NI<n>`, widget "Select 2", MCQ custom `.opt`, submit con confirmación | R3 + clave en cliente (`window.ANSWERS`) | **40/40 — Band 9.0 (100%)** (V14) |
| 20 | `testme.com/english-listening-test` | **Modo semi**: 5 preguntas con transcript | Protocolo de confirmación (`question`) + verificación | **5/5** — flujo semi validado de punta a punta |
| — | `w3schools.com/python/exercise.asp?...` | Índice con 110 checkboxes (**UI**, V15) → ejercicio real con `.quizoption` custom | R3 click por texto + Submit | **3/3 "Congratulations"** (nuevo motor) |
| — | Pestaña activa (`browser_tabs`) | `--current` | Detección sobre la pestaña activa | ✅ listado y operación sobre tab activa verificados |

### Ronda 4 (SQL/BD, estadística, aptitud)

| # | Página | Tipo detectado | Estrategia | Resultado |
|---|--------|----------------|-----------|-----------|
| 21 | `javacodepoint.com/quizzes/sql-quiz-...` (SQL 30 Q) | 30 grupos de radios + botón "See Result" | R3 extract-all + batch | **30/30 respondidas**; review con 30 explicaciones; el sitio **no expone score global** (V16) |
| 22 | `math-questions.com/...statistics-practice-test.php` (20 Q) | Landing "Start Test" → **1 pregunta/página** (Previous/Next/Finish) | Extracción por tramos + respuesta inversa + Finish | ✅ **20/20 — 100% Correct** |
| 23 | `sqlquiz.github.io` (SPA SQL, config selects) | Landing con selects (categoría/dificultad/cantidad/timer) + Start; quiz con opciones custom y timer | Config "No Timer" + clicks por texto **solo visibles** | ✅ **90% (9/10)** — 1 fallo por clic en opción oculta (V17, corregido) |
| 24 | `indiabix.com/aptitude/average/` | Preguntas + respuestas + explicación **visibles**, sin envío | Detección | Formato apuntes → no es examen interactivo |

## Hallazgos (cosas "extrañas" encontradas y cómo las superamos)

### V1 — El modelo actual no puede LEER imágenes (crítico)

`zen-proxy/mimo-v2.6-flash-free` **no soporta entrada de imagen**: cualquier
`browser_take_screenshot` devuelve *"Cannot read image (this model does not
support image input)"*. Consecuencias:

- **R4 (visión) no sirve para leer** preguntas/opciones dibujadas con este modelo.
- Lo que SÍ funciona sin ver imágenes:
  1. Extraer `alt`, `title`, `figcaption`, `aria-label` o el texto del contenedor
     con `browser_evaluate` (muchas webs describen la imagen).
  2. El **nombre del archivo** de la imagen (`src`): si es descriptivo
     (`usb-port.jpg`) sirve como pista.
  3. Clicks por coordenadas usando los `[box=x,y,w,h]` del snapshot
     (`--snapshot-boxes`) — sirve para INTERACTUAR, no para LEER.
- Si la pregunta es 100% visual y no hay texto → **R5**: reportar
  "pregunta visual no legible con el modelo actual" y ofrecer al usuario
  cambiar a un modelo multimodal (`./scripts/run.sh --model <otro>`) o
  responderla manualmente.
- Las opciones de texto siguen siendo clicables normalmente; solo falta poder
  *mirar* la imagen del enunciado.

### V2 — Falsos positivos de detección: controles de UI que no son preguntas

`mymcqs.net` tenía 21 checkboxes (`AGREE/DISAGREE`, filtros "Start search") y
no era un examen. Regla añadida a la skill: los controles cuentan como examen
solo si hay **enunciados con alternativas** asociados (patrón "pregunta +
N opciones") o marcadores `Question X`/`Pregunta X de Y` + envío.

### V3 — Overlays de anuncios bloquean clicks secuenciales (timeout)

En `javaguides`, 25 `browser_click` secuenciales agotaron el timeout del MCP
(clicks esperando acción en elementos tapados por ads). **Solución**: batch
con `browser_evaluate` + `el.click()` de JS → 25 marcas en <1 s y sin
actionability. Añadido a la skill (ver "Ciclo eficiente").

### V4 — Modal paywall tras enviar

`javaguides` muestra tras Submit un modal *"Unlock more content — View a short
ad"*. Regla: **no ver anuncios ni pagar**; la puntuación se leyó del DOM antes
del modal (`[class*=correct]` = 25/25) y el modal se reporta al usuario.

### V5 — Resultados rotos por error del servidor

`fatskills` navega a `/result` y muestra `mysqli_sql_exception: Data too long
for column 'ip'`. Regla: si la página de resultados falla, el agente reporta
"error del sitio, no de la automatización" y ofrece reintentar o finalizar.

### V6 — Opciones barajadas por pregunta

`fatskills` reordena las opciones en cada pregunta (pool compartido). Regla:
resolver el índice de opción **dentro de cada pregunta**, nunca un mapeo
global posicional.

### V7 — Páginas "legacy" con URL de test que ya no tiene test

Tutorialspoint (`*_online_test.htm`, `*_online_quiz.htm`) ya no contiene
formularios. Detección correcta = "sin examen" (no forzar).

### V8 — Bloqueos Cloudflare = R5

Sanfoundry devuelve 403 en headed y headless. Se reporta y se para; no se
intenta evadir (regla ética del proyecto).

### V9 — Examen de inglés con AUDIO + transcript → resoluble (5/5) ✅

`testme.com` plantea 5 preguntas de listening; cada una tiene un botón
**"Show transcript"**. Flujo: clicar todos los toggles → leer el texto de
cada audio → responder → "Check Answers" → la página revela
`Correct answer: X`. Verificado **5/5**. La skill ahora busca transcript
antes que nada (toggle, DOM oculto, `<track>`, `data-transcript`).

### V10 — Audio SIN transcript = R5 (no adivinar)

Oxford Online English (6 MP3, 24 preguntas) e IELTS-Up (MP3, 5 preguntas)
no publican transcripción. El modelo no puede oír audio → **R5**: reportar
"preguntas de audio sin transcripción" y ofrecer resolución manual o pistas
(IELTS-Up tiene "Show hint"). Regla: **nunca adivinar respuestas de audio**.

### V11 — Nuevos falsos positivos: cookies, filtros de catálogo y widget docente

- **Cookies OneTrust** (British Council): 14 checkboxes
  `name*=ot-group-id` (Performance/Functional/Targeting).
- **Filtros de catálogo** (7ESL): 37 checkboxes `level[]`, `grade[]`,
  `age[]`, `goal[]`, `type[]`, `len[]`.
- **Widget de asignación docente** (Quizalize): 4 radios
  `name=assign-action` con values `quiz/homework/exam/print`.

Regla: **filtra por `name` del control antes de contar**; solo cuentan
radios/checkboxes con enunciados asociados. Añadido a la skill (V2 ampliado).

### V12 — Muros de login: reportar, nunca registrar

British Council ("Please log in or register to access the level test") y
Quizalize ("Play as a student" → pestaña de login) exigen cuenta. Regla:
detectar el aviso, **no** crear cuentas ni pedir credenciales, y ofrecer que
el usuario inicie sesión manualmente en el perfil del agente.

### V13 — Juegos TTS: transcript vía hook de `speechSynthesis`

`talkdrill.com` no tiene `<audio>`: usa la síntesis de voz del navegador.
Técnica R3: envolver `speechSynthesis.speak` antes de reproducir para
capturar `utterance.text` → se obtuvo el passage completo (10 utterances,
~700 chars por pasaje). La UI del juego no avanzó tras reproducir (entorno
sin dispositivo de audio) → se reporta el bloqueo **junto con el transcript
capturado** (el usuario puede completar con él).

### V14 — Clave de respuestas expuesta en el cliente (auto-scoring) ✅

`computerielts` corrige en el navegador: `window.ANSWERS` contiene las 40
respuestas (`{ans, alt[]}`) — contenido que **cualquier visitante** recibe
en su JS. Flujo auto completo: rellena Part 1-3 (`NI1-NI30` con `ans` +
`alt`), widget "Select 2" (B, E), MCQ custom `.opt` (letras), confirma el
modal *"Submit Now"* → **40/40, Band 9.0**. Regla: si el sitio expone su
clave, úsala y **menciónalo en el reporte**. Si no la expone, responde con
tu conocimiento.

### V15 — Índices con "110 checkboxes" que son pura UI

`w3schools.com/python/python_exercises.asp` marcó EXAMEN por 110
checkboxes: eran `darkToggle`, `filter-*-input` y checkboxes de menú. La
página es un índice; el ejercicio real (`exercise.asp?x=...`) usa opciones
custom `.quizoption` sin inputs. Confirmación de la regla V11: **filtra por
`name`/clase antes de contar**. Otros falsos positivos ronda 3: selects
`tktCategory` (tickets de soporte de computerielts).

### V16 — Sitios que no exponen puntuación tras enviar

`javacodepoint` (plugin AYS): tras "See Result" muestra review con las 30
explicaciones pero **sin marcador global** (ni %, ni X/Y, ni clases de
correcto en los labels — posible bug/ads). Regla: reporta "respondido N/N;
review visible; el sitio no expone puntuación" sin insistir.

### V17 — Clic en opción OCULTA de pregunta anterior (crítico para SPAs)

En `sqlquiz.github.io` las opciones de preguntas respondidas permanecen en
el DOM (ocultas). Un click por texto (`find` con `/^E\b/`) matcheó la
opción-E de la pregunta ANTERIOR → selección no aplicada → ❌ injusto.
**Regla añadida a la skill**: filtrar `offsetParent !== null` y elegir el
elemento más corto. Tras aplicarla: 9/10 → 100% en las siguientes.

### V18 — JSON-LD expone preguntas Y respuestas correctas ✅

`gokwiz.com` publica en `<script type="application/ld+json">` (schema.org
`Quiz` → `hasPart[]` → `Question`) las 20 preguntas con
`acceptedAnswer.text` = respuesta correcta + explicación. Es **datos
estructurados públicos** (para buscadores) que cualquier visitante recibe.
Técnica: `JSON.parse` + walk recursivo buscando `@type === 'Question'`.
Resultado: **19/20 (95%)**. Advertencia: el orden en pantalla es aleatorio
→ matchear por texto de pregunta. Mencionar el uso de la clave en el
reporte.

### V19 — Timer por pregunta: perder Q1 durante la extracción

El timer de 25s de gokwiz se agotó mientras extraía el JSON-LD → Q1 marcada
como timeout (la única de las 20). Regla: con timer, **primero** responde
rápido (o extrae datos en paralelo a ciclos de 6-7 preguntas por llamada);
reporta cualquier pérdida por tiempo.

### V31 — Lección con PRONUNCIACIÓN: voz falsa inyectada al micrófono (Dexway CUN) ✅

**Reto**: Dexway (CUN Virtual English) exige grabar tu voz y su servidor
(`voicerecog.cae.net`) puntúa la pronunciación palabra por palabra. El modelo
no tiene micrófono ni puede oír — y el ejercicio no avanza sin un score.

**Claves del diseño (por orden de descubrimiento):**

1. **El micrófono se fija al cargar la lección**: Dexway llama
   `getUserMedia({audio:true})` una vez y captura con `ScriptProcessorNode`
   @22050 Hz. El hook va en `page.addInitScript` ANTES del `reload`:
   `navigator.mediaDevices.getUserMedia` devuelve un `MediaStream` de
   `AudioContext` + `decodeAudioData(fetch(mp3))` +
   `MediaStreamAudioDestinationNode`. Dexway reporta *"Microphone available:
   true"* y graba nuestro stream.
2. **Sin loop, una sola reproducción**: reproducir el mp3 en bucle durante
   la grabación puntuó **83.35**; reproducirlo **una sola vez** subió a
   **89.7** y después 86-98 en todas las palabras. Regla: palabra = 1
   pasada, frase = 1 pasada.
3. **Disparo en `pointerdown`, no en `click`**: el listener en `click` nunca
   se disparaba (Dexway reemplaza el botón *Record* por *Stop* en
   pointerdown y el nodo queda descolgado). Capture-phase en
   `pointerdown`/`mousedown` + debounce (el doble evento dispara 2 veces).
4. **Latencia de fetch/decode mata la word-1**: si el mp3 se carga la
   primera vez durante la grabación, la voz empieza tarde y el lead del
   buffer enviado al evaluador crece (medido en el body:
   `text=…&audio=<base64 11025 Hz 8-bit>`). Precarga fuera de la grabación y
   cambia de fuente con `setUrl()` por paso.
5. **Verificación = score del servidor**: hooks de `fetch`/`XHR` capturan la
   respuesta XML `word|score` en `window.__scoreResp`. El Paso 4 se verifica
   con el dictamen del evaluador, no con el DOM.
6. **Matching foto↔frase sin visión**: `lessons/publish/<id>.xml` publica
   `<Frase imagen="X.jpg" voz="N">texto</Frase>` → mapeo exacto. Verificación
   extra: al clicar la foto correcta la página revela el texto de la frase.
7. **Avance universal = flecha `Next`**: videos exigen `video.ended`;
   matchings marcan `Terminada`; el final muestra *"Lesson completed 87%"*
   con desglose de skills.

**Límite**: word-1 de frases largas con /ð/ ("They…", "The…") puntúa ~0-1
con cualquier timing (lead 0-0.45 s); el resto 55-96 y las palabras sueltas
86-98. No bloquea la lección. No dedicar más de 1-2 reintentos a word-1.

**Resultado final**: **26/26 pasos → 87%** (Pronunciation 98%, Reading 100%).

### Ronda 8 — Unidad 1 Dexway COMPLETA (V32-V34) ✅

**5/5 lecciones de la Unidad 1 resueltas en una sesión** (cuenta del curso:
Nota media 91%, Progreso 23%):

| Lección | Mecanismo | Resultado |
|---|---|---|
| Greetings (r7) | V31 voz falsa | **87%** (Pronunciation 98%) |
| People (r8) | V31 + V32 (alfabeto/dubbing/vocab) | **92%** (Pronunciation 99%) |
| Introducing yourself (r8) | V31 + V32 completo (19 pasos) | **98%** (Reading/Writing/Listening/Vocabulary 100%) |
| Role-play: Greetings & Farewells (r8) | **V33** AIRoleplay | **100%** (1 paso, ~2 min) |
| Test exercises (r8) | **V34** test 5 preguntas | **79%** (Reading/Writing/Vocabulary 100%, Grammar 75%) |

#### V32 — Submotor UIExerScreens (ejercicios "Consolidation" de lección)

- **Pantalla de instrucciones con `.Test` vacío**: no está rota; pulsa `Next` y
  el diálogo con gaps se renderiza (`div_test.innerHTML = MainText` en el motor).
- **Gap-fill**: setter nativo (`HTMLInputElement.prototype.value`) + `input`/
  `change` → `Next` lockea → `Next` avanza ítem (un ítem por pantalla).
- **Opción múltiple = `input.Radio` + `td` de palabras**: mapeo radio↔palabra
  por **coordenada Y** (misma fila); `nth(i).click({force:true})` → Next.
- **Alfabeto**: `animTools.anim.cluesOrder` = orden exacto de respuestas →
  clic `clues[cid].img` (handle click); verificación `userAnswers {ok,wrong}`
  (26/26 y 7/7 con 0-1 wrong de timing) + `.Button.NEXT` sin `Disabled`.
- **Dubbing (`UIExerVideo`)**: descubierto por el usuario — **solo `Next`**;
  el botón se deshabilita durante cada segmento de audio/video → poll hasta
  reactivarse; 5-12 líneas/paso, 6 pasos. Grabar voz aquí NO hace falta
  (el score `EvaluatePronunciation` devuelve `[v:2]` vacío).
- **Vocabulary practice**: `Add mark` visible solo en la tarjeta activa →
  bucle en-página `c.click()` + `c.querySelector('[title="Add mark"]').click()`;
  verificación: `img[class*=Mark]` con clase `On` en todas (12/12 y 17/17).
- **Ejercicios de voz estándar** (warm-up, frases, matching): flujo V31
  Repeat → `setUrl` → Record → Stop → score (`__scoreResp`) → Next; matching
  con IDs stale esperar ~4-5 s y reintentar Repeat (id distinto a los ya
  usados). puntuaciones vistas: 66-98 palabras sueltas, 24-98 por frase.

#### V33 — AIRoleplay (chat con IA) ✅ el más rápido

- XML con `<AIRoleplay data="{ai_instructions, ai_first_message, …}">` +
  `<DemoChat chatrole="ai|student" voz="N">` = **guion completo** de la
  conversación esperada (15 mensajes = 7 respuestas de alumno).
- UI: botón **Start** (`.InfoLine .Button`) → mensaje IA → responder con
  **`input.ChatInput` + Enter** (el micrófono es prescindible). Cada respuesta
  canónica aceptada avanza el guion; al cerrar, el input desaparece → `Next`
  → "Lesson completed 100%".
- Intento previo con voz falsa (Record + setUrl a la voz del alumno) NO
  registró nada: el canal oficial de respuesta es el texto.

#### V34 — Test exercises ✅ 79%

-5 `Question #N` navegables solo con `Next`; submit = Next → diálogo OK.
- **Q1** (9 fotos): `<select>` por fila, mapeo imagen→select por Y; respuestas
  = opción sin `-` de la `<Frase>` XML del bloque cuya lista de imágenes
  coincide EXACTAMENTE con la de pantalla (variante bloque 4).
- **Q2** (8 pares de fragmentos): `UIExerPairs`; `L.click()` → `R.click()`;
  **modo test sin feedback visual** → verificación por
  `box.__pairs_acertado === true` (8/8).
- **Q3** (8 gaps to-be) y **Q4** (10 gaps/11 inputs): respuestas literales del
  bloque XML que matchea el texto (am/is/are…; Q4 incluye `It`+`is` y `Good`
  como dos gaps).
- **Q5** (8 órdenes de palabras): frases completas con punto final (formato del
  ejemplo "Here they are.").
- Resultado: **79%** (Grammar 75% — alguna variante no detectada; se puede
  repetir con "Repeat the test").

### Ronda 9 — Unidad 2 Dexway: "How old are you?" 100% (V35-V38) ✅

**Contexto**: la sesión del LMS (cdigital) caducó a mitad de la lección; el
usuario volvió a hacer login y la lección continuó desde el paso 7 sin perder
nada. Todo lo registrado por el servidor se conserva entre sesiones.

| Momento | Lección | Resultado |
|---|---|---|
| Sesión 1 (pre-crash) | How old are you? (XML **4534**) | 18% · Escucha 100% · Vocabulario 100% · Pronunciación 99% |
| Sesión 2 (r9) | **How old are you? completada** | **100%** — Reading 100 · Listening 100 · **Pronunciation 99** · Vocabulary 100 · **Grammar 100** |

**Desglose de los 27 pasos**: warm-up ×4 (5+6+7+3 palabras: Family / Child /
Aunt / house) → matching ×4 (5+4+5+3 pares) → `Dialogue listening` +
`listening and reading` (5 segmentos de vídeo) → `Dialogue understanding`
(ordenar 2 frases) → `Vocabulary sentences` (2 + 3 frases) → `Match the
greetings` (2 pares) → `Vocabulary practice` + ejercicios → pantalla de score.

Puntuaciones de voz de esta ronda: palabras sueltas **73-98** (Old house 87.7,
Child 77.6, Uncle 73.4, Grandfather 98.0, Relative 95.7); frases con
palabra-1 /ð/ ("The child is in the house" → `The|30.8`, `the|0.67`) manteniendo
el resto 87-98. **Confirma el límite de word-1** descrito en V31.

#### V35 — Saltar vídeo: `playbackRate` + `currentTime`

`UIExerVideo` son segmentos de ~32 s y bloquean `Next`. En vez de esperar:
`video.playbackRate = 16; video.currentTime = video.duration` → 2.5 s → `Next`.
Los pasos 16→17→…→27 se Advances en 2-3 llamadas en lugar de ~10. Detectar el
tipo de paso por `!!document.querySelector('video')`, no por el título (varios
pasos comparten nombre).

#### V36 — Fallback de micrófono: stream con pista de silencio

Tras el re-login, `getUserMedia` se llama **antes** de que exista audio: el
parche V31 devolvía `new MediaStream()` (sin pistas) y la app mostraba
*"Activating microphone… could not be initialized"*. Fix: si no hay URL,
devolver un stream con **pista de silencio** (`Oscillator → Gain(0.0001) →
createMediaStreamDestination().stream`) y pulsar **Retry** → el diálogo se
cierra y la lección arranca. `log`: `RET_FAKE_EMPTY` → `SILENT`.

#### V37 — `UIExerPairs` NO es arrastre: clic-clic con estado en el `className`

- El contenedor es `div.UIExerPairs` y su clase es el **estado**:
  `EsperandoIzquierda` → clic en el `.Box.Left` correcto → `EsperandoDerecha`
  y ese box gana la clase `Pulsa` → clic en el `.Box.Right` correcto → vuelve
  a `EsperandoIzquierda`. Es la verificación fiable (5/5 pares en el Q2 del
  test de la Unidad 2).
- Clic con `page.mouse.click()` en coordenadas reales: `boundingBox()` del
  `frameElement()` + `rect` del box, recalculado en cada clic.
- **`dragTo` y el drag HTML5 NO funcionan** en este submotor (no hay
  `dragstart`/`drop`): no intentarlo.
- **No verificar con `canvas.getImageData()`**: las líneas se dibujan en un
  `<canvas>` y el conteo de píxeles no es fiable.
- Varios `div` coinciden con el mismo texto → seleccionar con
  `[...document.querySelectorAll('.Box.Left')].find(e => e.textContent.trim() === texto)`.
- *Ordenar palabras*: `div.Fragment.PositionDiv` con handler que **no**
  reacciona a `el.click()` sintético (la frase no se montaba). Solución:
  `getBoundingClientRect()` del centro de cada palabra + `page.mouse.click()`
  con las coordenadas del frame, en el orden de la frase del XML.
  Frases montadas bien: "how old are you?", "I'm nine years old.", "This is
  Jackie.", "Pleased to meet you.".
- *Emparejar saludos*: mismos `div.Box.Left`/`div.Box.Right` → clic real L→R;
  sin feedback visual en test, se verifica `className` con `Terminada` en los
  4 boxes (o `__pairs_acertado === true`).

#### V38 — Reanudación de lección tras caducar la sesión

`Iniciar lección` sobre una lección con progreso **no** reinicia: continúa en el
primer paso pendiente (7 de 27). Solo hay que reinstalar V31 (+ V36 si vuelve
el diálogo de micrófono), banner → `Next` → hook `__dynHook`. Los pasos ya
contestados no se repiten (ni la práctica de 30 palabras).

### Ronda 10 — Unidad 2 Dexway COMPLETA (V39-V48) ✅

**5/5 lecciones de la Unidad 2 resueltas en una sesión** (cuenta del curso al
cerrarla: Nota media **91%**, Progreso 47%, Escucha 88, Escritura 94,
Vocabulario 90, Gramática 87, Pronunciación 98, Lectura 98).

| Lección | Mecanismo | Resultado |
|---|---|---|
| How old are you? (r9) | V31 + V32 + V35 | **100%** |
| How are the children? | V32 gaps + listening + grammar | **82%** (Writing 82, Listening 81, Vocabulary 83, Grammar 75) |
| Happy birthday! (21 pasos) | V35 vídeo + V32 + `Show solution` + vocabulary practice | **92%** (Reading 93, Writing 100, Listening 100, Vocabulary 90, Grammar 85) |
| Mediation: Introducing your friends — Writing assignment | **V39** `textarea` + **V40** message box | **87%** (Writing 87) |
| Test exercises | **V41-V48** test de 5 preguntas | **100%** (Writing 100, Grammar 100) |

**"Happy birthday!" (21 pasos)**: 2 warm-ups de vocabulario (11 y 8 palabras)
→ 8 preguntas de consolidación `tipo="32"` → 6 pasos de doblaje (`UIExerVideo`,
saltables con V35) → *"Numbers: exercise 2"* resuelto con **`Show solution`**
(respuesta revelada: *"Three"*) → `Vocabulary practice` con **19/19 tarjetas
marcadas** → score. Los 6 pasos de doblaje se resolvieron solo con `Next`.

**Writing assignment (87%)**: la rúbrica pedía presentar a la narrator y a sus
amigos, con **nombre y apellido**, y **sin** incluirse la narradora ("Laura")
en el texto. La respuesta metió a la narrator y omitió los apellidos →
el revisor automático devolvió *"you did not mention last names"* e *"it seems
you included yourself as well"*.
**Lección aprendida**: en Dexway la rúbrica del enunciado es la clave de
puntuación — responder **exactamente** lo que pide (solo las personas
indicadas, nombre + apellido, sin meterse en el texto) antes de enviar; leer
el contador de palabras y el texto de la revisión.

**Test exercises (5 preguntas, 100%)**:

| # | Instrucción | Mecanismo | Respuestas |
|---|---|---|---|
| Q1 | Select the correct word for the picture | 10 desplegables (1 por imagen) | 28913→Grandfather, 53840→Houses, 402→Pens, 56238→Eraser, 24228→Children, 59860→Birthday, 75329→Parents, 94546→Son, 75331→Daughter, 4535→Pencil |
| Q2 | Match the parts to make complete sentences | 5 pares `UIExerPairs` clic-clic | 5/5 (estado `EsperandoDerecha` + `Pulsa`) |
| Q3 | Rewrite the contracted form of the verb to be | 8 `input.Gap` | He's, I'm, You're, We're, She's, It's, You're, They're |
| Q4 | Fill in the gaps | 8 `input.Gap` | is, old, is, are, from, years, old, is |
| Q5 | Select the number that corresponds to each image | 8 desplegables | Two, Seventeen, Twenty, Five, Twelve, Fifteen, Eight, Eleven |

**Error real cometido y corregido**: en Q3 se pulsó `Next` con **solo 2 de 8
huecos** rellenados y la Q4 se saltó por completo; el test quedó enviado con
huecos vacíos. Recuperación: `[title="Previous"]` → `Cancel` en el diálogo de
finish (V40/V42) → rellenar Q3 y Q4 completas → `Next` → **OK** en el finish →
**Test completed 100%**. El error no fue irrecuperable, pero es exactamente el
que V43 evita.

#### V39 — Writing assignment: `textarea` con setter nativo + message box

```js
() => {
  const ta = document.querySelector('textarea');
  const txt = 'My name is Laura and I am from Colombia.';
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, txt);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.dispatchEvent(new Event('change', { bubbles: true }));
  return { chars: ta.value.length, palabras: ta.value.trim().split(/\s+/).length };
}
```

El contador *"Your response words: N"* se actualiza solo (verificación del
Paso 4); el límite de palabras va en el enunciado (p. ej. máx. 50). Envío:
`[title="Write your answer."]` → `TD.UIMessageBoxLayout` *"Do you want to
submit your answer for review?"* → `OK`. Con doble clic se apilan **dos**
diálogos → cerrar **todos**.

#### V40 — API de diálogos (`TD.UIMessageBoxLayout`)

```js
() => {
  const out = [];
  document.querySelectorAll('TD.UIMessageBoxLayout').forEach(td => {
    const b = [...td.querySelectorAll('button')].find(x => /^(OK|Cancel|Retry)$/.test(x.textContent.trim()));
    out.push({ txt: td.innerText.trim().split('\n')[0], btn: b ? b.textContent.trim() : null });
  });
  return out;
}
```

Botones `OK` / `Cancel` / `Retry`. *"Do you want to finish the test and get
your result?"* → **OK** finaliza y devuelve la nota; **Cancel** vuelve a la
última pregunta. Siempre cerrar **todos** los diálogos apilados.

#### V41 — `Iniciar test` (no `Iniciar lección`) + hook siempre

El test se lanza con la celda `Iniciar test` y el banner *"Click here to start
the test."*. El hook de `getUserMedia`/`__dynHook` se instala **igual** aunque
no aparezca el diálogo de micrófono (V36 solo cuando aparece).

#### V42 — Navegación interna del test: `Question #N` y `Previous`

`[title="Question #N"]` y `[title="Previous"]` permiten volver, corregir y
volver a avanzar. En la pantalla final, `Cancel` en el diálogo de finish
devuelve al test antes de confirmar (fue la vía de recuperación del error de
Q3/Q4).

#### V43 — CRÍTICO: `Next` envía la PREGUNTA COMPLETA

Con varios `input.Gap` el botón `Next` **no** envía hueco por hueco: manda la
pantalla entera. Comprobación obligatoria antes de avanzar:

```js
() => {
  const gaps = [...document.querySelectorAll('input.Gap')];
  return { total: gaps.length, vacios: gaps.filter(g => !g.value.trim()).length };
}
```

Pulsa `Next` antes de tiempo y la pregunta se registra con los huecos vacíos;
solo se recupera con `Previous` + `Cancel` en el finish (V42).

#### V44 — Desplegables: uno por imagen y con distractores propios

Las opciones son `<select>` dentro de `div.UIControlLangInput`, uno por imagen,
y **cada select tiene su propio conjunto de distractores** (distintos entre
selects) → no se puede aplicar la misma lista a todos:

```js
() => {
  const s = document.querySelector('div.UIControlLangInput select');
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, 'Grandfather');
  s.dispatchEvent(new Event('change', { bubbles: true }));
  s.dispatchEvent(new Event('input', { bubbles: true }));
  return s.value;
}
```

Emparejamiento con el XML por el atributo `imagen` de cada `<Frase>` **en orden
de DOM** (alternativa: coordenada Y del select ↔ de la imagen).

#### V45 — Selección de frame en `content-packages`

Hay varios frames con la misma URL `content-packages`. El frame de la lección
es el **último** de `page.frames()` o el que su `innerText` coincide con el
título del paso (p. ej. `"Numbers: exercise 2"`). **Siempre comprobar el texto,
nunca tomar el primero.**

#### V46 — Cómo descubrir el id del XML correcto

El XML del **test** es el que se pide **después** de clicar el banner de inicio
(`8218`); los pedidos antes (`48472`, `3591`) son de la lección anterior. Para
una lección normal el XML principal es el de **id mayor** del par (4534 sobre
244, 4535 sobre 245, 4536 sobre 246). Se obtiene del log de red filtrando
`lessons/publish`.

#### V47 — Emparejar pregunta↔XML por texto de instrucción

Varias preguntas comparten texto de instrucción e incluso `dc_id` → casar por
el **texto exacto visible** (*"Select the correct word for the picture."*,
*"Select the number that corresponds to each image."*, *"Fill in the gaps."*) y
**además** por el conjunto de opciones/imágenes en pantalla. Sesión de
referencia: XML `8218` (test Unidad 2) con 23 bloques `tipo="34"` y 140
`tipo="30"`.

#### V48 — Regla de respuesta correcta dentro del XML

En `[opción1|-opción2|-opción3]` la correcta es la **primera que NO empieza por
`-`**. Ojo: a veces el guion queda **fuera** del corchete por el apóstrofo
(`You'[re]` → la correcta es `re`).

### Ronda 11 — Unidad 3 Dexway: showroom, matching de imágenes y driver (V49-V56) ✅

**Objetivo de la ronda**: resolver más rápido. El salto vino de tres cosas:
`page.addInitScript` en vez de parche manual (V49), un **driver reutilizable**
`window.__auto` que persiste en el frame (V56) y el mapeo de
`UIExerImageIdentification` por id de voz (V50). La primera lección de la
Unidad 3 se completó en menos pasos por pregunta que las de la Unidad 2.

**Cuenta del curso**: Nota media **91%** (sin cambio), Progreso **47% → 52%**
al cerrar "Meeting new people". Escucha **87**, Escritura **94**, Vocabulario
**89**, Gramática **87**.

| Lección | Mecanismo | Resultado |
|---|---|---|
| Meeting new people (XML **4537**) | V49 + V50 + V56 + warm-up voz | **84%** (Reading 100, Listening 80, Vocabulary 80) |
| Where I'm from (XML **4538**) | V51 showroom + V52/V53 + V56 | en curso al cierre de la ronda |

#### Mapa completo del curso (leído del índice)

| Unidad | Lecciones |
|---|---|
| 1 | Greetings · People · Introducing yourself · Role-play: Greetings & Farewells · Test exercises |
| 2 | How old are you? · How are the children? · Happy birthday! · Mediation: Introducing your friends (writing assignment) · Test exercises |
| 3 | Meeting new people · Where I'm from · Pleased to meet you · Profession and Nationality (speaking assignment) · Test exercises |
| 4 | At the party · What is this? · Who's who · Role-play: The party (1) · Test exercises |
| Course review | Final Exam |

Las lecciones de *objectives* y materiales (Guía del alumno, Manual del curso,
Plan de estudios…) también son filas del índice pero **no son lecciones**:
no abren banner de inicio, así que no deben pulsarse como `Iniciar lección`.

#### XML ids descubiertos

| Par de ids | Lección |
|---|---|
| 4534 / 244 | How old are you? |
| 4535 / 245 | How are the children? |
| 4536 / 246 | Happy birthday! |
| 48472 + 3591 | Mediation (escritura) |
| 8218 | Test exercises Unidad 2 |
| 4537 / 247 | Meeting new people |
| 4538 / 248 | Where I'm from |

Patrón confirmado: **id mayor = lección, id menor = variante**; los ids son
correlativos dentro de cada unidad (244-247, 248…), igual que 8218 para el test.

#### "Meeting new people" (4537) — 15 pasos, 84%

| # | Paso | Mecanismo | Notas |
|---|---|---|---|
| 1-3 | Warm-up de vocabulario | V31 + V49 | 3 + 3 + 5 palabras; necesita **Repeat + Record** por palabra (2,6 s cada una) |
| 4-6 | `UIExerImageIdentification` | **V50** | 3 rondas de matching foto↔frase resueltas con el mapa voz→imagen |
| 7-9 | `Vocabulary sentences` | V31 | bloques de frases (escritura) |
| 10-11 | `UIExerPairs` | V37 | 2 pares clic-clic |
| 12-13 | `UIExerVideo` | V35 | 2 vídeos saltables con `playbackRate` 16 + `Next` |
| 14 | Vocabulary practice | V32 | 15 tarjetas marcadas |
| 15 | Score | — | Lesson completed 84% |

Claves: el warm-up exige el ciclo completo Repeat→Record por palabra; el
matching se resuelve con el **mapa voz→imagen del XML**, no leyendo la frase
en pantalla (V50); y los `UIExerVideo` se saltan con playbackRate 16 + Next.

#### "Where I'm from" (4538) — en curso

XML de **640 KB**: 160 ejercicios `tipo="30"`, 12 `tipo="32"`, 5 warm-up,
1 matching, 1 de frases, 1 de vocabulario. Distribución de enunciados:

| Enunciado | Nº |
|---|---|
| (sin enunciado) | 82 |
| fill in the gap(s) with the correct form of verb to be | 16 |
| artículos definite / indefinite | 11 + 6 |
| pronombres interrogativos | 7 + 1 |
| select the correct pronoun | 7 |
| write a question | 5 |
| subject pronoun | 5 |
| choose the correct sentence | 3 |
| select the correct answer | 3 |
| create a sentence | 2 |
| choose the correct word | 2 |
| continue the dialogue | 1 |

Showroom: pasos de **nacionalidades** (ciudad → nacionalidad): London→
English, Paris→French, Berlin→German, Madrid→Spanish, Rome→Italian, etc.
Es el primer `UIExerAnimation` del curso y confirma V51 (clic real para `Next`).

#### Errores reales corregidos en esta ronda

1. **Pedir el micrófono antes de parchear** dejaba el botón `Record voice` en
   `Disabled` para siempre y el paso bloqueado (síntoma idéntico al diálogo de
   V36). Causa: `getUserMedia` se llamó antes de existir el parche → con
   `addInitScript` registrado **antes** del `reload` desaparece (V49).
2. **Interpretar mal el mapa voz→imagen** (usar la voz de la *palabra* cuando
   el audio en curso era la *frase*, o al revés) producía clics erróneos: el
   ítem recibía `ZoomingOut` igualmente, así que el estado parecía bien y la
   lección no avanzaba. Regla: leer el id **recién** pulsado `Repeat` y no
   cachearlo de un paso anterior (V50).
3. **`indexOf('s')` para localizar el banco de palabras** ("am are is s")
   emparejaba la `s` de *countries* → todas las respuestas salían `is`
   (V53). Delimitador: la cadena completa del banco.

#### V49 — `page.addInitScript` en lugar de parche manual

Inyecta el parche de micrófono (V31), `window.__DexFake` y el driver (V56) con
`page.addInitScript(código)` **antes** de `page.reload()`: se ejecuta en todos
los frames y en cada navegación futura, con lo que desaparece el "hook perdido
al recargar" y el "micrófono pedido antes del parche". El contexto diagnóstico
(`location.href`, `document.body.innerText`, `window.__DexFake`,
`window.__lastAudioSrc`) queda disponible **en cada frame**. El handler de
`beforeunload` se registra antes de recargar (V55).

#### V50 — `UIExerImageIdentification`: el clicable es el `div.Item`, no el `img`

El audio de la frase se oye pero la frase puede no estar escrita: la vía fiable
es el **id de voz** del MP3 recién reproducido y el mapeo `voz → imagen` del XML
(bloques `tipo="2"`):

```js
() => (window.__lastAudioSrc || '').match(/(\d+)\.mp3/)
```

Ciclo por ítem: `[title="Repeat"]` → esperar a que **cambie** la voz → clicar el
`div.Item` correcto. `ZoomingOut` se aplica también a los clics erróneos
(feedback de "procesado", no de "acertado"); `Next` sigue `Disabled` hasta
acertar los ítems de la ronda y, al pulsarlo, aparece una **ronda interna**
nueva con `itemsZoom` a 0 aunque el número de paso no cambie.

#### V51 — Showroom (`UIExerAnimation`): clic real obligatorio para `Next`

Clicables `img.AnimacionFlash2_GreenClue`, imágenes embebidas como `data:`
base64 sin nombre de archivo → imposibles de mapear por nombre (V1). La señal
de avance es que **cambia el MP3 en curso**. El botón `Next` **no** responde a
`element.click()`: hay que usar `page.mouse.click()` sobre el centro (bounding
box del frame + `getBoundingClientRect()`). Ocurre igual en algunos pasos de
escritura de nacionalidades.

#### V52 — Radios como `img.Radio` (banco de palabras)

En *"Fill in the gaps with the forms of 'to be' from the list"* las opciones
son `<img class="Radio">` dentro de `<span id="UIControlLangInput_1_N">` y la
etiqueta vive en el `<td>` de la fila. Selector que cubre ambos casos:

```js
() => [...document.querySelectorAll('input.Radio, img.Radio')].map((r, i) => ({
  i,
  fila: (r.closest('tr') || r.parentElement).innerText.replace(/\s+/g, ' ').trim(),
}))
```

#### V53 — Sujeto de la frase y forma de "to be"

La frase a completar está en `div.UIControlLangInput > p` y el sujeto es el
**primer `span.DictionaryWordLink`** de ese `<p>`. Regla: `I` → `am`;
`you/we/they` o plural (`s`/`sh`/`ch`/`x`/`z`) → `are`; `he/she/it/that/who/
there/this/whose` → `s` (posesivo); nombre propio o singular → `is`. El banco
de palabras se localiza con la **cadena completa** (`"am are is s"`), nunca
con `indexOf('s')` (ver error 3).

#### V54 — `Show solution`: un solo uso por ronda

Tras pulsarlo el botón queda `Button SOLUTION Disabled` y el `input.Gap`
desaparece (queda el texto completo). Válido en pasos de escritura de frases,
pero consume la ayuda y baja la nota: usarlo solo si el agente no puede derivar
la respuesta.

#### V55 — Reinicio sin perder progreso

`page.reload()` + `beforeunload` aceptado (con `page.on('dialog', d =>
d.accept())` registrado **antes** de recargar, o `browser_handle_dialog`) →
vuelve al índice del curso → `Iniciar lección` → reanuda en el paso guardado.
Comprobado que a veces el progreso de un step no se guarda y se reinicia en el
paso 1, y a veces sí.

#### V56 — Driver reutilizable `window.__auto`

Inyectado por `addInitScript`, persiste en el frame → cada llamada posterior es
de **1 línea**. API: `state()` (`step`, `kind`, `gaps`/`gapsEmpty`, `radios`,
`sels`, `boxes`, `items`/`itemsZoom`, `cards`/`marked`, `recDis`, `nextDis`,
`sol`, `audio`, `msg`), `skipVideo()`, `next()`, `prev()`, `play()`,
`record(ms)`, `word(ms)`, `clickItem(file)`, `zoomed(file)`, `answerImg(mapa)`,
`sentence()`, `clickBox(txt, side)`, `pairsState()`, `setSelects(arr)`,
`fillGaps(arr)`, `clickRadioByText(txt)`, `closeMsg(which)`, `markAll()`,
`solution()`, más `radios()` y `radioLabels()`. `kind` clasifica por la clase
de `.UIMainScreenContent` (`UIExerImageIdentification`→`imgIdent`,
`UIExerPairs`→`pairs`, `UIExerAnimation`→`showroom`, `UIExerVideo`→`video`) y,
si no hay clase reconocible, por presencia de `select` / `input.Gap` /
`input.Radio` / `img.Radio` / `.Card` / `[title="Record voice"]`.

### Ronda 12 — Unidad 3 Dexway: "Where I'm from" y las reglas duras (V57-V69)

**Objetivo doble**: resolver más rápido **y sin errores**. La parte de
velocidad ya venía del driver (V56); en esta ronda el trabajo fue **cerrar los
fallos de corrección**, que son los que costaban nota. Tres de ellos se
convirtieron en reglas duras (V57-V59) y están además en portada del
`.opencode/skills/exam-resolver/SKILL.md`.

**Lección**: "Where I'm from", XML **4538** (el menor **248**), **640 KB**:
160 ejercicios `tipo="30"`, 12 `tipo="32"`, 5 warm-up `tipo="1"`, 1 matching
`tipo="2"`, 1 de frases `tipo="3"` y 1 `tipo="14"`.

**Composición del curso al cierre de la ronda**: Nota media **91%** (sin
cambio), Progreso **52%** (subió desde 47% al cerrar "Meeting new people" con
**84%**: Reading 100, Listening 80, Vocabulary 80). Unidad 3 Lección 1 =
"Meeting new people" **84%**.

#### Avance paso a paso de la sesión

| Paso | Ejercicio | Mecanismo | Respuesta / detalle |
|---|---|---|---|
| 5 | `to be` (forma larga `am/are/is/s`) | V69 + V52 | Martin → `is`; Jim and Mary → `are`; I → `am`; `He'` → `s` (V67) |
| 6 | Showroom países II | V68 | 5 imágenes; MP3 **2976 → 2989 → 2981 → 2983 → 2976** |
| 7 | Nacionalidades (hueco en la frase) | V62 + **V57** | `She is Austrian`; fue el paso donde la respuesta se registró dos veces |
| 8 | `to be` | V69 | `It'` → `s`; Henrik and I → `are`; Tony → `is` |
| 9-13 | Showrooms países III / IV / V | V68 | 5 imágenes por showroom; avance = cambio de MP3 |
| 10 | `to be` forma corta (`is/m/re`) | V69 | `I'` → `m`, `you/we/they'` → `re`, resto → `is` |
| 14 | Consolidación "Make a sentence" | V62 | `Rob is Irish.` (no "Irish nationality") |
| 16 | Interrogativos con **diccionario popup** | V60 + V63 | cerrar `[title="Close"]` con clic real antes de cada frase |
| 17 | Los 4 interrogativos | V63 | Why / Who / What / How derivados de la respuesta |
| 18 | Useful phrases | V32 | bloques de frases |
| 19 | Oraciones (nacionalidades) | V62 | `Otto is German.`; `Valeria and Mariana are Mexican.` (compuesto → `are`) |
| 20 | Artículos | **V59** | ⚠️ **perdido sin responder**: la app avanzó sola a la 21 |
| 21 | — | — | en curso al cierre de la ronda |

El avance real de la sesión registra los pasos 9-13 como showrooms de países
III/IV/V **y** el paso 10 como `to be` de forma corta; se documenta tal cual
como consta en la ejecución.

#### Mapa completo de interfaces detectado en el XML 4538

| Selector | Qué es |
|---|---|
| `div.UIControlLangInput` | banco de palabras (y contenedor de los `<select>`) |
| `p.DictionaryWordLink` | palabras con enlace al diccionario |
| `span[id$="_listsource"]` | hueco pendiente (no es un `input`) |
| `input.Gap` | hueco de texto real (id p. ej. `UIControlLangInput_35_1`) |
| `input.Radio` / `img.Radio` | opciones (en este tipo de ejercicio, `img.Radio`) |
| `[title="Close"]` | botón de cierre del popup de diccionario |
| `[title="Show solution"]` | ayuda (un solo uso por ronda, V54/V58) |
| `img.AnimacionFlash2_GreenClue` | imágenes del showroom (`UIExerAnimation`) |

#### Tiempos que funcionan

- **2,6-2,8 s de grabación** por palabra (el ciclo `Repeat` → `setUrl()` →
  `Record voice` → `Play`).
- **~2 s de espera** tras cada acción antes de leer el estado.
- **0,9 s** entre clics de showroom.
- El **timeout del MCP es ~30 s por llamada**: las llamadas largas se cortan
  aunque la acción siga adelante → **leer el estado en una llamada siguiente**
  en lugar de asumir que terminó.

#### V57 — Verificar antes de avanzar (regla dura)

Ciclo correcto: **escribir** → **leer el valor real del campo** → **comparar
string exacto** con lo que se quiso escribir → **solo si coincide, pulsar
`Next`**. Si no coincide, **no** se avanza:

```js
const v = await frame.evaluate(() => document.querySelector('input.Gap').value);
if (v !== ans) break;
```

Un `log: "-"` es una señal, **no** una verificación: escribe "value" cuando el
valor no ha cambiado, no cuando el motor ha aceptado la respuesta.

#### V58 — `Show solution` solo como último recurso, y avisando

En esta sesión se usó **en bucle** dentro del dispatcher: resolvió pasos
completos con la respuesta revelada en lugar de la propia, lo que degrada la
calidad del trabajo. Regla: si la regla gramatical no deriva la respuesta, el
agente **para y pregunta**. Amplía V54.

#### V59 — Un cambio de paso NO significa "resuelto"

En el paso 20 (artículos) la app avanzó sola a la 21 sin que nadie respondiera.
`Previous` **sí** funciona como botón, pero **no** vuelve a un paso no
validado → el ejercicio se perdió y la pérdida de nota fue **irrecuperable** en
esa pasada. Para dar un paso por bueno: **estado interno** (`gapsEmpty === 0`
con el hueco ya cerrado, o el radio marcado), **nunca** el número de paso.

#### V60 — Nueva clase: popup de diccionario

En *"Showroom: interrogative pronouns"* se abre un modal de diccionario con
`[title="Close"]`, elementos `div.Item.Zoomed` y botón `Repeat`. Mientras está
abierto, el paso **aparenta no tener `Repeat`** y el dispatcher se atasca
inventando que "no hay Repeat". Procedimiento: si existe `[title="Close"]`,
**clic real** para cerrarlo y **volver a leer el estado**; después queda en modo
`record` ("Listen and repeat") con varias frases. Ojo: el diccionario **se
reabre en cada frase del mismo paso** → comprobarlo en **cada** iteración.

#### V61 — `kind:'other'` + hueco cerrado = ítem YA resuelto

Tras aceptar la respuesta el `input.Gap` desaparece y `kind` pasa a `other` con
`gapsEmpty: 0`. En ese estado no hay que rellenar nada: **solo pulsar `Next`**
para pasar al siguiente ítem.

#### V62 — Dos plantillas distintas de "oraciones"

| Plantilla | Qué muestra la pantalla | Qué se escribe | Ejemplos verificados |
|---|---|---|---|
| *Write the correct nationality* | `"X is in Y."` + hueco | **cláusula completa** con sujeto y nacionalidad | `Heidi / Vienna` → `She is Austrian` (o `She's Austrian`); `Georgio / Rome` → `He is Italian` |
| *Consolidation / Make a sentence* | `"Nombre / Nacionalidad"` | **frase completa con punto final** | `Julia / Chilean` → `Julia is Chilean.`; `Otto / German` → `Otto is German.`; `Rob / Irish` → `Rob is Irish.` |

El XML confirma la primera plantilla:
`Heidi is in Austria. [She is Austrian|She's Austrian | she is Austrian |
she's Austrian]`. En la segunda el XML solo trae `Julia is Chilean.` → es
**producción libre**. Ojo: `Irish` ya es la nacionalidad, NO "Irish
nationality". Sujeto compuesto → `are`: `Valeria and Mariana / Mexican` →
`Valeria and Mariana are Mexican.`

```js
const partes = frase.split('/').map(s => s.trim());
const suj = partes[0].replace(/\.$/, '');
const nat = partes.slice(1).join('/').trim().replace(/[.]$/, '');
const plural = /\band\b/i.test(suj) || /\bthey\b|\bwe\b|\byou\b/i.test(suj);
return suj + ' ' + (plural ? 'are' : 'is') + ' ' + nat + '.';
```

#### V63 — Interrogativos: la respuesta textual determina el interrogativo

Verificado en el XML de la lección 4538:

| Respuesta en pantalla | Interrogativo | Ejemplo |
|---|---|---|
| `Because ...` | **Why** | `Why are you happy? / Because it is my birthday.` |
| `He/She/They/We + is/are` | **Who** | `Who is this girl? / She is my sister.` |
| `My name is ...` | **What** | `What is your name? / My name is Daun.` |
| `I am fine. Thank you.` | **How** | `How are you?` |
| `Where ...` en la frase | **Where** | — |
| `When ...` en la frase | **When** | — |

Trampa real: **`How are you happy?` no existe**; el enunciado *forces* `Why`.
Cuando la regla no derive una respuesta clara → **parar** (V58).

#### V64 — Radios: el clic REAL es obligatorio

`element.click()` desde JavaScript puede no registrar la selección y disparar
un `alert` nativo con el texto `Select the correct option.`. Usar siempre
`page.mouse.click()` sobre el centro del `getBoundingClientRect()` del
`input.Radio` o `img.Radio`. En este tipo de ejercicio los radios son
`img.Radio` (no `input.Radio`) y la etiqueta está en el texto del `<td>` de la
fila (V52).

#### V65 — Selección de frame: de derecha a izquierda

Recorre `page.frames()` de **DERECHA a IZQUIERDA** y quédate con el **último**
frame que devuelva `{ auto: true, step: truthy }`. El criterio laxo
`!!window.__auto` falla con errores transitorios de evaluación y produce falsos
"no frame".

```js
let lf = null;
for (let i = frames.length - 1; i >= 0; i--) {
  try {
    const r = await frames[i].evaluate(() => ({
      a: !!window.__auto,
      s: window.__auto ? window.__auto.state().step : null,
    }));
    if (r.a && r.s) { lf = frames[i]; break; }
  } catch (e) {}
}
```

#### V66 — Leer el sujeto con `childNodes`, nunca con `children`

El sujeto puede vivir en un **nodo de texto** (`He'` + hueco), no en un
elemento; con `children` el índice del hueco queda en 0, la frase se lee vacía y
la regla devuelve siempre `is`:

```js
for (const n of p.childNodes) {
  if (n === gap) break;
  out += (n.textContent || '');
}
```

Detección de hueco **PENDIENTE**: `span[id$="_listsource"]` o
`span[style*="dotted"]` cuyo
`textContent.replace(/\u00a0/g, '').trim() === ''`. Dos trampas: (1) el hueco ya
resuelto **conserva** `style="border-bottom: 1px dotted black"`, así que el
estilo no sirve para saber si falta; (2) en los Consolidation el hueco es un
`<input class="Gap">` real (id `UIControlLangInput_35_1`), no el `span`.

#### V67 — Normalizar el sujeto antes de comparar

`.replace(/[^a-z]/g, '')` antes de aplicar `/^(he|she|it|...)$/`, porque `He'`
debe compararse como `he`. Sin esto la respuesta sale `is` en vez de `s`, la app
**rechaza** y el paso se atasca (fue exactamente lo que pasó en el paso 5 con
`He'`).

#### V68 — Showroom (`UIExerAnimation`): qué clic es sintético y cuál no

Las imágenes van embebidas como URI `data:` en base64, **sin nombre de
archivo** → no se pueden mapear por nombre (V1/V51). El clic JS **sí** funciona
en `img.AnimacionFlash2_GreenClue` y el avance real es **el cambio de MP3 en
curso**. El `Next` del showroom **requiere clic real de ratón**: con
`element.click()` no responde.

#### V69 — Regla de *to be* completa y sus dos variantes

- **Forma larga** (opciones `am/are/is/s`): sujeto `I` → `am`;
  `you/we/they`, o sujeto compuesto con `and`, o sustantivo en plural (termina
  en `s/sh/ch/x/z`) → `are`; `he/she/it/that/who/there/this/whose` (también con
  el apóstrofo pegado, `He'`) → `s` (posesivo); nombre propio o singular → `is`.
- **Forma corta** (opciones `is/m/re`): `I'` → `m`; `you/we/they'` → `re`;
  resto → `is`.

## Errores del agente — no repetir

Registro de los fallos reales de esta ronda, escritos en segunda persona como
autorrección. Cada uno tiene su corrección ya incorporada al skill; no los
repitas.

1. **Usaste `Show solution` de forma automática dentro del dispatcher.**
   Resolviste varios pasos con la respuesta revelada en lugar de la propia, lo
   que degrada la calidad del trabajo aunque la lección avance. **Corrección:
   V58** — `Show solution` solo como último recurso, **avisando al usuario**, y
   **nunca** dentro de un bucle; si la regla gramatical no deriva la respuesta,
   **para y pregunta**.
2. **Avanzaste pasos sin comprobar que la respuesta hubiera sido aceptada.** En
   el paso 7 la misma respuesta salió **dos veces** porque la primera fue
   rechazada por la app. **Corrección: V57** — escribir → leer el valor real del
   campo → comparar **string exacto** → solo si coincide, `Next`. Un
   `log: "-"` es una señal, no una verificación.
3. **Pulsaste `Next` sin responder (quedó `log: "-"`) en el paso 10.** Con eso
   te saltaste el ejercicio entero. **Corrección**: **nunca** avanzar con el
   hueco pendiente → cuenta los huecos vacíos y exige `gapsEmpty === 0` antes
   de `Next` (V43/V57).
4. **Creíste que un cambio de número de paso significa "resuelto".** En el paso
   20 (artículos) la app avanzó sola a la 21 sin que nadie respondiera y
   `Previous` no lo recupera: el ejercicio quedó **sin responder y con pérdida
   de nota irrecuperable** en esa pasada. **Corrección: V59** — el estado
   interno (`gapsEmpty === 0` con el hueco cerrado, o el radio marcado) es la
   única prueba; el número de paso no lo es.

**Fallos técnicos concretos que costaron tiempo** (mismo origen: parseo o clic
sintético en lugar de datos/clic reales):

- **`indexOf('s')` para localizar el banco de palabras** ("am are is s"):
  emparejaba la `s` de *countries* → todas las respuestas salían `is`.
  **Corrección**: delimitar con la **cadena completa** del banco (V53).
- **`children` en vez de `childNodes`** para leer el sujeto: el sujeto estaba
  en un nodo de texto (`He'` + hueco) → la frase se leía vacía y la regla
  devolvía `is`. **Corrección**: `childNodes` + normalizar a minúsculas sin
  puntuación (V66/V67).
- **Clic JS en los radios** en vez de clic real: la selección no se registraba y
  saltaba un `alert` nativo `Select the correct option.`. **Corrección**:
  `page.mouse.click()` sobre el centro del `getBoundingClientRect()`
  (V64).

## Patrones de página catalogados (para la skill)

| Patrón | Ejemplo real | ¿Resuelto? |
|---|---|---|
| Landing con botón Start → examen paginado | W3Schools | ✅ 25/25 |
| Todas las preguntas en 1 página + envío | javainuse, javaguides | ✅ 34/35, 25/25 |
| Feedback instantáneo por pregunta ("Check Answer") | javainuse | ✅ |
| Checkbox en vez de radio para opción única | (detectado en MyMCQs como UI; handler en skill) | ✅ handler |
| Imagen en el enunciado + opciones texto | ProProfs, Fatskills | ⚠️ requiere modelo multimodal (V1) |
| Opciones barajadas por pregunta | Fatskills | ✅ (regla V6) |
| Iframe como contenedor | simulators/iframe-examen.html | ✅ 4/4 |
| Divs sin roles (SPA custom) | simulators/spa-a11y.html | ✅ 4/4 |
| Bloqueo anti-bot | Sanfoundry | ✅ R5 correcto |
| Paywall post-submit | javaguides | ✅ V4 |
| **Listening con transcript visible** | testme.com | ✅ **5/5** (V9) |
| **Listening con audio y sin transcript** | oxfordonlineenglish, ielts-up | ✅ R5 reportado (V10) |
| **Juego TTS (sin `<audio>`)** | talkdrill.com | ✅ transcript por hook (V13) |
| Checkboxes de cookies OneTrust | britishcouncil | ✅ filtrado (V11) |
| Checkboxes de filtros de catálogo | 7esl | ✅ filtrado (V11) |
| Radios de widget docente | quizalize | ✅ filtrado (V11) |
| Juego que requiere cuenta para jugar | quizalize, britishcouncil | ✅ reporte de login (V12) |
| Vista teacher con preguntas legibles | quizalize | ✅ lectura OK, interacción con cuenta |
| **Test por partes con palette + fill-in** | computerielts (40 Q) | ✅ **40/40 Band 9.0** (V14) |
| **Modal "¿Enviar test?"** | computerielts | ✅ confirmar "Submit Now" |
| **Clave en `window.ANSWERS` (cliente)** | computerielts | ✅ usar + reportar (V14) |
| **Opciones custom `.quizoption`** | w3schools exercises | ✅ 3/3 |
| **Índice con checkboxes de UI** | w3schools exercises (110), computerielts `tktCategory` | ✅ filtrado (V15) |
| Selects de tickets de soporte | computerielts | ✅ filtrado (V15) |
| **MCQ masivo en 1 página (30 Q)** | javacodepoint SQL | ✅ 30/30 (sin score del sitio, V16) |
| **Paginado Previous/Next + Finish** | math-questions stats (20 Q) | ✅ **20/20 100%** |
| **SPA con config + timer** | sqlquiz.github.io | ✅ 90% (config No Timer + V17) |
| **Opción oculta de pregunta anterior** | sqlquiz.github.io | ✅ filtro `offsetParent` (V17) |
| **Formato apuntes (sin envío)** | indiabix | ✅ detectado como no-examen |
| **JSON-LD con respuestas + timer 25s** | gokwiz | ✅ **19/20 95%** (V18/V19) |
| **Sidebar de preguntas (mixtas)** | fivesql | ✅ mecánica resuelta |
| **Clave embebida en HTML (JSON escapado)** | es.open-exam-prep UNAL | ✅ **198/200** (V18b) |
| **Botones tapados por iframe de anuncios** | es.open-exam-prep | ✅ JS click / aceptar cookies (V19b) |
| **`onclick` inline en opción** | prepmaster-paa | ✅ **60/60** (V20) |
| **Array global de preguntas en cliente** | prepmaster-paa | ✅ **800/800, 55/55** (V21) |
| **Botón "Show Answer" revela la clave** | certification-exam (Java 1Z0-808) | ✅ **10/10** (V22) |
| **Articulate Storyline (matching DnD + droplists + MC custom + listening)** | SENA Placement Test | ✅ **100/300 = 100 Puntos** (V24-V30) |
| **Listening en Storyline sin transcript** | SENA (22 slides de audio) | ✅ clave en `data.js` → **15/15** (V28) |
| **Imágenes sin `alt` (preguntas figurales)** | simuladorpruebasena.web.app | ⛔ R5 (V1, no adivinar) |
| **Grabación de voz / pronunciación (micrófono)** | Dexway CUN Greetings | ✅ voz falsa vía `addInitScript` → **87%, Pronunciation 98%** (V31) |
| **Ejercicio "habla y el servidor puntúa"** | Dexway `voicerecog.cae.net` | ✅ score XML `word|score` como verificación (V31) |
| **Matching foto↔frase sin poder ver fotos** | Dexway (XML `lessons/publish/*.xml`) | ✅ mapeo por XML + revelado al clicar (V31) |
| **Matching de pares de texto** | Dexway "Dialogue understanding" | ✅ coordenadas + clase `Terminada` (V31) |
| **Lección LTI con iframes cross-origin (S3)** | `cun.dexway.com` → `caelms.s3` | ✅ `page.frames()` atraviesa (V31) |
| **Video que bloquea Next hasta terminar** | Dexway Dialogue listening/reading | ✅ esperar `video.ended` (V31) |
| **Gaps + opción múltiple en lección (UIExerScreens)** | Dexway Consolidation | ✅ Next desde `.Test` vacío, setter nativo, radio↔palabra por Y (V32) |
| **Dubbing "Dub the characters"** | Dexway Unidad 1 (6 pasos) | ✅ solo `Next` con poll de reactivación (V32) |
| **Alfabeto "click the letter you hear"** | Dexway Listening activity | ✅ `animTools.anim.cluesOrder` (V32) |
| **Vocabulary practice (Add mark)** | Dexway (12 y 17 tarjetas) | ✅ bucle zoom+mark en-página, verificación `Mark On` (V32) |
| **Role-play con IA (chat)** | Dexway AIRoleplay | ✅ `ChatInput` + Enter con guion `DemoChat` → **100%** (V33) |
| **Test de unidad (5 preguntas mixtas)** | Dexway Test exercises | ✅ selects/fill/pares/orden → **79%** (V34) |
| **Pares en modo test SIN feedback visual** | Dexway `UIExerPairs` | ✅ verificación por `__pairs_acertado` (V34) |
| **Pares clic-clic con estado en el `className`** | Dexway `UIExerPairs` (`EsperandoIzquierda`/`Pulsa`) | ✅ 5/5 pares (V37) |
| **Writing assignment (textarea + message box)** | Dexway Mediation | ✅ setter nativo + `OK` → **87%** (V39/V40) |
| **Desplegable por imagen con distractores propios** | Dexway Q1/Q5 del test | ✅ orden de DOM del XML (V44) |
| **`Show solution` como mecanismo de respuesta** | Dexway "Numbers: exercise 2" | ✅ leer lo revelado y avanzar (V32); desde V58 solo último recurso, avisando y **nunca en bucle** |
| **`Next` envía la pregunta completa (multi-gap)** | Dexway Q3/Q4 del test | ✅ contar huecos vacíos antes de avanzar (V43) |
| **Parche inyectado con `addInitScript` (todos los frames)** | Dexway Unidad 3 | ✅ sin "hook perdido al recargar" ni "micro antes del parche" (V49) |
| **Matching foto↔frase con el clicable en el contenedor** | Dexway `UIExerImageIdentification` | ✅ mapa voz→imagen del XML, clic en `div.Item` (V50) |
| **Showroom con imágenes `data:` y `Next` que ignora `el.click()`** | Dexway `UIExerAnimation` | ✅ clic real `page.mouse.click()` (V51) |
| **Opciones de banco de palabras como `img.Radio`** | Dexway (formas de "to be") | ✅ `input.Radio, img.Radio` + texto de la fila (V52) |
| **Frase a completar con sujeto en `span.DictionaryWordLink`** | Dexway "Where I'm from" | ✅ regla am/are/is/s (V53) |
| **`Show solution` de un solo uso por ronda** | Dexway | ✅ solo como recurso de ayuda (V54) |
| **Reinicio que conserva el paso guardado** | Dexway `page.reload()` + `beforeunload` | ✅ volver a `Iniciar lección` y reanudar (V55) |
| **Driver reutilizable inyectado en el frame** | Dexway `window.__auto` | ✅ llamadas de 1 línea por paso (V56) |
| **Ventana que avanza sola (artículos)** | Dexway "Where I'm from" paso 20 | ⚠️ pérdida irrecuperable sin verificar estado (V59) |
| **Popup de diccionario que oculta el `Repeat`** | Dexway "Showroom: interrogative pronouns" | ✅ cerrar `[title="Close"]` con clic real, en cada frase (V60) |
| **Ítem ya resuelto que parece sin resolver** | Dexway `kind:'other'` + `gapsEmpty: 0` | ✅ solo `Next` (V61) |
| **Dos plantillas distintas de oración/nacionalidad** | Dexway "Write the correct nationality" vs "Make a sentence" | ✅ cláusula vs frase completa (V62) |
| **Interrogativo deducido de la respuesta** | Dexway XML 4538 | ✅ Why/Who/What/How (V63) |
| **Radios que ignoran el clic sintético** | Dexway bancos de palabras | ✅ clic real o `alert` nativo (V64) |
| **Selección de frame con varios frames vivos** | Dexway `page.frames()` | ✅ de derecha a izquierda con `{auto, step}` (V65) |
| **Sujeto partido en nodo de texto (`He'` + hueco)** | Dexway frases con `to be` | ✅ `childNodes` + normalizar (V66/V67) |
| **`to be` en forma corta (`is/m/re`)** | Dexway paso 10 | ✅ `I'`→`m`, `you/we/they'`→`re` (V69) |

## Modos de disparo validados

| Modo | Cómo se prueba | Resultado |
|---|---|---|
| `auto` | computerielts 40 Q + w3schools exercises + javacodepoint 30 Q + math-questions 20 Q + sqlquiz 10 Q sin pausar | ✅ 40/40, 3/3, 30/30, **20/20**, 90% |
| `semi` | testme 5 Q: enunciado + opciones + propuesta → `question` → verificar → avanzar | ✅ 5/5 |
| Pestaña activa (`--current`) | `browser_tabs` → operar sobre la tab activa | ✅ verificado |
| URL (`resolve.sh <url>`) | script con guardia de perfil de Brave en uso (`--force` para forzar) | ✅ guardia probada (bloquea si hay MCP activo) |

## Pendientes

- Reprobar preguntas 100% visuales con un **modelo multimodal** (activar R4 de
  verdad): `./scripts/run.sh --model <modelo-con-visión>` y repetir ProProfs.
- Navegar desde índices (IndiaBIX Online Tests) a un test concreto.
- Modo `semi` sobre una página real **sin autoconfirmación** (el usuario
  confirma cada `question` en su terminal).
- Pruebas de motores adicionales cuando aparezcan URLs públicas sin login
  (Moodle/Google Forms suelen exigirlo; ver `docs/urls-recon-r2.txt`).
- Nota: `javatpoint.com`, `recursostic.es`, `html5.laboratoriotec.es` y
  `test-online.es` no resuelven DNS en este entorno (error de red, no del
  agente).
- Pendientes ronda 4/5: `codescracker.com` y `sqlmentor.in` (marcados SIN
  EXAMEN en recon — probar con Start); `gokwiz` otras categorías (mismos
  patrones ya resueltos); ampliar con URLs de entrevista/universidad.
- Pendientes ronda 6: `examenes.lat/co` (EXAMEN en recon — admisiones
  Colombia/CUN), `javacodepoint.com/quizzes/` (VARIOS), CUN
  `plataformas.cun.edu.co` (timeout en recon), y los canvas-engines
  (`ejecucionformacion` ya resuelto, quedan educaplay ×2, daypo) que
  requieren R4/visión o probing JS.
- Repetir SENA Placement con el usuario presente en `semi` para validar la
  confirmación humana sobre el mismo motor Storyline.
- Ronda 7/8 (Dexway): Unidad 1 completada (V32-V34). Ronda 9 (**V35-V38**):
  `How old are you?` **100%**. Ronda 10 (**V39-V48**): **Unidad 2 completada
  5/5** (How are the children? 82%, Happy birthday! 92%, Mediation writing
  87%, Test exercises 100%). Ronda 11 (**V49-V56**): Unidad 3 iniciada —
  `Meeting new people` **84%** y `Where I'm from` en curso (showroom de
  nacionalidades). Ronda 12 (**V57-V69**): `Where I'm from` en el **paso 21**,
  con las 3 reglas duras de seguridad (V57-V59) ya incorporadas al skill y el
  registro "Errores del agente — no repetir". Quedan el resto de la **Unidad 3**
  ("Pleased to meet you", "Profession and Nationality", su test), la
  **Unidad 4** completa y el **Final Exam** del Course review, con el mismo
  flujo: `Main menu` → *Save and exit* → índice → fila de unidad → `Iniciar
  lección` / `Iniciar test`; motores V31-V69 reutilizables (bajar el XML nuevo
  por par `<id>.xml`, usar el de cifra mayor y emparejar por texto de
  instrucción). El progreso de las lecciones completadas de las Unidades 1-2 es
  de la ronda 8/10 y no se vuelve a repetir.
- Reintentar el **paso 20 (artículos)** de "Where I'm from" con
  `Previous` → `Save and exit` → `Iniciar lección`: V59 explica que la
  recuperación no es en línea, así que hay que volver a entrar en la lección y
  comprobar el estado de cada paso (V57) antes de avanzar.
- Repetir el Test exercises de la **Unidad 1** con "Repeat the test" para subir
  Grammar 75% (alguna variante de Q1/Q4/Q5 no detectada en el XML). El test de
  la **Unidad 2** ya salió **100%** con V43-V48.
- Automatizar el paso "Vocabulary practice" (Add mark) como parte del
  flujo estándar de V31/V32 en vez de manual por lección → ya validado como
  bucle en-página (V32) y de nuevo con 19/19 tarjetas (r10); incorporarlo al
  flujo automático de lecciones.
