# Sesión 2026-10-15 — Examen Moodle en cdigital.cun.edu.co

## Datos de la sesión

- **Fecha/hora de los artefactos**: 2026-10-15, 12:26 – 12:52.
- **URL del intento**: `https://cdigital.cun.edu.co/mod/quiz/attempt.php?attempt=14497620&cmid=7324201&page=N`
- **Motor**: **Moodle** (`/mod/quiz/`) — motor nuevo para el proyecto (no estaba en el dispatcher).
- **Tema del examen**: investigación en ingeniería (10 preguntas de opción única).
- **Resultado**: **10/10 contestadas con puntuación visible** en pantalla.
- **Modo**: no consta en los artefactos (pendiente de anotar en la próxima sesión).

## Estructura observada (evidencia: los 10 volcados `quiz-q*-find.yml`)

- **1 pregunta por página**: los enlaces laterales llevan `page=1` … `page=9`
  (Pregunta 2-10) y la página actual usa el ancla `#question-14643914-1`; la
  página 1 (`page=0`) **no quedó volcada**, se infiere.
- **Navegación lateral** (bloque "Bloques" → `navigation`):
  - heading **"Navegación por el cuestionario"** (h3).
  - Enlaces **"Pregunta N"**; el de la página actual añade el texto **"Esta página"**
    y apunta a `#question-14643914-N` — **el ancla usa el id de uso del questionario
    (`14643914`), no el id de intento (`14497620`)**: no derivarla del parámetro
    `attempt`.
  - Enlace final **"Terminar intento..."** →
    `/mod/quiz/summary.php?attempt=14497620&cmid=7324201`.
- **Por pregunta** (mismo patrón en las 10; en Q1 consta completo, en Q2-Q10 los
  nodos intermedios están colapsados `...` en el volcado):
  - h3 `Pregunta N` + estado **"Sin responder aún"** (solo legible en Q1) hasta
    marcar.
  - Puntuación **"Se puntúa como 0 sobre 1.0"**.
  - Botón con nombre accesible **`button "Marcadas"`** y texto visible
    **"Marcar pregunta"** (bandera de revisión, no afecta a la respuesta).
  - h4 **"Enunciado de la pregunta"** + `<p>` con el enunciado.
  - **`group "Pregunta N Respuesta"`**: grupo ARIA de la respuesta. La respuesta
    única se **infiere** del contexto (examen de opción única): ningún radio ni
    `checked` quedó volcado — pendiente de capturar en la próxima sesión.
- **Los 10 enunciados** están en los volcados (no se copian aquí: son contenido del
  examen; ver `quiz-q*-find.yml`).

## Qué se lleva al proyecto

1. **`references/moodle.md`** (nuevo) — fingerprint y mecánica del motor Moodle.
2. **`docs/pruebas-reales.md` → Ronda 14, hallazgo V77** — primera prueba de Moodle.
3. **`SKILL.md`** — fila en el "Dispatcher de motores" + instrucción de crear esta
   carpeta al empezar (Paso 1) y de cerrarla con su `sesion.md` al final.

## Pendientes para la próxima sesión con este motor

- Anotar **modo** (`auto`/`semi`) y **puntuación exacta** (aquí solo consta que fue
  visible, no el valor).
- Capturar el **botón de paginación inferior** ("Siguiente"/"Anterior"): los volcados
  solo recogen el bloque de navegación lateral, no el pie de página.
- Documentar el flujo de **envío**: `Terminar intento…` → `summary.php` →
  "Enviar todas las respuestas" → página de revisión/puntuación (no quedó volcado).
- Confirmar método de selección y verificación usados (clic + `:checked`) con un
  volcado del `group` interactuado.

## Regla de esta carpeta

- Volcados crudos (`*-find.yml`, snapshots) **fuera del repo** (`resolveLogs/*/*`
  en `.gitignore`): los `ref` de accesibilidad cambian en cada sesión, no
  reutilizarlos como selectores.
- Este `sesion.md` **sí se versiona** (`!resolveLogs/*/sesion.md`): es el resumen
  curado y el que sobrevive a un `git clean`.
- Lo reutilizable además se promueve: patrón nuevo → `references/<motor>.md` +
  `V*` en `docs/pruebas-reales.md`.
- La skill escribe aquí los volcados **durante** la sesión y cierra la carpeta con
  su `sesion.md` **al final**; **no lee** estas carpetas al arrancar.
