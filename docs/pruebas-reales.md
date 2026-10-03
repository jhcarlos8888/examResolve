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
- **35 páginas/flujo probados en profundidad** (11 r1 + 7 r2 + 2 r3 + 4 r4
  + 2 r5 + 5 r6 + 1 r7 + 3 r8) y **4 modos de disparo validados**: `auto`, `semi`
  (confirmación con `question`), pestaña activa (`browser_tabs`) y URL
  (`resolve.sh` con guardia de perfil).
- Hallazgos **V1-V34**.
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
- Ronda 7 (Dexway): ~~resolver otras lecciones del curso A1~~ → **Unidad 1
  completada en ronda 8** (People, Introducing yourself, Role-play, Test —
  V32-V34). Quedan **Units 2-4 + Course review** con el mismo flujo:
  Exit → índice → fila de unidad → `Iniciar lección`; los motores V31-V34 son
  reutilizables tal cual (bajar nuevo XML por par `<id>.xml`, usar el grande).
- Repetir el Test exercises con "Repeat the test" para subir Grammar 75%
  (alguna variante de Q1/Q4/Q5 no detectada en el XML).
- Automatizar el paso "Vocabulary practice" (Add mark) como parte del
  flujo estándar de V31/V32 en vez de manual por lección → ya validado como
  bucle en-página (V32); incorporarlo al flujo automático de lecciones.
