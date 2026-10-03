# Motor Dexway (V31-V69)

Hallazgos de las rondas 7-12 (CUN / Dexway: lecciones con pronunciación,
role-play con IA, tests de unidad). **Cárgalo solo cuando reconozcas el
motor** (ver tabla "Dispatcher de motores" en `SKILL.md`).

Fingerprint: launch LTI `*.dexway.com/lti/enter` → iframes cross-origin
`content-packages`, botones `Repeat` / `Record voice` / `[title="Next"]`,
textos "Listen, repeat and write", llamadas a `voicerecog.cae.net`.

## Motor Dexway (ronda 7 — CUN, lecciones con PRONUNCIACIÓN / voz) — V31

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
  (no sobrevive a la recarga del documento; con `page.addInitScript` antes del
  `reload` deja de ser necesario — ver V49).

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

### Motor Dexway — lección completa con diálogo y vídeo (ronda 9 — Unidad 2) — V35-V38

- **V35 — Saltar segmentos de vídeo (`UIExerVideo`)**: no esperes a que el
  segmento termine. En el frame de la lección:
  `document.querySelectorAll('video').forEach(v => { v.playbackRate = 16; v.currentTime = v.duration; })`
  → esperar ~2.5 s → `Next`. Convierte 5-8 clicks con espera en 1-2 llamadas.
  Un `Dialogue listening`/`listening and reading` = 1 segmento por paso (duran
  32 s). **Detecta el tipo de paso por la presencia de `<video>`**, no por el
  título: los pasos se llaman igual pero unos tienen vídeo y otros no.
- **V36 — Fallback de micrófono (stream silencioso)**: si al arrancar sale el
  diálogo *"Activating microphone… could not be initialized"* (pasa tras
  recargar/re-loguear, porque el parche V31 se reinstala con `addInitScript` y
  `getUserMedia` se llama **antes** de que exista audio: `curUrl` vacío →
  `new MediaStream()` sin pista → la app lo rechaza), redefine
  `getUserMedia` para que si no hay URL devuelva un **stream con pista de
  silencio** (`OscillatorNode` → `GainNode(0.0001)` →
  `createMediaStreamDestination().stream`) y luego clic en **Retry**. Así el
  diálogo se cierra y la lección arranca; el audio real se inyecta después con
  `__DexFake.setUrl()` en cada paso. **El parche se escribe en el frame del
  diálogo de micrófono, que es DISTINTO del frame de la lección**: búscalo en
  `page.frames()` por el que contiene el botón `Retry` (V45).
- **V37 — `UIExerPairs`: NO es arrastre, es clic-clic (máquina de estados)**:
  - El contenedor es `div.UIExerPairs` y **su `className` es el estado**:
    `EsperandoIzquierda` → al hacer clic en el `.Box.Left` correcto pasa a
    `EsperandoDerecha` y ese box gana la clase `Pulsa` → se hace clic en el
    `.Box.Right` correcto → vuelve a `EsperandoIzquierda`.
  - Usa `page.mouse.click()` en **coordenadas reales**: `boundingBox()` del
    `frameElement()` + `rect` del box (recalcula en cada clic).
  - **NO** uses `dragTo` ni eventos HTML5 drag: **no funcionan** (el DOM no
    tiene `dragstart`/`drop` en este submotor).
  - **NO** verifiques con `canvas.getImageData()`: las líneas se dibujan en
    un `<canvas>` y el conteo de píxeles no es fiable → verifica por la **clase
    de estado del contenedor**.
  - Varios `div` coinciden con el mismo texto → selecciona por:
    `[...document.querySelectorAll('.Box.Left')].find(e => e.textContent.trim() === texto)`
  - *Ordenar palabras* (`Make sentences by clicking on the words in the correct
    order`): las palabras son `div.Fragment.PositionDiv` **shuffleadas**.
    `el.click()` por JS **no** dispara el handler → calcula el centro del
    `getBoundingClientRect()` de cada palabra en el orden de la frase objetivo
    (del XML) y usa `page.mouse.click()` con las coordenadas **del frame**
    (`(await frame.frameElement()).boundingBox()` + `rect`); recalcula la
    posición en cada clic (la palabra desaparece al usarse). Verifica con
    `innerText`: la frase aparece montada y correctamente ordenada.
  - *Emparejar saludos* (`Match the greetings…`): mismos `div.Box.Left` /
    `div.Box.Right`, estado `Terminada` en los 4 boxes al completar el par
    (o `__pairs_acertado === true`).
