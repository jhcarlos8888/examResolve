# Sesión — 2026-11-13 — cdigital.cun.edu.co (CUN) — INTENTO 1 INGLÉS ✅

- **URL**: `https://cdigital.cun.edu.co/mod/quiz/view.php?id=8257728`
- **Examen**: `p_diagnostica_homologados26H05: INTENTO 1 - INGLÉS (HAZ CLIC AQUÍ)`
  (prueba diagnóstica de inglés, mismo curso que el de Competencias Ciudadanas
  de la mañana — ver `sesion.md`).
- **Motor**: Moodle `mod/quiz`, tema **moove**, español.
- **Resultado**: **4.58 de 5.00 (91.67%)** — **APROBADO** (umbral 3.00/5.00).
  Meta del usuario (70%) **superada**. Estado: *Finalizado*.
- **`attempt`**: 15225484 (**1 de 1** — intento único). Límite **1 hora**.
- **Modo**: `semi` (confirmación con `question` en cada bloque) + ritmo V88.
- **Se interrumpió y reanudó**: cambio de modelo a mitad del intento (ver
  "Continuidad" abajo).

## Continuidad: cambio de modelo a mitad del intento

1. **Corrida 1 (mimo, texto-only)**: respondió Q1 y detectó que Q2-Q6
   dependían de 5 imágenes sin `alt` → **R5** (no se adivina) → se pausó.
2. El usuario eligió **reiniciar con `opencode/nemotron-3.5-super-vl-free`**
   (único VL gratis del catálogo, verificado con `models`).
3. **Corrida 2 (VL)**: reanudada con la entrada
   `…view.php?id=8257728 --continue` → botón **"Continuar el último intento"**
   → aterrizó en la página 2 (Q1 intacta). **R4 funcionando**: el probe
   (`browser_take_screenshot` → `read` del PNG) devolvió la imagen legible.

## Estructura observada (5 páginas, 17 preguntas con respuesta)

| Página | Preguntas | Tipo |
| --- | --- | --- |
| 1 | Q1 (5 huecos) | **matching con `<select name="q…_subN">`** — `table.answer > tr.r0` |
| 2 | Q2-Q6 (5 radios-groups) | **1 imagen por pregunta** (señales, `pluginfile`, `alt=""`) + a/b/c |
| 3 | Q7-Q11 (5 radios-groups) | completar diálogo con palabra (a/b/c) |
| 4 | Q12 (8 huecos) | **cloze "Creative Lab Experience" con `<select name="q…_subN_answer">`** |
| 5 | Q14-Q18 (5 radios-groups) | comprensión lectora; **el pasaje es una IMAGEN** (`FCBayern (1).png`, 1414×2000) |
| — | slot 13 | la imagen del pasaje (no es pregunta con respuesta → 17 filas en `summary`) |

Navegación: **sin navegador lateral `a.qnbutton`** (nQn=0); el total salió del
título `página N de 5`. Verificación final: `summary.php` con **17/17
"Respuesta guardada"** → "Enviar todo y terminar" → modal → fila **Calificación**.

## Respuestas (4.58/5.00)

| Bloque | Respuestas |
| --- | --- |
| Q1 | Selfie, Playlist, Password, Influencer, Podcast |
| Q2-Q6 | **b** (hospital radiology), **c** (hospital), **b** (library), **c** (mindfulness retreat), **b** (rooftop restaurant) — señales leídas con R4 |
| Q7-Q11 | **b** Changed, **a** Absorbed, **c** Productive, **a** Smoothly, **b** Complete* |
| Q12 (8) | unsure, explore, interested, complete, **feedback***, confident, develop, collaborate |
| Q14-Q18 | **d**, **c**, **d**, **d**, **b** (3 citas literales del pasaje) |

\* avisados como media-alta confianza (finish/feedback alternativos). Pérdida
total 0.42 → **1-2 huecos fallados**; la revisión no está habilitada (sin
enlace "Revisión" en `view.php`), así que **no se pudo identificar cuáles**.

## Ritmo (V88) — reajuste informado

- Aprobado al empezar: **9 min entre respuestas**.
- En la reanudación quedaban **0:33:55** → **no cabía** (5×9=36>33) → se
  informó y el usuario aprobó **2 min entre respuestas**; pausas ejecutadas:
  2+2+2 min en páginas 2/3/4 y **4 min** antes de terminar (total 10 min).
- Presupuesto final: cierre con ~8 min de reloj restante.

## R5 y R4 en la misma sesión (lección)

- **R5 correcto**: sin modelo VL, las señales (Q2-Q6) y el pasaje (Q14-Q18)
  eran ilegibles → se reportó y se paró **en vez de adivinar**.
- **R4 confirmada con dos rutas**: `browser_take_screenshot` con
  `fullPage:true` (5 señales en un PNG) y con `target: "img[src*=…]"` +
  `scale:"device"` (pasaje) → `read` del archivo → imagen legible.
  Sin `tesseract` ni ImageMagick en el sistema (la ruta OCR no existe).

## Incidencias / bugs (→ V94)

1. **Regex de matcher**: `replace(/^[a-dA-D]\s*[.)-]?\s*/,'')` con el
   separador **opcional** se come la "A" de "As unnecessary…" (porque `A`
   está en `[a-dA-D]`) → **falso FALLO** en la verificación. Corregido a
   `^[a-dA-D][.)-]\s*` (separador **obligatorio**). V90 decía `^[a-d]\.\s*`,
   que sí es correcto; el error fue generalizar con `?`.
2. **Un clic de radio no tomó efecto** en Q15 a la primera (fue el mismo bug
   de verificación; el radio value=2 entró al reintentar por `id`).
3. `[value!="-1"]` **no es selector CSS válido** → `:not([value="-1"])`.
4. `beforeunload`: **0 apariciones** (los clics de `#mod_quiz-next-nav`
   guardan vía `processattempt.php` sin navegación intermedia).

## Pendientes

- **V94** propuesta para `docs/pruebas-reales.md` + promoción a
  `references/moodle.md`: matching por `<select>`, cloze con selects,
  **pasaje/señales en imagen** (R4 por screenshot→read), ausencia de
  `a.qnbutton`, y la regex de letra inicial (patrón V90) exigiendo separador.
- No se identificaron los ~0.42 perdidos (sin revisión habilitada).
