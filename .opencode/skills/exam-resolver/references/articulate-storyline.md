# Motor Articulate Storyline (V24-V30)

Hallazgos de la ronda 6 (SENA Placement Test). **Cárgalo solo cuando
reconozcas el motor** (ver tabla "Dispatcher de motores" en `SKILL.md`).

Fingerprint: slides en `html5/data/js/*.js` con
`window.globalProvideData('slide', …)`, motor en `html5/lib/scripts/app.min.js`,
controles `.cs-button`, clase `slide-object-*`, raíz `#preso`.

## Motor Articulate Storyline (ronda 6 — SENA Placement Test)

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

