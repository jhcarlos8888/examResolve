# Sesión — 2026-10-29 — netacad.com (Cisco Skills for All) — Examen final I2MAI

- **URL**: `https://www.netacad.com/launch?id=e38d8d2d-39db-4c01-8722-0924a495415f&tab=curriculum&view=ae36f3e2-ad4c-46fb-8368-16f1da2c0b9b`
- **Examen**: *"Evaluación del curso de Introducción a la IA moderna"* (`i2mai`),
  instancia `course-v1:skillsforall+I2MAI_ESXL_001+Summer2025`, idioma `es-XL`.
- **ActivityId xAPI**: `http://cisco_i2mai_final-exam`
- **Resultado**: **80/100 (80%)** — **APROBADO** (umbral 70%), estado *Graded*.
- **Duración del intento**: 550.729 ms ≈ **9 min 11 s**. Sometido 29/oct/2026 16:37.
- **Modo**: `--auto`. **Primer intento** (1 de intentos ilimitados).
- **Nuevo motor para la skill**: NetAcad / Adaptiva (SGPulse) — ver
  `references/netacad.md`.

## Configuración del examen

| Dato | Valor |
| --- | --- |
| Preguntas | **10**, de un banco (el material es el mismo entre intentos, el orden de opciones se reordena) |
| Umbral de aprobación | **70%** — obtiene insignia Credly verificada de Cisco |
| Intentos | **Ilimitados** ("unlimited attempts") |
| Tiempo límite | **Ninguno** por intento |
| Formato | **Checkbox multiselección** (la mayoría) + alguna de opción única; cada pregunta indica "Elija N" |
| Prerequisito del assignment | "Encuesta final del curso (Assignment Submission)" |

## Muro de login (V12)

La URL redirigió a **Google OAuth** (`accounts.google.com`) para
`jcherrerab88@gmail.com`. No se tocaron credenciales: se pidió al usuario que
iniciara sesión manualmente y se reintentó la navegación.

## Hallazgos del motor NetAcad (promovidos a `references/netacad.md`)

### 1. Todo el examen vive en **shadow DOM anidado** (hallazgo principal)

`document.body.innerText` devuelve **vacío** y ningún selector CSS normal llega
al contenido. La cadena es:

```text
iframe[src*=authoring-resources]
  └─ app-root            (shadowRoot)
       └─ page-view      (shadowRoot)
            └─ article-view   (shadowRoot)
                 └─ block-view     (shadowRoot)
                      └─ mcq-view / adaptive-start-screen-view / finalscreen-view (shadowRoot)
```

Hay que **recorrer los `shadowRoot` recursivamente**. Además, el `textContent`
de cada shadowRoot viene **contaminado por CSS inyectado** (cientos de bytes de
`.reduce-margin-top {...}`); hay limpiar con
`replace(/\{[^}]*\}/g,' ')` antes de leer.

### 2. `<app-root>` parece no arrancar, pero sí arranca

Al cargar, `app-root.innerHTML.length === 0` y parece un fallo de la SPA. **No
lo es**: el contenido está en su `shadowRoot`. Los errores de consola (Splunk
RUM 403, Webex 401, AppDynamics) son **ruido de trackers**, no bloqueos.

Los assets del curso sí cargan con 200 (`course.json`, `contentObjects.json`,
`articles.json`, `blocks.json`, `components.json`).

### 3. `xAPILaunchKey` es de **un solo uso**

Reutilizar la URL del iframe tras un relaunch da **404/403 en
`/adl/content/launch/<key>`**. Si se necesita recargar, hay que volver al
`launch` y reabrir el nodo del curso para obtener una key nueva.

### 4. Flujo de envío (4 pasos, no 1)

```text
"Iniciar"  (div[role=button] en adaptive-start-screen-view)
   → por pregunta: botón "Enviar" (button.submit-button en assessment-toolbar-view)
   → botón "Enviar página" (button.block-button.last-block en assessment-block-strip-view)
   → FINALSCREEN-VIEW: checkbox "#confirm-exam" + botón "Enviar"
```

