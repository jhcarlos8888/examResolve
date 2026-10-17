# Motor Moodle — `mod/quiz`

Evidencia: **Rondas 14, 15 y 16**, `cdigital.cun.edu.co` (CUN), sesiones autenticadas
2026-10-15 y 2026-10-16 (V77, V78 y V79 en `docs/pruebas-reales.md`).
Volcados/sesión: `resolveLogs/2026-10-15_cdigital.cun.edu.co/` y
`resolveLogs/2026-10-16_cdigital.cun.edu.co/`.

> **Alcance de esta evidencia**: 2 intentos, opción única de 1 por página, interfaz
> en **español**. Ronda 15: **20/20 contestadas, 4.75/5.00 (95%) con puntuación
> leída del DOM** (no solo "visible en pantalla" como en la ronda 14). Lo que sigue
> sin volcado/evidencia está en la lista "Por confirmar": no lo des como hecho.

## Fingerprint (carga este archivo si aparece)

- Landing `/mod/quiz/view.php?id=<cmid>` y intento `/mod/quiz/attempt.php?attempt=…&cmid=…&page=N`
  (resumen `/mod/quiz/summary.php?attempt=…&cmid=…`). `view.php` y `summary.php`
  confirmados en ronda 15; `review.php` **sigue sin verse** (sin enlace "Revisar").
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
| Paginación | **1 pregunta por página** en ambas rondas (r15 confirmó `page=0…N`; en r14 el `page=0` inicial no quedó volcado). **En Moodle las preguntas por página las configura el profesor**: cuenta los `group "…Respuesta"` antes de asumir paginación. |
| Avance inferior | Botón `#mod_quiz-next-nav` (input submit) con texto **"Siguiente página"**; en la **última página** ese mismo botón cambia a **"Terminar intento..."** y envía el formulario `#responseform` (`action=…/processattempt.php`). El selector `#next-page` **no existe** en esta plantilla: usar `text=Siguiente página` o `#mod_quiz-next-nav`. **R16 reconfirmado**: `#mod_quiz-next-nav` funcionó en las 19 transiciones; en varias la navegación **sí se completó** pese al `TimeoutError 5000ms` de MCP — verificar título/URL (o el `qnbutton`) antes de reintentar. |
| Navegación lateral | Bloque `Pregunta N`… + **"Terminar intento..."** → `summary.php`. |
| Respuesta única | Radios nativos `input[name="q<id>:<page>_answer"][value="X"]` + label con la opción. Clic nativo sobre el input funciona (sin AJAX extra); verificar con `input[name="…"]:checked` (V57). En la **ronda 15** consta que radio y checkbox de chrome de Moodle conviven en la página (ver "Ruido a filtrar"); la r14 no volcó radios. |
| Guardado | Tras marcar y navegar, los `a.qnbutton` del navigator llevan el estado real del servidor en el `title`: **"Pregunta N - Respuesta guardada"** / **"Sin responder aún"** y clase `answersaved`/`notyetanswered`. Es la mejor verificación previa al envío; el texto "Sin responder aún" del área de la pregunta **solo se actualiza al recargar/navegar**. |
| Marcar para revisar | `button "Marcadas"` con texto visible **"Marcar pregunta"**. No interfiere con la respuesta. |
| Fin del intento | Última página → **"Terminar intento..."** → `summary.php` (tabla: "N Respuesta guardada" por fila) → botón `#single_button*` **"Enviar todo y terminar"** → **diálogo** `[role=dialog]` "¿Entregar todas sus respuestas y terminar?" → confirmar con el botón `btn-primary` del modal (**sin `id`**; selector fiable `.modal.show button.btn-primary`). Confirmado de nuevo vuelve a `view.php`. |
| Puntuación | En `view.php`, fila de la tabla de intentos: texto **`Calificación 5.00 de 5.00 (100%)`** (r16) / `4.75 de 5.00 (95%)` (r15) → regex `\d+([.,]\d+)?\s*(de|of)\s*\d+([.,]\d+)?` (**V79**: acotarlo a la fila "Calificación" de la tabla de intentos — `table tbody tr` con celdas `["Calificación", …]` — porque el regex sobre `body.innerText` puede capturar antes el umbral *"Calificación para aprobar: 3.00 de 5.00"*; visto en r16). La revisión individual (qué pregunta falló) **no estuvo disponible** tras enviar (sin enlace "Revisar"); si la ventana cierra el 18 oct (fecha de la landing) se **infieren** que entonces se habilita — **sin confirmar**. |

## Ruido a filtrar en el DOM (ronda 15)

El `body` de `view.php`/`attempt.php` trae chrome de Moodle que confunde una
extracción por `document.querySelectorAll` ingenua: radios
`name="message_blocknoncontacts"`, checkboxes del modal de mensajes
("Borrar para mí y para todos"), `select#jump` ("Ir a…" con las secciones del
curso) y botones "Enviar solicitud de contacto". **Filtra siempre por
`name^="q`** (las preguntas) o por el contenedor `.question`/`#region-main`.

## Por confirmar en la próxima sesión

1. **Variantes de pregunta**: ambas rondas fueron 100% opción única; faltan
   checkbox múltiple, respuesta corta (`<input>`/`<textarea>`) y true/false.
2. **Moodle en inglés** y quiz con **varias preguntas por página**.
3. **`review.php`** (revisión pregunta a pregunta tras el intento): URL, estructura
   y si muestra la respuesta correcta; útil para nutrir `sesion.md` con la
   pregunta fallada. (Si la ventana cierra el 18 oct, **infiero** que entonces se
   habilita — sin confirmar.)
4. **Botón "Página anterior"**: solo se usó el siguiente en ambas rondas;
   comprobar su comportamiento (¿descarta cambios no guardados?).

## Límites

- Requiere **sesión autenticada** (Moodle exige login): seguir la regla de muros de
  login (V12) — que sea el usuario quien entre, nunca credenciales nuestras.
- Los `ref` de accesibilidad son de esa sesión concreta: **no** reutilizarlos como
  selectores (usa selectores CSS o `text=`).
