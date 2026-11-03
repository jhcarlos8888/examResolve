# Sesión — 2026-11-03 — cdigital.cun.edu.co (CUN) — Parcial 2 EI005

- **URL**: `https://cdigital.cun.edu.co/mod/quiz/view.php?id=8251039`
- **Examen**: "Parcial 2" — curso `EI005/55560/26V05/B1/FINVV/FINVI`
  (Financiación de proyectos de I+D). Tema: **estructura de una investigación
  académica** (problema, introducción, objetivos, metodología, resultados,
  discusión, conclusiones) aplicada a IA en educación universitaria.
- **Motor**: Moodle (`mod/quiz`), tema **moove**, español.
- **Resultado**: **5.00 de 5.00 (100%)** — 10.00/10.00 puntos.
- **Modo**: `--auto` **con 2 minutos de pausa entre cada pregunta** (V88).
- **`attempt`**: 14972118 — **primer intento**.

## Configuración

| Dato | Valor |
| --- | --- |
| Intentos permitidos | 2 — método **Calificación más alta** |
| Límite de tiempo | **45 minutos** |
| Ventana | 2/nov/2026 00:00 — 9/nov/2026 23:59 |
| Aprobación | 3.00 de 5.00 |
| Preguntas | **10** — **2 por página (5 páginas)**, opción única (radio) + 1 de checkbox multiselección |
| Duración real | **32 minutos 34 segundos** |
| Revisión | Enlace "Revisión" **SÍ apareció** (primera vez en CUN) → `review.php` |

## Presupuesto de tiempo (regla V88)

Antes de empezar: 10 preguntas × 2 min = **20 min de pausas** sobre **45 min**
de límite → holgado. Si el total de preguntas hubiera superado ~22, habría
habido que avisar antes de comprometer el ritmo. Duración final 32 min 34 s
(9 pausas de 120 s + lectura/avances).

## Flujo

1. `view.php` → botón "Intento de cuestionario" → diálogo "Comenzar intento"
   (45 min) → confirmación. `attempt=14972118`.
2. **Lectura completa en 1 llamada**: bucle por las 5 páginas extrayendo
   `.qtext` + opciones (`input` con `value !== '-1'`).
3. **Decisión centralizada** de las 10 respuestas como
   `[{q: fragmento, r: [prefijos…]}]` — matcheo **por texto de pregunta y de
   opción** (V88b).
4. **Responder + verificar + avanzar**, con **pausa de 2 min entre cada
   pregunta**: por página → responder Q1 → `shell sleep 120` → responder Q2 →
   `sleep 120` → clic `#mod_quiz-next-nav` (guarda vía `processattempt`).
5. Verificación previa al envío: `:checked` con `value !== '-1'` (V84) +
   **10 `POST /mod/quiz/autosave.ajax.php → 200`** (V82).
6. Última página: leído `value` del botón = **"Terminar intento..."** antes de
   clicar (V86, no se clicó a ciegas).
7. `summary.php`: **10/10 filas "Respuesta guardada"** → "Enviar todo y
   terminar" → modal → `button.btn-primary` → calificación.

## Verificaciones (todas correctas)

- **10/10** con `:checked` y comparación exacta del número de marcas antes de
  avanzar (la Q5 de checkbox exigía exactamente 3).
- El radio oculto `value="-1"` descartado siempre (V84).
- **V59 confirmado**: los `a.qnbutton[title]` de Q9/Q10 decían "Sin responder
  aún" con ellas ya marcadas — los `title` solo se actualizan al navegar. La
  prueba válida fue `:checked` + el autosave `200`; al llegar a `summary.php`
  salieron las 10 "Respuesta guardada".
- **V87/V88 confirmados**: **0 apariciones de `beforeunload`** en 4
  transiciones. Con 2 min entre marcar y navegar, el autosave siempre había
  completado (en r23 hubo 5 con el mismo flujo sin pausas).

## Errores míos detectados y corregidos en caliente

1. **`startsWith` contra texto con letra inicial.** Las opciones son
   `"c. El uso inadecuado…"`; mi prefijo era `"El uso inadecuado…"` →
   `NO_MARCO` (0 marcados). **Corrección**: normalizar quitando la letra con
   `s.replace(/^[a-d]\.\s*/, '')` antes de comparar. Fue un fallo mío, no del
   sitio.
2. **El matcher se detenía en la primera pregunta ya respondida** (hacía
   `return YA_RESPONDIDA` en vez de saltar) → no avanzaba a la siguiente de la
   misma página. **Corrección**: `continue` para trabajar sobre la primera
   pendiente.

Ambos se corrigieron **antes** de tocar más respuestas; ninguna quedó mal
marcada.

## Preguntas y respuestas (10/10 correctas)

| # | Tema | Respuesta |
| --- | --- | --- |
| 1 | Problema de investigación (IA en trabajos académicos) | **c** — El uso inadecuado de la IA puede afectar el pensamiento crítico y la autonomía académica |
| 2 | Propósito de la introducción | **a** — Presentar el tema, contextualizar la problemática y explicar su importancia |
| 3 | Objetivo general adecuado | **b** — Analizar la influencia de las herramientas de IA en los procesos de aprendizaje |
| 4 | Objetivo específico pertinente | **a** — Identificar las principales herramientas de IA usadas por los estudiantes |
| 5 | Actividades metodológicas (**checkbox**) | **a + c + d** — encuestas, entrevistas, definir población/muestra (descartado "inventar respuestas") |
| 6 | Encuesta + porcentajes/frecuencias | **c** — Enfoque cuantitativo |
| 7 | 105 de 150 estudiantes | **a** — 70% |
| 8 | La discusión compara con estudios anteriores (V/F) | **Verdadero** |
| 9 | Qué hacer en la discusión | **c** — Interpretar, contrastar con otros estudios y analizar explicaciones |
| 10 | Las conclusiones deben traer info no sustentada (V/F) | **Falso** |

## Hallazgo nuevo: `review.php` SÍ apareció en CUN, pero sin veredictos

Tras enviar, Moodle **redirigió directamente a `review.php`** y el enlace
"Revisión" quedó en la tabla de intentos. Es la **primera vez en CUN** (r14-r16,
r19, r20, r22-r24 no lo tuvieron) — resuelve la duda abierta de "qué
configuración lo habilita": **aparece en este quiz (`id=8251039`) y no en los
anteriores**.

**Pero no expone el veredicto**: no hay "Correcta"/"Incorrecta", ni
"Se puntúa como", ni nota en la revisión — solo muestra enunciado, opciones y
la respuesta seleccionada. Es una revisión **solo lectura sin feedback de
corrección**. La nota hay que seguirla leyendo de la fila "Calificación" de
`view.php` (V79).

## Por confirmar

- Configuración exacta que habilita `review.php` en CUN: en este quiz sí y en
  `id=7941971`, `7891358`, `7324210` no. Sigue sin saberse si es el tipo de
  actividad, la fecha o una opción del docente.
- Si `review.php` sin veredictos es el comportamiento normal cuando el docente
  desactiva "Mostrar respuestas correctas".
- Variante verdadero/falso y checkbox multiselección: **ya confirmadas aquí**
  (la Q5 y las Q8/Q10), lo que amplía el alcance V80/V84 en CUN.
