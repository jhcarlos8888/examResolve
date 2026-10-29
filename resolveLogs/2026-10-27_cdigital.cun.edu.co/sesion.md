# Sesión — 2026-10-27 — cdigital.cun.edu.co (CUN)

- **URL**: `https://cdigital.cun.edu.co/mod/quiz/view.php?id=7324210`
- **Quiz**: "Quiz 2" — curso `EI005/55560/26V05/B1/FINVV/FINVI` (Financiación de
  proyectos de I+D), Tema 4.
- **Motor**: Moodle (`mod/quiz`), tema **moove/Bootstrap**, interfaz en español.
  Fingerprint de `references/moodle.md` casó al 100%.
- **Modo**: `--auto`.
- **Resultado real**: **Calificación 5.00 de 5.00 (100%)**, estado **Finalizado**.

## Configuración observada

| Dato | Valor |
| --- | --- |
| Intentos permitidos | 2 (método: Calificación más alta) |
| Límite de tiempo | 45 minutos (cronómetro visible, no pausable) |
| Ventana | Abrió 7/oct/2026 00:00 — Cierra 15/nov/2026 23:59 |
| Preguntas | 4 — de **2 por página** (2 páginas), opción única (radio) |
| Puntaje por pregunta | 2.0 c/u (total 5.00) |
| Revisión | No apareció enlace "Revisión" tras enviar (mismo patrón que r15/r16/r19/r20) |

## Flujo ejecutado

1. **Muro de login** (V12): la URL redirigió a `login/index.php`. No se
   introdujeron credenciales; el usuario confirmó sesión ya iniciada y se
   reintentó la navegación con éxito.
2. Landing `view.php` → botón **"Intento de cuestionario"** → diálogo
   "Comenzar intento" (aviso de 45 min) → botón del diálogo (inicia cronómetro).
   `attempt=14820565`.
3. Página 1: P1 y P2 respondidas por clic nativo sobre el radio; verificado
   `:checked` con `value !== '-1'` (V84).
4. **Incidente de navegación**: tras marcar P1/P2 se pulsó `#mod_quiz-next-nav`,
   que devolvió timeout de MCP **pero la navegación sí se completó** (patrón
   R16). El reintento inmediato sobre el mismo selector cayó sobre la **página
   ya cargada (página 2)**, donde ese botón es "Terminar intento..." → saltó a
   `summary.php` con P3/P4 sin responder. **Recuperación**: URL directa
   `attempt.php?attempt=14820565&cmid=7324210&page=1` (patrón V83); el intento
   seguía abierto y P1/P2 conservaron "Respuesta guardada".
5. Página 2: P3 y P4 respondidas; verificado `:checked` en la misma respuesta
   (V57). Se esperó el **POST `/mod/quiz/autosave.ajax.php`** antes de navegar
   (V82) — confirmado en `browser_network_requests`.
6. Última página → "Terminar intento..." → `summary.php`: las **4 filas** con
   "Respuesta guardada". → "Enviar todo y terminar" → modal `div[role=dialog]`
   → `button.btn-primary` → vuelta a `view.php` con nota.

## Preguntas y respuestas (todas correctas)

| # | Enunciado (resumen) | Respuesta |
| --- | --- | --- |
| 1 | Propósito fundamental del Sistema General de Regalías y su contribución al desarrollo territorial | **b** — Administrar y distribuir los recursos de la explotación de recursos naturales no renovables para financiar proyectos de inversión que contribuyan al desarrollo de las regiones |
| 2 | Actividad que genera principalmente los recursos que ingresan al SGR | **b** — La explotación de recursos naturales no renovables (petróleo y minerales) |
| 3 | Primera actuación de una alcaldía para presentar un proyecto de agua potable al SGR | **a** — Diagnosticar el problema, identificar causas y efectos, establecer beneficiarios y formular una alternativa de solución viable |
| 4 | Relación entre el SGR y los proyectos de Ciencia, Tecnología e Innovación | **b** — El SGR contempla mecanismos de financiación para proyectos de CTI que buscan generar conocimiento y fortalecer las capacidades científicas y tecnológicas del país |

## Hallazgos nuevos para la skill → **promovidos a V86**

Ver `docs/pruebas-reales.md` → "Ronda 22" y `references/moodle.md`:

- Sandbox de `execute` **sin timers**; un `execute` fallido no deshace el clic
  ya hecho; los `ref` **caducan al navegar** → leer `location.href` antes de
  reintentar y usar selectores estables.
- `div.question` **no existe** en la plantilla moove: usar `.qtext` +
  `input[name^="q"]` agrupados por `name`.
- El label de opción **no usa `label[for=]`** en moove: texto fiable en
  `input.closest('div[id^="answer"]').innerText`.
- `#mod_quiz-next-nav` significa "Siguiente página" en páginas intermedias y
  **"Terminar intento..."** en la última: comprobar `value` + `document.title`
  ("página N de M") antes de clicar.
- `browser_find` por texto localizó "Enviar todo y terminar" sin snapshot
  completo (R2) — rápido y barato.
- En `summary.php`, la extracción barata de las N respuestas:
  `table tbody tr` filtrando filas cuyo texto incluya "Respuesta".

## Por confirmar

- Comportamiento del botón "Página anterior" (no se usó).
- Variante true/false y respuesta corta en este curso (sigue sin verse).
- No hay intento previo con revisión en este quiz: no se pudo aplicar V81.
