# Motor Moodle — `mod/quiz`

Evidencia: **Rondas 14-20, 22, 23, 23b y 24**, `cdigital.cun.edu.co`
(CUN) y `zajuna.sena.edu.co` (SENA), sesiones autenticadas 2026-10-15 a
2026-10-20, 2026-10-27 y 2026-10-28 (V77-V84, V86-V88 en
`docs/pruebas-reales.md`).
Volcados/sesión: `resolveLogs/2026-10-15_cdigital.cun.edu.co/`,
`resolveLogs/2026-10-16_cdigital.cun.edu.co/`,
`resolveLogs/2026-10-16_zajuna.sena.edu.co/`,
`resolveLogs/2026-10-20_cdigital.cun.edu.co/`,
`resolveLogs/2026-10-27_cdigital.cun.edu.co/` y
`resolveLogs/2026-10-28_cdigital.cun.edu.co/`.

> **Alcance de esta evidencia**: r14-r16, r19-r20, r22-r23 y **r24** (CUN): opción
> única, **1 por página** (r14-r16, r19, **r24 = 20 páginas de 1 Q**) y **2 por
> página (r20, r22, r23)**, interfaz en **español**, tema Bootstrap/moove.
> r17-r18 (SENA/Zajuna): checkbox doble y radio, tema **YUI**, nota con coma
> decimal. Lo que sigue sin volcado/evidencia está en la lista "Por confirmar":
> no lo des como hecho.

## Fingerprint (carga este archivo si aparece)

- Landing `/mod/quiz/view.php?id=<cmid>` y intento `/mod/quiz/attempt.php?attempt=…&cmid=…&page=N`
  (resumen `/mod/quiz/summary.php?attempt=…&cmid=…`). `view.php`, `attempt.php` y
  `summary.php` confirmados; `review.php` visto en SENA (r17) y **otra vez sin
  aparecer en CUN** (r19/r20).
- Bloque lateral **"Navegación por el cuestionario"** con enlaces `Pregunta N`
  (el actual con el texto **"Esta página"**) y al final **"Terminar intento..."**.
- Por pregunta: h3 `Pregunta N` + **"Se puntúa como 0 sobre 1.0"** +
  h4 **"Enunciado de la pregunta"** + `group "Pregunta N Respuesta"`.
- Todas las cadenas de interfaz comprobadas están en **español**: con Moodle en
  inglés solo casaría la URL, revisar los textos locales al encontrarlo.

## Estructura observada

