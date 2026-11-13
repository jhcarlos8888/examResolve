# Sesión — 2026-11-12 — cdigital.cun.edu.co (CUN) — Quiz 3 EI005

- **URL**: `https://cdigital.cun.edu.co/mod/quiz/view.php?id=7324222`
- **Examen**: "Quiz 3" — curso `EI005/55560/26V05/B1/FINVV/FINVI`
  (Financiación de proyectos de I+D). Tema: **formulación de proyectos** —
  fases del proyecto, pasos de la formulación, análisis de involucrados,
  árbol de problemas, matriz de marco lógico.
- **Motor**: Moodle (`mod/quiz`), tema **moove**, español.
- **Resultado**: **4.00 de 5.00 (80%)** — 8.00/10.00 puntos → **4/5 correctas**.
- **Estado**: *Finalizado*, enviado 12/nov/2026. Duración **18 min 17 s**.
- **Modo**: `--auto` **con 2 minutos de pausa entre cada respuesta** (V88).
- **`attempt`**: 15168820 (1 de 2).

## Configuración

| Dato | Valor |
| --- | --- |
| Intentos permitidos | 2 — método **Calificación más alta** |
| Límite de tiempo | **30 minutos** |
| Ventana | 11/nov/2026 00:00 — 18/nov/2026 23:59 |
| Aprobación | 3.00 de 5.00 |
| Preguntas | **5** — **5 páginas (1 por página)**, opción única (radio) |
| Revisión | **No autorizada hasta el 18/nov/2026 23:59** |

## Presupuesto de tiempo (V88) — comprobado antes de responder

Total leído del **navegateral** (`a.qnbutton` = 5, sin abrir ninguna página —
V91): **5 × 2 min = 10 min de pausas** sobre **30 min** de límite → **muy
holgado**. Duración final 18 min 17 s (4 pausas de 120 s + lectura/avances).

## V91 aplicado: respuesta en tiempo real, sin repasar

Ciclo por pregunta, en orden 1→5: **leer → procesar → responder → verificar
(`:checked`) → avanzar**. **No** se hizo ninguna pasada previa por las
preguntas; el total salió del navegador lateral.

## Muro de login (V12)

La sesión había expirado (`login/index.php`). No se tocaron credenciales; el
usuario inició sesión manualmente y se reintentó.

## Incidencias técnicas

- **`browser_evaluate` devolvió `null`** tras un avance (excepción no
  capturada) → se re-evaluó en llamada aparte y cargó bien (V88c).
- **`beforeunload`**: 0 apariciones (las pausas de 2 min dejaban el autosave
  completado, V87/V88).
- Verificación `:checked` con `value !== '-1'` en las 5 preguntas antes de
  cada avance (V57, V84).
- Envío **controlado**: "Terminar intento..." → `summary.php` (**5/5
  "Respuesta guardada"**) → "Enviar todo y terminar" → modal → confirmación.
  A diferencia de la ronda anterior, **no** se dejó expirar el reloj.

## Preguntas y respuestas (4/5 correctas)

| # | Pregunta | Respuesta |
| --- | --- | --- |
| 1 | Fases de un proyecto y de qué depende pasar por todas | **a** — Idea, perfil y factibilidad; depende de la complejidad técnica y los montos |
| 2 | Objetivo del **paso 2** en la formulación de un proyecto | **a** — Identificar las causas que originan el problema central |
| 3 | Objetivo del análisis de involucrados | **a** — Reconocer características de la población y clasificar actores (beneficiarios, afectados, cooperantes, oponentes) |
| 4 | Resultado esperado de un árbol de problemas | **d** — Comprender el problema central, sus causas y sus efectos para orientar la investigación |
| 5 | Función de la matriz de marco lógico | **b** — Visualizar y organizar la planificación orientada a objetivos (fin, propósito, resultados, actividades) |

**La incorrecta no se puede identificar**: la revisión no está autorizada hasta
el 18/nov/2026.

### Las más dudosas

- **Q2** (paso 2 de la formulación): elegí *"identificar las causas"* porque
  el flujo estándar es problema → causas → efectos (la opción *d*, "identificar
  y formular el problema central", sería el paso 1). Es la candidata más
  probable a ser la incorrecta.
- **Q1** (fases y su dependencia): elegí *"idea, perfil y factibilidad;
  depende de la complejidad técnica y los montos"* (metodología de inversión
  pública colombiana, donde la profundidad de las etapas depende de la
  magnitud). También defendible.

## Por confirmar

- Cuál fue la pregunta incorrecta → consultar cuando se habilite la revisión
  (18/nov/2026).
- Queda **1 intento** con método "Calificación más alta": reintentar solo
  puede subir o empatar (máximo 5.00/5.00).