- **V38 — La progresión se guarda en el servidor (lecciones y tests)**:
  `Iniciar lección` (o `Iniciar test`) sobre un ítem con progreso **no**
  reinicia: reabre en el **paso/pregunta exacta** donde se quedó, así que
  reanudar nunca pierde lo hecho. Tras caducar la sesión del LMS el progreso
  sigue ahí (ej. "18% · Lección sin finalizar, Escucha 100%, Vocabulario
  100%, Pronunciación 99%"). Basta con re-login → banner → `Next` → hook
  `__dynHook` (V31) y seguir; los pasos ya contestados no se repiten. Con
  `page.reload()` + `beforeunload` aceptado el curso vuelve al índice y se
  reanuda en el paso guardado (V55).
- **Orden real de una lección larga** (ej. 4534 "How old are you?", 27 pasos):
  warm-up×4 + matching×4 (vocab en bloques de 5/4/5/3) → diálogo/vídeo
  (3-5 segmentos) → `Dialogue understanding` (ordenar 2 frases) → `Vocabulary
  sentences` (2 + 3 frases) → `Match the greetings` (2 pares) → `Vocabulary
  practice` (30 palabras) → ejercicios de listening/grammar. Al terminar:
  "Score Lesson completed 100%" con skills; salir con `Main menu` → diálogo →
  **Save and exit**.

### Motor Dexway — Unidad 2 completa: writing, test y emparejado (ronda 10) — V39-V48

Mismos frames que V31/V32 (V45 para elegir el correcto). Todo lo de abajo va
en el **frame de la lección** salvo el diálogo de micrófono (V36).

- **V39 — Writing assignment (`textarea` + message box)**: el `<textarea>`
  está dentro del frame de la lección. Rellénalo con el **setter nativo** (los
  frameworks ignoran `el.value = x`) y dispara los eventos que espera el motor:

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

  El contador **"Your response words: N" se actualiza solo** → úsalo como
  verificación (Paso 4). El límite va en el enunciado (p. ej. "maximum 50
  words"): cuéntalo antes de enviar.
  Envío: clic en `[title="Write your answer."]` → aparece un
  `TD.UIMessageBoxLayout` con *"Do you want to submit your answer for
  review?"* → botón **`OK`** de ese message box (V40). Con doble clic se
  apilan **dos** diálogos → itera sobre **todos** y ciérralos.
  **Rúbrica = ley**: lee el enunciado y responde EXACTAMENTE lo que pide (solo
  las personas indicadas, con nombre y apellido, sin meterte en el texto) o la
  revisión del sistema lo penaliza.
- **V40 — API de diálogos (`TD.UIMessageBoxLayout`)**: localízalos e
  inspecciona los botones antes de decidir:

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

  Botones válidos: `OK`, `Cancel`, `Retry`. Sirve para *"Do you want to finish
  the test and get your result?"* (**OK** finaliza y da la nota, **Cancel** vuelve
  a la última pregunta → V42) y para el diálogo de revisión de la escritura.
  **Cierra todos los diálogos apilados, no solo el último.**
- **V41 — Los tests se lanzan con `Iniciar test`** (las lecciones usan
  `Iniciar lección`). El banner dice *"Click here to start the test."* →
  instala el hook `getUserMedia`/`__dynHook` **igualmente**, aunque NO
  aparezca el diálogo de micrófono (V36 solo si aparece).
- **V42 — Navegación dentro del test**: existen `[title="Question #N"]` y
  `[title="Previous"]` → vuelve a una pregunta anterior, corrígela y vuelve a
  avanzar con `[title="Next"]`. En la pantalla final, **`Cancel` en el diálogo
  de finish permite corregir antes de confirmar** (V40).
- **V43 — CRÍTICO: `Next` envía la PREGUNTA COMPLETA, no hueco por hueco**:
  en las preguntas de test con varios `input.Gap` hay que rellenar **TODOS** los
  huecos de la pantalla antes de pulsar `Next`:

  ```js
  () => {
    const gaps = [...document.querySelectorAll('input.Gap')];
    return { total: gaps.length, vacios: gaps.filter(g => !g.value.trim()).length };
  }
  ```

  Si pulsas antes de tiempo, la pregunta se envía con los huecos vacíos y solo
  se recupera con `Previous` (V42). Mismo control para los `<select>`.
- **V44 — Preguntas con desplegables**: las opciones son `<select>` dentro de
  `div.UIControlLangInput`, **uno por imagen**, y **cada select tiene SU PROPIO
  conjunto de distractores** (distintos entre selects) → **no** apliques la
  misma lista a todos. Asigna con el setter nativo:

  ```js
  () => {
    const s = document.querySelector('div.UIControlLangInput select');
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, 'Grandfather');
    s.dispatchEvent(new Event('change', { bubbles: true }));
    s.dispatchEvent(new Event('input', { bubbles: true }));
    return s.value;
  }
  ```

  Empareja select↔respuesta con el XML por el atributo `imagen` de cada
  `<Frase>` **en ORDEN DE DOM** (el eje Y también sirve si no hay scroll).
- **V45 — Selección de frame**: hay varios frames con la misma URL
  `content-packages`. El frame de la lección es el **último** de
  `page.frames()` o el que su `innerText` coincide con el título del paso.
  **Siempre comprueba el texto, nunca tomes el primero.** Cuando varios frames
  siguen vivos, el criterio operativo está en V65 (de derecha a izquierda,
  quedarse con el último que devuelva `{auto: true, step}`).
- **V46 — Descubrimiento del id del XML del test**: el XML del test es el que
  se pide **DESPUÉS** de hacer clic en el banner de inicio (ej. `8218`); los
  XML pedidos antes (ej. `48472`, `3591`) pertenecen a la lección anterior. Para
  una lección normal, el XML principal es el de **id MAYOR** del par (4534
  sobre 244, 4535 sobre 245, 4536 sobre 246). Se obtiene del log de red
  filtrando `lessons/publish`.
- **V47 — Emparejar pregunta↔XML por TEXTO DE INSTRUCCIÓN**: varias
  preguntas comparten texto de instrucción e incluso `dc_id` → casa por el
  **texto exacto visible** ("Select the correct word for the picture.",
  "Select the number that corresponds to each image.", "Fill in the gaps.")
  **y además** por el conjunto de opciones/imágenes que hay en pantalla.
  Referencia: XML `8218` (test Unidad 2) con 23 bloques `tipo="34"` y 140
  `tipo="30"`.
- **V48 — Regla de respuesta correcta en el XML**: dentro de
  `[opción1|-opción2|-opción3]` la correcta es la **primera que NO empieza por
  `-`**. Ojo: a veces el guion cae **fuera** del corchete por apóstrofo
  (`You'[re]` → la correcta es `re`).

### Motor Dexway — Unidad 3: showroom, matching de imágenes y driver reutilizable (ronda 11) — V49-V56

Mismos frames que V31/V32 y selección de frame por V45. Todo lo de abajo va en
el **frame de la lección** salvo el diálogo de micrófono (V36).

- **V49 — Inyecta con `page.addInitScript`, no parcheando a mano**: el script se
  ejecuta en **TODOS los frames** y en **cada navegación futura**, así que
  desaparecen los dos fallos más caros: *"el hook se perdió al recargar"* y
  *"el micrófono se pidió antes del parche"*. Regla: `addInitScript` **antes**
  de `page.reload()`, nunca después.

  ```js
  async (page) => {
    page.on('dialog', d => d.accept());   // V49/V55: ANTES de recargar
    await page.addInitScript(() => {
      if (window.__dynHook) return;
      window.__dynHook = true;
      // 1. parche de micrófono + window.__DexFake  (V31, fallback V36)
      // 2. driver window.__auto                     (V56)
      // 3. contexto de diagnóstico, obligatorio en CADA frame:
      window.__ctx = {
        href: location.href,
        texto: () => document.body.innerText,
        fake: !!window.__DexFake,
        audio: window.__lastAudioSrc || null,
      };
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  ```

  El contexto que debe poder leerse en cualquier frame con una sola llamada:
  `location.href`, `document.body.innerText`, `window.__DexFake` y
  `window.__lastAudioSrc`. Con `addInitScript` deja de ser necesario
  "reinstalar el hook en cada lección" (V31/V38): si el parche se registra
  después del `reload`, el frame ya nació sin él y `getUserMedia` se llamó sin
  interceptar → vuelve el diálogo de micrófono (V36) y el paso se bloquea.

- **V50 — `UIExerImageIdentification` (matching foto ↔ frase)**:
  - El elemento clicable **NO es el `img`**: es su contenedor `div.Item` (el
    `img` está dentro). Clicar el `img` no dispara el handler.
  - El audio de la frase se oye, pero **la frase puede no estar escrita en
    pantalla**: no la busques en el DOM.
  - Vía fiable = leer el **id de voz** del MP3 que se acaba de reproducir:

    ```js
    () => (window.__lastAudioSrc || '').match(/(\d+)\.mp3/)
    ```

  - Ese número se mapea `voz → imagen` con el XML (bloques `tipo="2"`,
    `<Frase imagen="X.jpg" voz="N">`). Ciclo por ítem: pulsar
    `[title="Repeat"]` → esperar a que **cambie el id de voz** → clicar el
    `div.Item` correcto.
  - El ítem acertado recibe la clase `ZoomingOut`, pero **un clic erróneo
    también la aplica**: `ZoomingOut` NO significa "acertado", solo
    "procesado".
  - `Next` permanece `Disabled` hasta acertar el número de ítems de la ronda.
    Al pulsar `Next` el número de paso puede no cambiar: aparece una **ronda
    interna** nueva con `itemsZoom` a 0 → sigue resolviendo, no busques otra
    lección.

- **V51 — Showroom / `UIExerAnimation`**: los clicables son
  `img.AnimacionFlash2_GreenClue` y las imágenes van embebidas como URI
  `data:` en base64, **sin nombre de archivo** → no se pueden mapear por
  nombre (V1). La señal de avance es que **cambia el MP3 en curso** al pulsar
  una. **CRÍTICO: en los pasos de showroom el botón `Next` NO responde a
  `element.click()` de JavaScript**; hay que hacer **clic real** con
  `page.mouse.click()` sobre el centro del botón (bounding box del
  `frameElement()` + `getBoundingClientRect()` del elemento). El mismo
  problema aparece en algunos pasos de escritura de nacionalidades.

- **V52 — Radios como `img.Radio`, no solo `input.Radio`**: en los ejercicios
  de banco de palabras (p. ej. *"Fill in the gaps with the forms of 'to be'
  from the list"*) las opciones son `<img class="Radio">` dentro de
  `<span id="UIControlLangInput_1_N">` y la etiqueta está en el `<td>` de la
  fila. Cuenta y clica siempre con un selector que cubre ambos casos y localiza
  la opción por el texto de la fila:

  ```js
  () => [...document.querySelectorAll('input.Radio, img.Radio')].map((r, i) => ({
    i,
    fila: (r.closest('tr') || r.parentElement).innerText.replace(/\s+/g, ' ').trim(),
  }))
  ```

  Con `input.Radio` a secas se obtiene 0 elementos y el paso no avanza nunca.

- **V53 — Frase a completar: sujeto y forma de "to be"**: la frase está en
  `div.UIControlLangInput > p` y el **sujeto es el primer
  `span.DictionaryWordLink`** de ese `<p>` (no está en el `<td>` ni en el
  enunciado). Regla para "to be": sujeto `I` → `am`; `you`/`we`/`they` o
  sustantivo en plural (termina en `s`/`sh`/`ch`/`x`/`z`) → `are`;
  `he`/`she`/`it`/`that`/`who`/`there`/`this`/`whose` → `s` (posesivo);
  nombre propio o sustantivo singular → `is`.
  **Trampa de parseo**: para localizar el banco de palabras usa la **cadena
  completa** (`"am are is s"`) como delimitador, NUNCA `indexOf('s')` — la `s`
  aparece antes dentro de palabras como `countries` y ese error produjo
  respuestas siempre `"is"`.
  Si el sujeto está partido en varios nodos (`He'` + hueco) hay que leer
  `childNodes`, y hay que normalizarlo antes de comparar: V66/V67.

- **V54 — `Show solution` es de un solo uso por ronda**: tras pulsarlo el botón
  queda `Button SOLUTION Disabled` y el `input.Gap` desaparece (queda el texto
  completo). Es válido en pasos de escritura de frases, pero **consume el
  recurso de la ayuda y baja la nota**: úsalo solo cuando el agente no puede
  derivar la respuesta, **avisando al usuario** y **nunca dentro de un bucle**
  (V58).

- **V55 — Reiniciar la lección sin perder progreso**: `page.reload()` +
  aceptar el `beforeunload` (registra `page.on('dialog', d => d.accept())`
  **antes** de recargar, o usa `browser_handle_dialog`) devuelve al índice del
  curso; hay que volver a pulsar `Iniciar lección` y reanudar en el paso
  guardado (V38). Comprobado que a veces el progreso de un step **no** se
  guarda y se reinicia en el paso 1, y a veces sí → nunca des por hecho que
  existe un paso guardado.

- **V56 — Driver reutilizable `window.__auto`** (inyectado por `addInitScript`,
  V49): un único objeto con API estable; como persiste en el frame, las
  llamadas posteriores son de **1 línea**.
  API: `state()` (devuelve `step`, `kind`, `gaps`/`gapsEmpty`, `radios`,
  `sels`, `boxes`, `items`/`itemsZoom`, `cards`/`marked`, `recDis`, `nextDis`,
  `sol`, `audio`, `msg`), `skipVideo()`, `next()`, `prev()`, `play()`,
  `record(ms)`, `word(ms)`, `clickItem(file)`, `zoomed(file)`,
  `answerImg(mapa)`, `sentence()`, `clickBox(txt, side)`, `pairsState()`,
  `setSelects(arr)`, `fillGaps(arr)`, `clickRadioByText(txt)`,
  `closeMsg(which)`, `markAll()`, `solution()`, más `radios()` y
  `radioLabels()`.

  `kind` se calcula por la clase de `.UIMainScreenContent`
  (`UIExerImageIdentification` → `imgIdent`, `UIExerPairs` → `pairs`,
  `UIExerAnimation` → `showroom`, `UIExerVideo` → `video`); si no hay clase
  reconocible, decide por presencia de `select` / `input.Gap` /
  `input.Radio` / `img.Radio` / `.Card` / `[title="Record voice"]`:

  ```js
  () => {
    const c = document.querySelector('.UIMainScreenContent') || {};
    const k = String(c.className || '');
    if (k.includes('UIExerImageIdentification')) return 'imgIdent';
    if (k.includes('UIExerPairs')) return 'pairs';
    if (k.includes('UIExerAnimation')) return 'showroom';
    if (k.includes('UIExerVideo')) return 'video';
    if (document.querySelector('select')) return 'selects';
    if (document.querySelector('input.Gap')) return 'gaps';
    if (document.querySelector('input.Radio, img.Radio')) return 'radios';
    if (document.querySelector('.Card')) return 'vocab';
    if (document.querySelector('[title="Record voice"]')) return 'record';
    return 'other';
  }
  ```

  Ciclo por paso (1 llamada): `state()` para clasificar → la acción del `kind`
  → `state()` para verificar (V43: `gapsEmpty === 0`) → `next()`.

### Motor Dexway — Unidad 3: artículos, interrogativos y dispatcher seguro (ronda 12) — V57-V69

Mismos frames que V31/V32 y selección de frame con V65. Todo lo de abajo va en
el **frame de la lección**. Además de las tres reglas duras del principio, esta
ronda cierra los agujeros que hicieron perder puntos en "Where I'm from".

- **V57 — VERIFICAR ANTES DE AVANZAR (regla dura, no negociable)**: escribir →
  **leer el valor real del campo** → **comparar string exacto** con lo que se
  quiso escribir → **solo si coincide, pulsar `Next`**. Si no coincide, **no**
  se avanza. Motivo real: en el paso 7 la respuesta se registró **dos veces
  seguidas** porque la primera no fue aceptada.

  ```js
  const v = await frame.evaluate(() => document.querySelector('input.Gap').value);
  if (v !== ans) break;
  ```

  Un `log: "-"` es una señal, **no** una verificación: escribe "value" cuando el
  valor no ha cambiado, no cuando el motor lo ha aceptado.

- **V58 — `Show solution` SOLO como último recurso y AVISANDO al usuario**:
  prohibido dentro de un bucle/dispatcher automático. Cuando la regla
  gramatical no derive la respuesta, **parar y preguntar**. En esta sesión se
  usó en bucle y resolvió pasos completos con la respuesta revelada, lo que
  degrada la calidad del trabajo (amplía V54).

- **V59 — UN CAMBIO DE PASO NO SIGNIFICA "RESUELTO"**: en el paso 20 (artículos)
  la app avanzó sola a la 21 sin que nadie respondiera, y `Previous` **NO** lo
  recupera (el botón sí funciona, pero no vuelve a un paso no validado). Para
  dar un paso por bueno hay que comprobar el **estado interno** (`gapsEmpty ===
  0` con el hueco ya cerrado, o el radio marcado), **NUNCA** el número de paso.
  Consecuencia real: el paso 20 quedó sin responder y la pérdida de nota fue
  irrecuperable en esa pasada.

- **V60 — NUEVA CLASE: popup de DICCIONARIO**. En *"Showroom: interrogative
  pronouns"* se abre un modal de diccionario con `[title="Close"]`, elementos
  `div.Item.Zoomed` y botón `Repeat`. Si no se cierra, el paso **aparenta no
  tener `Repeat`** y el dispatcher se atasca inventando que "no hay Repeat".
  Procedimiento: si existe `[title="Close"]`, cerrarlo con **clic real** y
  volver a leer el estado; después queda en modo `record` ("Listen and repeat")
  con varias frases. Ojo: el diccionario **se reabre en cada frase del mismo
  paso** → comprobarlo en **cada** iteración, no solo la primera.

- **V61 — `kind:'other'` + hueco cerrado = ítem YA resuelto**: tras aceptar la
  respuesta el `input.Gap` desaparece y `kind` pasa a `other` con `gapsEmpty:
  0`. En ese estado **no hay que rellenar nada**: solo pulsar `Next` para pasar
  al siguiente ítem. No lo trates como un paso sin resolver.

- **V62 — Dos plantillas distintas de "oraciones", NO son la misma regla**:
  - Plantilla *"Write the correct nationality"*: la pantalla ya dice
    `"X is in Y."` + hueco → el hueco es la **CLÁUSULA COMPLETA** con sujeto y
    nacionalidad. Ejemplos verificados: `Heidi / Vienna` → `She is Austrian`
    (o `She's Austrian`); `Georgio / Rome` → `He is Italian`. Confirmado en el
    XML: `Heidi is in Austria. [She is Austrian|She's Austrian | she is
    Austrian | she's Austrian]`.
  - Plantilla *"Consolidation / Make a sentence"*: la pantalla solo dice
    `"Nombre / Nacionalidad"` → el hueco es la **FRASE COMPLETA con punto
    final**. Ejemplos verificados: `Julia / Chilean` → `Julia is Chilean.`
    (el XML solo trae este ejemplo: es producción libre); `Otto / German` →
    `Otto is German.`; `Rob / Irish` → `Rob is Irish.` (ojo: `Irish` ya es la
    nacionalidad, NO escribir "Irish nationality"). Sujeto compuesto →
    `are`: `Valeria and Mariana / Mexican` → `Valeria and Mariana are
    Mexican.`

  ```js
  const partes = frase.split('/').map(s => s.trim());
  const suj = partes[0].replace(/\.$/, '');
  const nat = partes.slice(1).join('/').trim().replace(/[.]$/, '');
  const plural = /\band\b/i.test(suj) || /\bthey\b|\bwe\b|\byou\b/i.test(suj);
  return suj + ' ' + (plural ? 'are' : 'is') + ' ' + nat + '.';
  ```

- **V63 — Interrogativos: la RESPUESTA textual determina el interrogativo**
  (verificado en el XML de la lección 4538):
  - `Because ...` → **Why** (`Why are you happy? / Because it is my birthday.`)
  - `He/She/They/We + is/are` → **Who** (`Who is this girl? / She is my
    sister.`)
  - `My name is ...` → **What** (`What is your name? / My name is Daun.`)
  - `I am fine. Thank you.` → **How** (`How are you?`)
  - `Where ...` en la frase → **Where**; `When ...` → **When**

  Trampa real: `How are you happy?` NO existe; el enunciado **forces** `Why`.
  Cuando la regla no derive una respuesta clara, **parar** (V58).

- **V64 — Radios: el clic REAL es obligatorio**. `element.click()` desde
  JavaScript puede no registrar la selección y disparar un `alert` nativo con
  el texto `Select the correct option.`. Usa siempre `page.mouse.click()`
  sobre el centro del `getBoundingClientRect()` del `input.Radio` o `img.Radio`.
  Recuerda que en este tipo de ejercicio los radios son `img.Radio` (no
  `input.Radio`) y la etiqueta está en el texto del `<td>` de la fila (V52).

- **V65 — Selección de frame**: recorre `page.frames()` de **DERECHA a
  IZQUIERDA** y quédate con el **último** frame que devuelva
  `{ auto: true, step: truthy }`. El criterio laxo `!!window.__auto` falla con
  errores transitorios de evaluación y produce falsos "no frame".

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

  Complementa V45: "último frame" no significa "el primero que responde".

- **V66 — Cómo leer el sujeto: `childNodes`, NUNCA `children`**. El sujeto
  puede vivir en un **nodo de texto** (`He'` + hueco), no en un elemento; con
  `children` el índice del hueco es 0 y la frase queda vacía, provocando que la
  regla devuelva siempre `is`.

  ```js
  for (const n of p.childNodes) {
    if (n === gap) break;
    out += (n.textContent || '');
  }
  ```

  Detección de hueco **PENDIENTE**: `span[id$="_listsource"]` o
  `span[style*="dotted"]` cuyo
  `textContent.replace(/\u00a0/g, '').trim() === ''`. OJO: el hueco ya resuelto
  conserva `style="border-bottom: 1px dotted black"`, así que **el estilo NO
  sirve** para saber si falta; y en los Consolidation el hueco es un
  `<input class="Gap">` real (id `UIControlLangInput_35_1`), no el `span`.

- **V67 — Normalizar el sujeto antes de comparar**: `.replace(/[^a-z]/g,
  '')`, porque `He'` debe compararse como `he`. Sin esto,
  `/^(he|she|it|...)$/` falla y la respuesta sale `is` en vez de `s`, la app
  rechaza y el paso se atasca.

- **V68 — Showroom (`UIExerAnimation`)**: las imágenes van embebidas como URI
  `data:` en base64, sin nombre de archivo, así que **NO** se pueden mapear por
  nombre (V1/V51). Se hace clic en cada `img.AnimacionFlash2_GreenClue` (**el
  clic JS sí funciona aquí**) y el avance real es **el cambio de MP3 en curso**.
  El `Next` del showroom **requiere clic real de ratón**: con `element.click()`
  no responde.

- **V69 — Regla de *to be* completa y sus dos variantes**:
  - **Forma larga** (opciones `am/are/is/s`): sujeto `I` → `am`;
    `you/we/they`, o sujeto compuesto con `and`, o sustantivo en plural (termina
    en `s/sh/ch/x/z`) → `are`; `he/she/it/that/who/there/this/whose` (también
    con el apóstrofo pegado: `He'`) → `s` (posesivo); nombre propio o singular →
    `is`.
  - **Forma corta** (opciones `is/m/re`): `I'` → `m`; `you/we/they'` → `re`;
    resto → `is`.

#### Receta rápida por tipo de exercise (Dexway)

| Tipo de exercise | Acción exacta a ejecutar |
| --- | --- |
| Warm-up de vocabulario (`record`) | `Repeat` (hook de `play` → `__lastAudioSrc`) → `__DexFake.setUrl()` → `Record voice` → esperar `Play`/`Stop` → verificar `__scoreResp` (≥60) → `Next` (V31) |
| Matching por imagen (`select`) | Un `div.UIControlLangInput select` por imagen; setter nativo `HTMLSelectElement.prototype.value` + `change`/`input`; mapear por `imagen` del XML en orden de DOM (V44) |
| Radios / opción múltiple | `input.Radio, img.Radio` (V52) ↔ palabra de la fila por coordenada **Y** o por texto de `radio.closest('tr')`; `nth(i).click({force:true})` → `Next` (V32) |
| Radios como `img.Radio` (banco de palabras) | `document.querySelectorAll('input.Radio, img.Radio')`; etiqueta en el `<td>` de la fila (`<span id="UIControlLangInput_1_N">`); clic + `Next` (V52) |
| Huecos `input.Gap` | Setter nativo `HTMLInputElement.prototype.value` + `input`/`change`; **rellena TODOS** y cuenta los vacíos antes de `Next` (V43) |
| Consolidación con frase completa ("Make a sentence") | La pantalla solo dice `Nombre / Nacionalidad` → escribe la FRASE COMPLETA con punto final (`Julia is Chilean.`); sujeto compuesto con `and` → `are` (V62) |
| Nacionalidad con hueco en la frase ("Write the correct nationality") | La pantalla ya dice `"X is in Y."` + hueco → escribe solo la CLÁUSULA (`She is Austrian`), no la frase entera (V62) |
| Artículos (`a/an/the`) | Mismo submotor de huecos, pero **el paso puede avanzar solo**: verifica `gapsEmpty === 0` y el radio marcado, nunca el número de paso, y no pulses `Next` con el hueco pendiente (V57/V59) |
| Interrogativos | El **interrogativo lo determina la respuesta textual** (`Because…`→Why, `He/She/We + is/are`→Who, `My name is …`→What, `I am fine. Thank you.`→How, `Where…`/`When…`); si la regla no deriva una respuesta clara, **para y pregunta** (V63/V58) |
| Popup de diccionario | Si existe `[title="Close"]`, ciérralo con clic real y vuelve a leer el estado: oculta el `Repeat` y atasca el paso; se reabre en cada frase del mismo paso (V60) |
| Ítem ya resuelto | `kind:'other'` con `gapsEmpty: 0` y sin `input.Gap` → no rellenes nada, solo `Next` (V61) |
| `Show solution` | Clic en `[title="Show solution"]` → leer el texto revelado (es la respuesta) → `Next`; **un solo uso por ronda**: luego queda `SOLUTION Disabled` y sin `input.Gap` (V54). Solo último recurso, **avisando al usuario** y **nunca en bucle** (V58) |
| `Repeat` / `Record voice` (doblaje) | **Una sola** reproducción, disparo en `pointerdown` capture + debounce ~800 ms; verificación = `word\|score` del POST a `voicerecog.cae.net` (V31) |
| `UIExerPairs` | Clic-clic con `page.mouse`: `.Box.Left` (`EsperandoIzquierda` → `EsperandoDerecha` + clase `Pulsa`) → `.Box.Right`; verificar por la **clase del `div.UIExerPairs`**, nunca por canvas (V37) |
| Showroom / `UIExerAnimation` (nacionalidades) | Clic en `img.AnimacionFlash2_GreenClue` (imágenes `data:` base64, sin nombre de archivo); la señal de avance es que **cambia el MP3 en curso** (V51) |
| `UIExerImageIdentification` (foto ↔ frase) | `Repeat` → leer id de voz `(window.__lastAudioSrc \|\| '').match(/(\d+)\.mp3/)` → clicar el `div.Item` de esa voz (**no** el `img`); `ZoomingOut` ≠ acertado; esperar a que `Next` salga de `Disabled` (V50) |
| `UIExerVideo` (doblaje/escucha) | `video.playbackRate = 16; video.currentTime = video.duration` → esperar ~2,5 s → `Next`; aquí NO se graba voz (V35/V32) |
| `<select>` desplegable | Setter nativo + `change`/`input`; un select por imagen y distractores propios por select (V44) |
| Writing assignment | Setter nativo `HTMLTextAreaElement.prototype.value` + `input`/`change` → validar "Your response words: N" → `[title="Write your answer."]` → `OK` del `TD.UIMessageBoxLayout` (V39/V40) |
| Test de unidad | `Iniciar test` → banner → `Question #N` / `[title="Previous"]` / `[title="Next"]` → fill completo → diálogo finish → **OK** (V41-V43) |

**Nota — clic real obligatorio en radios y en el `Next` del showroom**: hay
controles cuyo handler está en un listener que ignora `element.click()` de
JavaScript. Son dos los casos confirmados:

- **Radios (`input.Radio` / `img.Radio`)**: el clic sintético puede no registrar
  la selección y dispara un `alert` nativo *"Select the correct option."* →
  `page.mouse.click()` sobre el centro del `getBoundingClientRect()` (V64).
- **`Next` del showroom y de algunos pasos de escritura de nacionalidades**:
  no responde a `element.click()` → `page.mouse.click()` sobre el centro del
  botón (bounding box del `frameElement()` + `getBoundingClientRect()` del
  elemento), no con un clic sintético (V51/V68).

En el showroom el clic JS **sí** vale para las imágenes
`img.AnimacionFlash2_GreenClue`; lo que no acepta clic sintético es el `Next`
(V68).