| Pieza | Detalle |
| --- | --- |
| Landing | `view.php?id=<cmid>`: datos del quiz (intentos permitidos, tiempo límite, nota de aprobación) + botón **"Intento de cuestionario"** → **diálogo** "Comenzar intento" con aviso de tiempo límite → botón "Comenzar intento" del diálogo **inicia el cronómetro**. |
| Paginación | **1 pregunta por página** en r14-r16 (CUN) y r17-r18 (SENA); **2 por página (5 páginas) confirmado en r20** (CUN, cmid 7941967). **En Moodle las preguntas por página las configura el profesor**: cuenta los `group "…Respuesta"` de la página antes de asumir; el título de la pestaña (`página N de M`) y los enlaces `Pregunta N` del navegador dan el total. |
| Avance inferior | Botón `#mod_quiz-next-nav` (input submit) con texto **"Siguiente página"**; en la **última página** ese mismo botón cambia a **"Terminar intento..."** y envía el formulario `#responseform` (`action=…/processattempt.php`). El selector `#next-page` **no existe** en esta plantilla: usar `text=Siguiente página` o `#mod_quiz-next-nav`. **R16 reconfirmado**: `#mod_quiz-next-nav` funcionó en las 19 transiciones; en varias la navegación **sí se completó** pese al `TimeoutError 5000ms` de MCP — verificar título/URL (o el `qnbutton`) antes de reintentar. **R19 (V83)**: ese timeout pudo terminar en **HTTP 404 de `processattempt.php?cmid=…` sin `attempt`** → recuperar por URL directa `attempt.php?attempt=…&page=N`. **R22 (V86)**: porque el mismo selector significa dos cosas distintas según la página, un reintento a ciegas tras un `execute` fallido **puede pulsar "Terminar intento..." con preguntas sin responder** → leer `location.href` **y** el `value` del botón antes de clicar; un `ref` de snapshot ya no sirve tras navegar. |
| Navegación lateral | Bloque `Pregunta N`… + **"Terminar intento..."** → `summary.php`. |
| Respuesta única | Radios nativos `input[name="q<id>:<page>_answer"][value="X"]` + label con la opción. Clic nativo sobre el input funciona (sin AJAX extra); verificar con `input[name="…"]:checked` (V57). En la **ronda 15** consta que radio y checkbox de chrome de Moodle conviven en la página (ver "Ruido a filtrar"); la r14 no volcó radios. |
| **Tema moove vs otros (V86, r22/r23)** | En la plantilla **moove** del CUN **no existe `div.question`** como contenedor de pregunta: no usarlo como raíz. Sí funcionan **`.qtext`** (enunciado) e `input[type=radio][name^="q"]` agrupados por `name`. El **label de cada opción NO usa `label[for=<id>]`** → `document.querySelector('label[for=…]')` devuelve vacío. **Ojo (corregido en r23)**: la vía `closest('div[id^="answer"]')` anotada en r22 **no es fiable** — en el Parcial 2 los radios cuelgan de `<div class="r0">` dentro de `<div class="answer">` **sin id**, y devolvió vacío. Usar **clase, no id**: **`r.closest('div.r0').innerText`** = una opción con su letra; **`r.closest('div.answer').innerText`** = el bloque completo a/b/c/d de la pregunta. |
| **Guardado (V82)** | **El clic NO guarda**: el auto-save es `POST /mod/quiz/autosave.ajax.php` → `200 {"status":"OK","timeleft":N}`, con ventana de retardo. Una **recarga/navegación inmediata posterior al clic aborta el POST** (`beforeunload`) y la respuesta queda `value=-1` (pasó 3 veces seguidas en r19/r20). Regla: tras marcar, **esperar el POST en `browser_network_requests`** (o al menos no navegar/recargar en unos segundos) y **validar por recarga**: solo `:checked` + `a.qnbutton[title]` **tras recargar** prueban persistencia. |
| **`beforeunload` bloquea todo el MCP (V87, r23)** | Si se navega (por URL o por clic) **antes de que complete el guardado**, Moodle levanta un diálogo nativo `beforeunload`. El MCP devuelve **`Tool "browser_evaluate" does not handle the modal state`** y a partir de ahí **todas** las tools fallan igual. **No es anti-automatización**: es el guard de "cambios sin guardar". **Corrección**: `browser_handle_dialog({accept: true})` → la navegación termina y se recupera el control (resuelto a la primera). **Prevención**: responder → verificar → clic en `#mod_quiz-next-nav` **sin** navegación por URL intermedia (el clic del botón ya guarda vía `processattempt.php`), que así no lo dispara. **Confirmado en r24**: con **2 min de pausa** entre marcar y navegar (ritmo V88) el autosave ya había completado y el guard **no se disparó en 20/20 transiciones** — navegar justo tras marcar es lo que lo provoca. |
| **Navegar y leer en llamadas SEPARADAS (V88c, r23b)** | Tras `browser_navigate` a la página siguiente, el **primer `browser_evaluate` ve el DOM anterior**: devuelve `PAGINA_YA_RESPONDIDA` (u otra página) mientras `document.title` ya es la nueva. Pasó en **7 de 10** transiciones. **Corrección**: navegar en una llamada, responder en **otra**. Devuelve siempre `document.title` junto al resultado y **comprueba coherencia**; si no cuadra, re-evalúa en llamada aparte — no reintentes el clic a ciegas (V86). |
| **Verificación con N preguntas/página (V84)** | `#responseform input[type=radio]:checked` devuelve **varios radios**: uno por pregunta respondida + uno oculto `value="-1"` por cada pregunta **sin responder**. Filtrar `value !== '-1'` o leer el `name` concreto `q<id>:<page>_answer`; `value=-1` tras un clic = la respuesta **no se persistió**. |
| Guardado (títulos) | Tras marcar y navegar, los `a.qnbutton` del navigator llevan el estado real del servidor en el `title`: **"Pregunta N - Respuesta guardada"** / **"Sin responder aún"** y clase `answersaved`/`notyetanswered`. Es la mejor verificación previa al envío; el texto "Sin responder aún" del área de la pregunta **solo se actualiza al recargar/navegar** (en la página activa puede quedar desactualizado aunque el guardado ya esté OK). |
| Marcar para revisar | `button "Marcadas"` con texto visible **"Marcar pregunta"**. No interfiere con la respuesta. |
| Fin del intento | Última página → **"Terminar intento..."** → `summary.php` (tabla `table tbody` con **"N — Respuesta guardada"/"Sin respuesta" por fila**: comprobación barata y fiable de las N respuestas en servidor antes de enviar) → botón `#single_button*` **"Enviar todo y terminar"** → **diálogo** `[role=dialog]` "¿Entregar todas sus respuestas y terminar?" → confirmar con el botón `btn-primary` del modal (**sin `id`**; selector fiable `.modal.show button.btn-primary` o `div[role=dialog] button.btn-primary` de texto "Enviar todo y terminar"). Confirmado de nuevo vuelve a `view.php`. |
| Puntuación | En `view.php`, fila de la tabla de intentos: texto **`Calificación 5.00 de 5.00 (100%)`** (r16) / `4.75 de 5.00 (95%)` (r15) → regex `\d+([.,]\d+)?\s*(de|of)\s*\d+([.,]\d+)?` (**V79**: acotarlo a la fila "Calificación" de la tabla de intentos — `table tbody tr` con celdas `["Calificación", …]` — porque el regex sobre `body.innerText` puede capturar antes el umbral *"Calificación para aprobar: 3.00 de 5.00"*; visto en r16; en r17 SENA la nota viene con **coma decimal** `100,00` → aceptar `[.,]`). La revisión individual **sí existe** como enlace **"Revisión"** en la fila del intento (r17, ver abajo). |
| Revisión (`review.php`) | **R17 visto por primera vez** (SENA): enlace "Revisión" en la fila del intento → `review.php?attempt=…&cmid=…`. Muestra **todas las preguntas en una sola página** (sin paginación ni bloque "Navegación por el cuestionario"), con veredicto **"Correcta"/"Incorrecta"**, "Se puntúa N sobre M" y la respuesta elegida. En CUN (r15/r16) ese enlace no apareció tras enviar — posible configuración del quiz; **sin confirmar** cuál lo habilita. |
| Tema YUI (SENA) vs Bootstrap (CUN) | El diálogo "Comenzar intento" de SENA es YUI: el botón de confirmación es **`<input type=submit value="Comenzar intento" class="btn btn-primary">`** (no `<button>`), y el modal **no tiene la clase `.show`** → `.modal.show input.btn-primary` falla; usar `input[type=submit][value="Comenzar intento"]`. El modal de envío sí expone `button.btn-primary` dentro de `[role=dialog]` (igual que CUN). |
| Checkbox (r17) | Moodle añade un **`input[type=hidden]` con el mismo `name`** que cada checkbox (`q<id>:<page>_choiceN`): un selector `input[name="q…_choice0"]` dispara **strict mode violation** (2 elementos). Usar siempre **`input[type=checkbox][name="q…_choice0"]`**. Verificación: `input[type=checkbox][name^="q<id>:<page>_"]:checked`. |
| Envío con HTTP 500 (r17, r18) / 404 (r19, V83) | Confirmar el envío pudo terminar en `chrome-error://chromewebdata/` (**HTTP 500** del servidor de SENA) y **el intento igual quedó registrado** (visto 2 veces seguidas: r17 y r18). En CUN (r19) el mismo patrón salió como **HTTP 404 de `processattempt.php?cmid=…` sin `attempt`** tras un `TimeoutError` de MCP. Ante un error tras el clic (de envío o de "Siguiente página"): **no reenviar a ciegas**; recuperar por URL directa y/o recargar `view.php` y leer la tabla de intentos (fila "Finalizado / Enviado … / nota"), o `summary.php` si el intento sigue abierto. |
| **V81 — review del intento previo como fuente de claves (r18)** | Si el quiz tiene **varios intentos** y la revisión habilitada, el `review.php` del intento previo expone **veredicto por pregunta** ("Correcta"/"Incorrecta") con la opción marcada, y **el orden de preguntas se mantiene entre intentos**. Estrategia: replicar los valores que el intento previo **acertó** y, en las que **falló**, descartar la opción ya probada y razonar entre las restantes. Se lee **antes de empezar el intento nuevo** (enlace "Revisión" en la tabla de `view.php`). Ir a `view.php`→`review.php` y **regresar al intento por URL directa** (`attempt.php?attempt=…&page=N`) es seguro: el intento sigue abierto y las respuestas guardadas se conservan (verificado en r18: Q7 "Respuesta guardada" al volver). **Método "Calificación más alta"** ⇒ reintentar nunca baja la nota (r18: 79,00 → 93,00). |
| **El banco se REORDENA/RECREA entre intentos (V88b, r23b)** | Ojo con V81: en CUN el **intento 2 trajo preguntas distintas y en otro orden** que el intento 1, **con las opciones también reordenadas** (mismo texto, distinta letra y distinto `value`). El mapa `{pregunta → valor}` construido sobre el intento anterior **no sirve**: falló con `SIN_MATCH`. **Matchear siempre por texto** — de la pregunta **y** de la opción —, nunca por `value`/letra/índice. V81 sigue valiendo **solo** donde haya `review.php` con veredictos por pregunta. |

