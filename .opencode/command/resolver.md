---
description: Detecta y resuelve el examen de la URL indicada o de la pestaña activa (modos --semi / --auto)
---

Resuelve un examen siguiendo la skill `exam-resolver`
(`.opencode/skills/exam-resolver/SKILL.md`). Cárgala y aplica su flujo completo:
detección → lectura → respuesta → verificación → avance → reporte.

Entrada del usuario: `$ARGUMENTS`

Interpreta la entrada así:

1. **URL** (empieza por `http://` o `https://`): `browser_navigate` a esa URL.
2. **`--current`** o ausencia de URL: lista las pestañas con `browser_tabs` y
   trabaja sobre la pestaña activa. Si no queda claro cuál es el examen,
   pregunta al usuario antes de actuar.
3. **Modo**:
   - `--semi` → modo semiautomático (confirmar cada respuesta con `question`).
   - `--auto` → modo automático (responder todo sin pausar).
   - Sin flag → modo `semi` (default de la skill).

Reglas inalterables:

- Si la detección no encuentra examen en la página, dilo y no inventes preguntas.
- Verifica cada selección antes de avanzar.
- No evadas protecciones anti-automatización; reporta el bloqueo y para.
- Termina con el reporte de resultados de la skill.
