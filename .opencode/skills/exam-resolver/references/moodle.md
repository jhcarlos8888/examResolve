# Motor Moodle — `mod/quiz`

Primera evidencia: **Ronda 14**, `cdigital.cun.edu.co` (CUN), 2026-10-15,
**10/10 contestadas con puntuación visible** (V77 en `docs/pruebas-reales.md`).
Volcados de la sesión: `resolveLogs/2026-10-15_cdigital.cun.edu.co/`.

> **Alcance de esta evidencia**: 1 intento, 10 preguntas de **opción única**, interfaz en
> **español**. Lo afirmado aquí sin volcado detrás está en la lista "Por
> confirmar": no lo des como hecho. **Excepción**: el resultado (10/10 con
> puntuación visible) procede del **parte de la sesión del usuario**, no de los
> volcados; de esa sesión solo está volcado lo estructural.

## Fingerprint (carga este archivo si aparece)

- URL `/mod/quiz/attempt.php?attempt=…&cmid=…&page=N` (y `/mod/quiz/summary.php`).
- Bloque lateral **"Navegación por el cuestionario"** con enlaces `Pregunta N`
  (el actual con el texto **"Esta página"**) y al final **"Terminar intento..."**.
- Por pregunta: h3 `Pregunta N` + **"Se puntúa como 0 sobre 1.0"** +
  h4 **"Enunciado de la pregunta"** + `group "Pregunta N Respuesta"`.
- Todas las cadenas de interfaz comprobadas están en **español**: con Moodle en
  inglés solo casaría la URL, revisar los textos locales al encontrarlo.

## Estructura observada (volcados de la ronda 14)

| Pieza | Detalle |
| --- | --- |
| Paginación | En esta ronda, **1 pregunta por página** (`page=1…9` + ancla `#question-14643914-N` de la actual). **En Moodle las preguntas por página las configura el profesor**: cuenta los `group "…Respuesta"` de la página antes de asumir paginación. |
| Navegación | Bloque lateral `Pregunta N`… `Pregunta 10` + **"Terminar intento..."** → `/mod/quiz/summary.php?attempt=…&cmid=…`. |
| Respuesta única | `group "Pregunta N Respuesta"` (grupo ARIA). La respuesta única es una **inferencia** de que el examen era de opción única: **ningún radio quedó volcado** (0 ocurrencias de `radio`/`checked` en los 10 volcados). |
| Estado por pregunta | `"Sin responder aún"` **solo consta en el volcado de Q1** (en Q2-Q10 ese bloque está colapsado `...`); `"Se puntúa como 0 sobre 1.0"` **sí está en los 10**. Si el estado cambia al marcar, sirve de verificación textual junto al `:checked` (V57) — **por comprobar**. |
| Marcar para revisar | Árbol: `button "Marcadas"` con texto visible **"Marcar pregunta"**. Bandera del candidato; no interfiere con la respuesta. Buscar por el nombre accesible `Marcadas`, no por el texto. |
| Fin del intento | `Terminar intento...` → `/mod/quiz/summary.php` (resumen de pendientes). **Contenido no volcado.** |
| Puntuación | La sesión terminó con puntuación visible en pantalla; **ni el valor ni su selector quedaron anotados**. |

Las reglas genéricas de la skill aplican sin excepción: verificación antes de
avanzar (V57), elementos visibles y `===` (patrones 1-2), escalera R1→R5, muro de
login (V12).

## Por confirmar en la próxima sesión (no quedó volcado)

1. **Botón de paginación inferior** (`Siguiente`/`Anterior`): los volcados solo
   recogen el bloque lateral; capturar el pie de página.
2. **Flujo de envío**: `summary.php` → "Enviar todas las respuestas y salir" →
   revisión/puntuación. Qué diálogo exige confirmación.
3. **Puntuación exacta y su ubicación en el DOM** (aquí solo consta que fue
   visible, no el valor ni el selector).
4. **Selección/verificación reales**: método usado (clic JS vs clic real) y
   lectura del radio marcado, para no recomendar a ciegas.
5. **URLs de landing y de resultados**: se intuyen `mod/quiz/view.php` y
   `mod/quiz/review.php` (conocimiento general de Moodle, **no** aparecen en los
   volcados) → verificar antes de citarlas como fingerprint.
6. **Variantes de pregunta**: la ronda 14 fue 100% opción única; faltan checkbox
   múltiple, respuesta corta (`<input>`/`<textarea>`) y true/false.
7. **Moodle en inglés** y quiz con **varias preguntas por página** (otra
   configuración válida).

## Límites

- Requiere **sesión autenticada** (Moodle exige login): seguir la regla de muros de
  login (V12) — que sea el usuario quien entre, nunca credenciales nuestras.
- Los `ref` de los volcados son de esa sesión concreta: **no** reutilizarlos como
  selectores.
