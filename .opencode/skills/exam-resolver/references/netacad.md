# Motor NetAcad — Cisco Skills for All (`netacad.com`)

Evidencia: **Ronda 25**, `www.netacad.com` (Cisco Networking Academy / Skills
for All), sesión autenticada 2026-10-29 (V89 en `docs/pruebas-reales.md`).
Registro: `resolveLogs/2026-10-29_netacad.com/`.

Examen resuelto: *"Evaluación del curso de Introducción a la IA moderna"*
(`i2mai`, `es-XL`) → **80/100 (80%)**, umbral 70%, aprobado.

> **Alcance de esta evidencia**: 1 curso (`i2mai`), 1 examen final adaptativo de
> **10 preguntas**, formato **checkbox multiselección** con "Elija N", uno por
> pantalla. Lo que sigue sin evidencia está en "Por confirmar": no lo des como
> hecho.

## Fingerprint (carga este archivo si aparece)

- URL de entrada `www.netacad.com/launch?id=<uuid>&tab=curriculum&view=<uuid>`
  → redirige a **Google OAuth** si no hay sesión (V12).
- Página principal: **Course Outline** con árbol `[role=treeitem]` (botones
  `#node-button-<uuid>`, `#submodule-button-<uuid>`) y pestañas
  `a#Launch-tab-content` / `a#Launch-tab-gradebook`.
- El contenido se sirve en un **iframe**:
  `www.netacad.com/authoring-resources/index.html?xAPILaunchKey=<uuid>&…#/courses/<uuid>/<uuid>/id/<uuid>`
- Actividad xAPI: `/adl/content/launch/<key>`,
  `/adl/data/<key>/statements`, `/adl/data/<key>/activities/state`.
- Widget del examen: clases `secure-one-question__widget`,
  `adaptive-start-screen`, `assessment-toolbar`, `review-screen-button`.
- El texto del curso va en **es-XL** (español latinoamericano).

## Estructura observada

| Pieza | Detalle |
| --- | --- |
| Landing | Course Outline: "Módulo 1 … 100%", y el nodo del examen con su % de progreso. El examen pendiente aparece en **0%**. |
| Instrucciones | `adaptive-start-screen-view` → "El examen consta de N preguntas y se requiere el 70% para aprobar y obtener la insignia Credly verificada de Cisco. Tienes unlimited attempts… No tiene límite de tiempo por intento". Botón de inicio: **`div.start-button.start[role=button]`** (no es `<button>`). |
| Pregunta | `mcq-view`: enunciado en su `base-view` (shadowRoot), opciones como `input[type=checkbox]` (multiselección) o `input[type=radio]`. El texto de cada opción está en `label[for=<id>-input]`. |
| Toolbar | `assessment-toolbar-view`: temporizador (`timer-end-current-time`), contador "N de M Preguntas", botones "Omitir todo" / "Omitir pregunta" / **"Enviar"** (`button.submit-button`). |
| Navegación | `assessment-block-strip-view`: botones `Q1…QN` (`button.block-button`) + **"Enviar página"** (`button.block-button.last-block.review-screen-button`). |
| Envío | `finalscreen-view`: "¿Está seguro de que desea enviar el cuestionario?" + **checkbox `#confirm-exam`** + botón **"Enviar"**. |
| Resultado | El estado del curso pasa a **"Completo"** y el strip muestra "Página de resultados". La nota **solo** está en el Gradebook. |

## El examen vive en SHADOW DOM ANIDADO (hallazgo principal)

`document.body.innerText` devuelve **vacío** y ningún selector CSS normal llega
al contenido. La cadena es:

```text
iframe[src*=authoring-resources]
  └─ app-root                      (shadowRoot)
       └─ page-view                (shadowRoot)
            └─ article-view        (shadowRoot)   ← varios; el del examen es el que contiene block-view con mcq
                 └─ block-view     (shadowRoot)
                      └─ mcq-view / adaptive-start-screen-view / finalscreen-view   (shadowRoot)
```

- **Hay que recorrer los `shadowRoot` recursivamente** buscando por etiqueta
  (`MCQ-VIEW`, `ASSESSMENT-TOOLBAR-VIEW`, `ASSESSMENT-BLOCK-STRIP-VIEW`,
  `FINALSCREEN-VIEW`). No hace falta conocer la ruta: una búsqueda recursiva
  basta y es más robusta ante cambios de layout.