## Ruido a filtrar en el DOM (ronda 15)

El `body` de `view.php`/`attempt.php` trae chrome de Moodle que confunde una
extracción por `document.querySelectorAll` ingenua: radios
`name="message_blocknoncontacts"`, checkboxes del modal de mensajes
("Borrar para mí y para todos"), `select#jump` ("Ir a…" con las secciones del
curso) y botones "Enviar solicitud de contacto". **Filtra siempre por
`name^="q`** (las preguntas) o por el contenedor `.question`/`#region-main`.

## Por confirmar en la próxima sesión

1. **Variantes de pregunta**: confirmadas opción única (r14-r16, r19-r20) y
   **checkbox múltiple** (r17, Q6 "seleccione dos" — 2 de 2 correctas). Falta
   respuesta corta (`<input>`/`<textarea>`) y true/false.
2. **Moodle en inglés** y quiz con **3+ preguntas por página** (r20 confirmó
   2/página; r14-r19 fueron 1/página).
3. ~~**`review.php`**~~ → **resuelto en r17**: enlace "Revisión" en la fila del
   intento; todas las preguntas en una página con veredicto "Correcta". En CUN
   no apareció ni en r19 ni en r20: sigue sin confirmar qué configuración lo
   habilita.
4. **Botón "Página anterior"**: solo se usó el siguiente en las rondas;
   comprobar su comportamiento (¿descarta cambios no guardados?).
5. **Preguntas mal planteadas por el docente** (r17, Q7: "seleccione tres
   topologías" con control radio): elegir la única respuesta correcta y
   registrar la incidencia; aquí salió "Correcta" igualmente.

## Límites

- Requiere **sesión autenticada** (Moodle exige login): seguir la regla de muros de
  login (V12) — que sea el usuario quien entre, nunca credenciales nuestras.
- Los `ref` de accesibilidad son de esa sesión concreta: **no** reutilizarlos como
  selectores (usa selectores CSS o `text=`).
