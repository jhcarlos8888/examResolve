# Patrones comunes de páginas de examen

Trucos y trampas genéricos, verificados en W3Schools, ComputerIELTS,
fivesql, javaguides, gokwiz, sqlquiz, indiabix, math-questions,
British Council, Quizalize, fatskills y javacodepoint.

Los 10 más caros están resumidos en `SKILL.md` (sección "Patrones
generales: los que más cuestan"). Este archivo tiene el detalle completo.

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