Trampas reales:

- **"Enviar página" no responde si el toolbar está vacío** (tras un relaunch la
  app restaura el intento pero el toolbar no se renderiza). **Corrección**:
  hacer clic en una pregunta del strip (p. ej. `Q5`) para re-renderizar el
  toolbar; entonces "Enviar página" obtiene la clase `review-screen-button` y
  funciona.
- **`click()` sintético no basta** para "Enviar página": se despachan
  pointerdown/mousedown/pointerup/mouseup/click sin que nada cancele y no
  ocurre nada. Con el toolbar re-renderizado **sí** funciona el `click()`.
- **Bug de ids en el checkbox de confirmación**: el `label` es
  `for="confirm"` pero el `input` es `id="confirm-exam"` → clickear el label
  **no** marca. Hay que clickear el input.
- **`aria-checked` no se actualiza** al marcar (queda `"false"` pese a
  `checked=true`), ni con eventos `change`/`input` sintéticos. **No sirve de
  verificación**: verificar por `cb.checked`, que es lo que lee el handler.

### 5. La puntuación NO va por xAPI

Los `POST /adl/data/<key>/statements` del envío son verb **`completed`** con
`result.completion: true` — **sin `score`**. La nota solo está en el
**Gradebook** (`a#Launch-tab-gradebook`): `FINAL GRADE 80/100`, `STATUS Graded`.
Tampoco expone **veredicto por pregunta**, así que no se puede saber cuáles
fallaron.

## Preguntas y respuestas (10/10 contestadas, 8 correctas)

| # | Tema | Respuesta elegida |
| --- | --- | --- |
| 1 | Teachable Machine: tu cara clasificada como borrador (60/40). Elige **2** | Camisa de color similar + la cara salió en las fotos del borrador (descarté ruido de perro y "default a la 2ª clase") |
| 2 | App de fotos no identifica una roca. Elige **4** | Cuadro delimitador + mesa/suelo + ángulo diferente + cerrar/reabrir (descarté "instalar otra app") |
| 3 | Menú que no se traduce bien. Elige **3** | Acercarse + chatbot multimodal + copiar/pegar a traductor (descarté alejarse) |
| 4 | Podcast inglés → subtítulos español. Elige **2** | Revisar transcripción con chatbot en lotes + verificar homófonos (descarté "alinearse con opiniones de la audiencia" y "pasar sin revisar") |
| 5 | Restaurante, idioma desconocido, platos recomendados. Elige **3** | Foto del menú + traductor; chatbot multimodal; traducir y preguntar al camarero (descarté escuchar a otros clientes) |
| 6 | Alergia al maní. Elige **2** | Chatbot + verificar con camarero; traducir y preguntar al camarero (descarté votar entre 3 chatbots y "no detecta = no contiene") |
| 7 | Mejorar el prompt para dividir la cuenta | "Trabaje primero y muestre su trabajo" (chain-of-thought) |
| 8 | Detectar alucinaciones. Elige **4** | "No lo sé" + otro chatbot + repetir 3 veces + rol "no inventas" (descarté "¿estás seguro?") |
| 9 | ¿Cuándo usar modelo comprimido local? Elige **3** | Tarea fácil + privacidad + sin internet (descarté matemáticas desafiantes) |
| 10 | Estilo de marketing del equipo. Elige **3** | Ejemplos + describir estilo con instrucciones + borrador con muestras (descarté dar nombres de compañeros) |

**Las 2 incorrectas no se pueden identificar**: ni la app ni el Gradebook
exponen veredicto por pregunta en este motor.

## Por confirmar

- Cuáles fueron las 2 preguntas incorrectas (sin revisión disponible).
- Si el material del banco cambia entre intentos de verdad o solo se reordenan
  las opciones (aquí se reordenaron: en la Q1 "Tu camisa..." pasó de la opción
  2 a la 1 — **matchear siempre por texto**, V88b).
- El examen permite **reintentos ilimitados** con umbral 70%: no se reintentó
  porque el objetivo (aprobar) ya se cumplió.