- El `textContent` de cada shadowRoot viene **contaminado por CSS inyectado**
  (cientos de bytes de `.reduce-margin-top { … }`). Limpia antes de leer:

  ```js
  const limpiar = t => (t||'').replace(/\\{[^}]*\\}/g,' ')
                               .replace(/--[a-zA-Z0-9-]+\\s*:[^;]*;?/g,' ')
                               .replace(/\\s+/g,' ').trim();
  ```

- El enunciado completo **no** está en `mcq-view`: está en el `base-view` de su
  shadowRoot. Las opciones, en el shadowRoot de `mcq-view`.
- Varios `article-view` conviven en el DOM; los ocultos llevan
  `style="display: none"`. El del examen es el que contiene `MCQ-VIEW`.

## `<app-root>` vacío ≠ fallo

Al cargar, `app-root.innerHTML.length === 0` y parece que la SPA no arrancó.
**No lo es**: el contenido está en su `shadowRoot`. Comprueba
`app-root.shadowRoot` antes de rendirte.

Los errores de consola (Splunk RUM `403`, Webex `401`, AppDynamics) son
**ruido de trackers**, no bloqueos. Los assets del curso sí cargan con `200`
(`course.json`, `contentObjects.json`, `articles.json`, `blocks.json`).

## `xAPILaunchKey` de un solo uso

Reutilizar la URL del iframe tras un relaunch devuelve **403/404 en
`/adl/content/launch/<key>`**. Para recargar: vuelve al `launch` y reabre el
nodo del curso (`#node-button-<uuid>`) para obtener una key nueva. **No
reintentes la misma key** (V86: verifica el estado, no la llamada).

## Flujo de envío (4 pasos)

```text
1. div.start-button[role=button]                      → "Iniciar"
2. button.submit-button (assessment-toolbar-view)     → "Enviar"  (por pregunta)
3. button.block-button.last-block (strip)             → "Enviar página"
4. #confirm-exam + button "Enviar" (finalscreen-view) → envío definitivo
```

Trampas confirmadas:

- **"Enviar página" no responde si el toolbar está vacío.** Tras un relaunch la
  app restaura el intento pero el toolbar no se renderiza. **Corrección**: haz
  clic en una pregunta del strip (`Q5`) para re-renderizarlo; entonces
  "Enviar página" gana la clase `review-screen-button` y funciona.
- **`click()` sintético insuficiente** en algunos momentos: se despachan
  pointerdown/mousedown/pointerup/mouseup/click sin que nada cancele y no
  ocurre nada. Con el toolbar re-renderizado **sí** funciona el `click()`. Si
  falla, usa un **clic real del navegador por coordenadas**:
  `abs = iframe.getBoundingClientRect() + btn.getBoundingClientRect()`.
- **Bug de ids en el checkbox de confirmación**: el `label` es `for="confirm"`
  pero el `input` es `id="confirm-exam"` → clickear el label **no** marca.
  Clickea el **input**.
- **`aria-checked` no se actualiza** (queda `"false"` pese a `checked=true`),
  ni con eventos `change`/`input` sintéticos. **No sirve de verificación**:
  verifica por `cb.checked`, que es lo que lee el handler.

## Resultado y puntuación

- Los `POST /adl/data/<key>/statements` del envío son verb **`completed`** con
  `result.completion: true` — **sin `score`**. **La nota no va por xAPI.**
- La nota está en el **Gradebook** (`a#Launch-tab-gradebook`):
  `STATUS Graded` / `FINAL GRADE 80/100`, y "Assessment Average".
- El detalle del intento (`…&activeTab=submissions&attempt=1`) tampoco expone
  **veredicto por pregunta** → no se puede saber qué ítems fallaron.
- El assignment declara `PREREQUISITE: Encuesta final del curso` — no bloqueó
  el examen en esta ronda.

## Por confirmar

1. Variantes de pregunta: aquí todo fue **checkbox multiselección con "Elija
   N"** más alguna de opción única. Falta confirmar fill-in, drag & drop y
   matching.
2. Si el banco de preguntas cambia entre intentos o solo se reordenan las
   opciones. **En esta ronda se reordenaron**: en la pregunta 1 la opción "Tu
   camisa es de un color similar al borrador" pasó de la posición 2 a la 1
   entre el primer intento y la reapertura → **matchear siempre por texto**
   (V88b), nunca por índice ni letra.
3. Comportamiento de un **segundo intento** (el examen permite ilimitados): no
   se hizo porque el objetivo (70%) ya se cumplió.
4. Si la insignia Credly llega automáticamente al superar el 70%.
