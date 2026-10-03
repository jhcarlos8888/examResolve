# OpenCode + Brave + Playwright MCP — Resolutor de exámenes

Proyecto listo para usar **OpenCode como agente resolutor de exámenes**, con el modelo que ya tienes configurado en tu proveedor `zen-proxy`, y **Playwright MCP como capa de interacción con Brave**.

En este proyecto **Ollama no participa**.

## Qué incluye

- `opencode.json`: selecciona `zen-proxy/mimo-v2.6-flash-free` y registra un MCP local llamado `playwright`.
- `scripts/playwright-mcp-brave.sh`: encuentra automáticamente el ejecutable de Brave y arranca `@playwright/mcp@0.0.83` con **todas las capacidades** (vision, testing, network, storage, devtools, pdf, config), snapshot con coordenadas y un perfil persistente separado.
- `.opencode/skills/exam-resolver/SKILL.md`: skill del agente — núcleo del flujo (detección, lectura, respuesta, verificación, avance, reporte), modos `semi` (confirmas cada respuesta) y `auto`, y **reglas de seguridad operativa** (verificar antes de avanzar, `Show solution` solo avisando, un cambio de paso no es "resuelto"). El núcleo se mantiene por debajo de 350 líneas a propósito.
- `.opencode/skills/exam-resolver/references/`: detalle por motor, cargado **solo cuando toca** (tabla "Dispatcher de motores" en la skill). `patrones-comunes.md` (trampas genéricas de páginas de examen), `audio-y-visual.md` (imágenes/canvas y listening), `dexway.md` (V31-V69: voz, role-play, tests), `articulate-storyline.md` (V24-V30).
- `.opencode/command/resolver.md`: comando `/resolver [url] [--semi|--auto]` dentro de OpenCode.
- `scripts/resolve.sh`: un solo comando de terminal para arrancar la resolución.
- `scripts/smoke.mjs`: **test de regresión de la cadena completa** (`npm test`). Levanta los simuladores en un puerto efímero, resuelve los 5 con los mismos primitivos que usa el agente (`:checked`, setter nativo + eventos, texto exacto visible, travesía de iframes) y verifica el `Resultado: N/N`. 31 aserciones.
- `docs/capacidades-playwright.md`: matriz escenario → estrategia (escalera R1-R5) de Playwright MCP.
- `docs/pruebas-reales.md`: registro de pruebas reales — 12 rondas, 43 páginas/flujo, 120 URLs escaneadas, hallazgos **V1-V69** y la sección "Errores del agente — no repetir". **Los scores por sitio viven ahí, no en este README.**
- `docs/urls-recon*.txt` + `scripts/recon.mjs`: escáner estructural headless con detección de audio/media (`npm run recon -- docs/urls-recon-r4.txt`).
- `AGENTS.md`: instrucciones generales del agente (estrategia de interacción, límites éticos).
- `scripts/doctor.sh`: revisa sistema, configuración MCP, dependencias de npm, scripts, skill, simuladores y permisos de `runtime/`.
- `scripts/install-browser.sh`: comprueba que Playwright MCP 0.0.83 puede descargarse.
- `simulators/`: cinco simuladores locales (`index.html` clásico, `formularios.html` tipos mixtos, `frame-examen.html`, `iframe-examen.html` embebido, `spa-a11y.html` componentes custom) para validar toda la cadena antes de probar páginas externas.

> **Nota**: OpenCode carga la configuración, las skills y los comandos al
> arrancar. Después de cambiar `opencode.json`, la skill o el comando,
> **reinicia OpenCode** para que los cambios tomen efecto.

## Comprobaciones

```bash
npm run doctor      # 29 comprobaciones: sistema, MCP, npm, scripts, skill
npm run typecheck   # tsc --noEmit sobre scripts/*.mjs
npm test            # smoke test: resuelve los 5 simuladores y verifica N/N
npm run check       # typecheck + test
```

## Arquitectura

```text
Brave
  ↕
Playwright MCP 0.0.83
  ↕ MCP/stdio
OpenCode 1.18.x
  ↕
zen-proxy/mimo-v2.6-flash-free
```

OpenCode permite servidores MCP locales en `opencode.json`; el proyecto se limita a añadir el servidor de navegador y deja el resto de tu configuración global disponible por combinación de configuraciones. El `model` se fija explícitamente en el proyecto para usar MiMo V2.6 Flash Free. [OpenCode MCP docs](https://dev.opencode.ai/docs/mcp-servers/) · [OpenCode config docs](https://dev.opencode.ai/docs/config/) · [OpenCode models docs](https://dev.opencode.ai/docs/models/)

Playwright MCP funciona por defecto en modo con navegador visible y utiliza snapshots de accesibilidad para interactuar. Vision Mode añade herramientas basadas en coordenadas para interfaces que no exponen controles útiles en el árbol de accesibilidad. [Playwright MCP](https://playwright.dev/mcp/introduction) · [Vision Mode](https://playwright.dev/mcp/vision-mode) · [Profile & State](https://playwright.dev/mcp/configuration/user-profile)

## Requisitos

- Linux Mint / Linux de escritorio con sesión gráfica.
- OpenCode instalado y operativo.
- Brave instalado.
- Node.js 20+ y `npx`.

Comprueba todo con:

```bash
cd <carpeta-del-proyecto>
./scripts/doctor.sh
```

## Instalar

Entra al directorio del proyecto:

```bash
cd <carpeta-del-proyecto>
```

Haz ejecutables los scripts por si el ZIP no conservó permisos:

```bash
chmod +x scripts/*.sh
```

Comprueba dependencias:

```bash
./scripts/doctor.sh
```

Pre-descarga/verifica el MCP:

```bash
./scripts/install-browser.sh
```

## Comprobar la cadena sin tocar un examen real

Antes de la primera prueba manual, valida que todo el mecanismo funciona:

```bash
npm run check    # typecheck + smoke test
```

`npm test` levanta los cinco simuladores en un puerto efímero, abre Brave
headless, resuelve cada examen y verifica el `Resultado: N/N`. Si esto pasa, la
cadena del agente está sana; si falla, un examen real fallará también.

## Primera prueba: simulador local

Para ver el flujo a través del agente (con ventana visible), sirve el HTML con
Python:

```bash
python3 -m http.server 8765 --directory simulators
```

En otra terminal:

```bash
cd <carpeta-del-proyecto>
./scripts/run.sh
```

Dentro de OpenCode utiliza un prompt como:

```text
Usa la herramienta MCP de Playwright. Abre http://127.0.0.1:8765/index.html y ejecuta el simulador técnico de principio a fin. Lee cada pregunta y todas las opciones, decide la respuesta, selecciónala, verifica que quedó seleccionada y avanza hasta finalizar. Al terminar dime el resultado.
```

Brave aparecerá en modo visible y el perfil del agente quedará guardado en:

```text
runtime/brave-profile/
```

`runtime/` está en `.gitignore` (perfil de Brave, salidas de Playwright, logs y
resultados de `recon`): es estado local, no código.

La próxima ejecución reutilizará ese perfil. No uses simultáneamente ese perfil con otra instancia de Brave: un directorio de perfil solo puede estar abierto por un navegador a la vez.

## Resolver un examen (flujo principal)

Hay tres formas de disparar la resolución, de más directa a más manual:

### 1. Un solo comando de terminal

```bash
# Examen en una URL, confirmando cada respuesta contigo (semi)
./scripts/resolve.sh https://URL-DEL-EXAMEN --semi

# Todo automático
./scripts/resolve.sh https://URL-DEL-EXAMEN --auto

# Sobre la pestaña que ya tienes abierta en el Brave del agente
./scripts/resolve.sh --current --semi
```

> `resolve.sh` incluye una **guardia de perfil**: si ya hay una sesión de
> OpenCode/Playwright usando `runtime/brave-profile/`, se niega a lanzar
> otra instancia (el perfil de Brave solo admite un navegador). Usa la
> sesión existente con `/resolver`, o `--force` si es intencionado.
>
> Con `--auto` además se pasa `--auto` a OpenCode, para que no se detenga a
> pedir permiso en cada llamada al navegador durante un examen largo. En modo
> `--semi` no se usa: las confirmaciones van por la herramienta `question`.

### 2. Comando `/resolver` dentro de OpenCode

```text
/resolver https://URL-DEL-EXAMEN --semi
/resolver --current --auto
```

### 3. Prompt libre (pestaña activa)

Si no pasas URL, el agente trabaja sobre la pestaña en la que estás parado:

```text
Estamos en esta pestaña. Usa la skill exam-resolver en modo semi.
Comienza a contestar.
```

**Cómo detecta la pestaña activa:** el agente lista las pestañas del Brave
del agente con `browser_tabs` y opera sobre la activa (o te pregunta cuál si
hay varias con dudas). Si la página que ves no es la del Brave del agente
(perfil `runtime/brave-profile/`), ábrela primero allí o pásale la URL con
`./scripts/resolve.sh <url>`.

En ambos casos el agente: **detecta** si la página contiene un examen →
**lee** enunciado y opciones → **responde** → **verifica** la selección →
**avanza** → repite hasta el final y entrega el reporte con la puntuación.

Tipos de pregunta soportados: opción única, varias correctas (checkbox),
desplegable, verdadero/falso, respuesta corta, embebidos en iframe, exámenes
paginados uno-por-página, arrastres, **listening con audio** (transcript en la
página o captura del texto TTS del navegador), ejercicios de pronunciación /
grabación de voz (el agente inyecta el audio como micrófono falso y lee la
puntuación `word|score` del servidor) y role-play con IA.

Opciones visuales (imágenes, canvas, diagramas) **requieren un modelo
multimodal**: el de por defecto es texto-only. La skill lo comprueba al
arrancar y, si no ve imágenes, cambia de estrategia en vez de insistir.

> **Ejercicios de voz (Dexway y similares)**: el agente no tiene micrófono,
> pero donde la página pide `getUserMedia` puede devolver un stream falso con
> el audio oficial de la lección — **una sola reproducción por palabra/frase
> (sin loop)** — y verificar con la nota del propio evaluador. El detalle
> completo (V31-V69, motors, receta por tipo de exercise) está en
> `.opencode/skills/exam-resolver/references/dexway.md`, y los resultados de
> cada ronda en `docs/pruebas-reales.md`. Ojo → ver V38: si caduca la sesión
> del LMS, la lección conserva el progreso y se retoma en el paso exacto.
> Reglas duras al resolver Dexway: **verificar el valor real del campo antes de
> pulsar `Next`** (V57), **`Show solution` solo como último recurso y
> avisándote** (V58) y **un cambio de número de paso no significa "resuelto"**
> (V59).

> **Preguntas 100% visuales** (imagen en el enunciado sin texto alternativo):
> el modelo por defecto `mimo-v2.6-flash-free` **no puede leer imágenes**. La
> skill hace esta comprobación una sola vez al arrancar (`browser_take_screenshot`
> → *"Cannot read image"*) y, si falla, descarta R4 de entrada: extrae
> `alt`/`src` si ayudan y reporta la pregunta. Para resolverlas, relanza con un
> modelo multimodal: `./scripts/run.sh --model zen-proxy/OTRO_MODELO`.

> **Preguntas de audio sin transcripción**: el agente no puede oír audio.
> Busca transcript (botón "Show transcript", `<track>`, DOM oculto) y, en
> juegos TTS, captura el texto hablado; si no hay nada, reporta la pregunta
> en lugar de adivinar. Escalera completa en
> `.opencode/skills/exam-resolver/references/audio-y-visual.md`.

- **Modo `semi`** (default): tras cada pregunta te muestra la respuesta
  elegida y espera tu confirmación en la terminal (`question`).
- **Modo `auto`**: responde todo sin pausar y reporta al final.

Si la página no contiene ningún examen, el agente lo dice y no inventa
preguntas. Si el sitio bloquea la automatización, lo reporta y se detiene
(no intenta evadir protecciones).

## Probar una página externa a mano

Arranca OpenCode:

```bash
./scripts/run.sh
```

Después indícale explícitamente la URL y que es un **simulacro autorizado/práctica**. Por ejemplo:

```text
Abre https://URL-DE-MI-SIMULACRO
Es un simulacro de práctica que estoy autorizado a automatizar.
Usa la skill exam-resolver en modo semi: detecta el examen, recorre las preguntas, propón respuestas y espera mi confirmación antes de cada una. Verifica cada selección y avanza hasta el final. No intentes evadir controles de seguridad del sitio.
```

## Cómo funciona el fallback

La estrategia completa (escenarios, ejemplos de `browser_evaluate`, coste de
tokens) está en `docs/capacidades-playwright.md`. Resumen de la escalera:

### Ruta 1 — Accessibility snapshot (preferida)

El agente recibe una representación estructurada de la página y utiliza referencias para hacer `click`, `type`, `select`, etc.

### Ruta 2 — búsqueda dentro del snapshot

Cuando la página es grande, `browser_find` puede localizar texto relevante sin mandar todo el snapshot al modelo.

### Ruta 3 — DOM por JavaScript

Cuando el árbol de accesibilidad no expone los controles (SPAs, divs clickeables), `browser_evaluate` / `browser_run_code_unsafe` leen el DOM y aplican/verifican selecciones disparando los eventos que esperan los frameworks.

### Ruta 4 — Vision Mode

Se habilita con `--caps vision`. Esto añade interacción por coordenadas cuando un control visual no está expuesto de forma útil en el árbol de accesibilidad. Con `--snapshot-boxes` el propio snapshot lleva coordenadas, útil cuando la página bloquea capturas.

**Requiere que el modelo activo pueda leer imágenes.** El de por defecto
(`mimo-v2.6-flash-free`) no puede: la skill lo detecta en la primera llamada y
omite R4 por completo. Para usarla, relanza con un modelo multimodal.

### Ruta 5 — Reportar el bloqueo

Si ninguna ruta anterior funciona (el sitio rechaza la interacción, las capturas, o la pregunta es ilegible), el agente explica el obstáculo y se detiene sin reintentar por la fuerza.

### Cuando una página bloquea una técnica

No existe una garantía de que una página permita automatización. Si el navegador no permite capturar una imagen, o el sitio bloquea la interacción automatizada, el agente debe detenerse. Este proyecto no intenta saltarse esas protecciones.

## Perfil de Brave y sesiones

El MCP usa un perfil separado del Brave personal para evitar bloquear o alterar tu perfil habitual. La sesión persistente conserva cookies y almacenamiento entre ejecuciones.

Si quieres empezar completamente limpio:

```bash
rm -rf runtime/brave-profile
```

## Cambiar el modelo

El proyecto viene fijado a:

```text
zen-proxy/mimo-v2.6-flash-free
```

Es un modelo **texto-only**: rápido y gratis, pero no lee imágenes. Para
exámenes con preguntas visuales (diagramas, canvas, opciones fotográficas) usa
uno multimodal:

```bash
./scripts/run.sh --model zen-proxy/OTRO_MODELO
```

El ID de modelo de OpenCode sigue el formato `provider/model`. Lista los
disponibles con `opencode models zen-proxy`.

## Cambiar el ejecutable de Brave

Normalmente el script encuentra:

```bash
command -v brave-browser-stable
```

o:

```bash
command -v brave-browser
```

Puedes forzarlo:

```bash
export BRAVE_EXECUTABLE=/ruta/a/brave-browser
./scripts/run.sh
```

## Diagnóstico MCP

Con el proyecto abierto, puedes comprobar los MCP de OpenCode con:

```bash
opencode mcp list
```

Deberías ver `playwright` como servidor configurado. Los MCP locales se ejecutan como procesos locales y sus herramientas quedan disponibles para el LLM en OpenCode.

## Permisos

`opencode.json` fija un bloque `permission` acorde al uso del proyecto:

| Regla | Efecto |
| --- | --- |
| `question: allow` | Las confirmaciones del modo `semi` nunca se bloquean |
| `bash: ask` por defecto | El agente no ejecuta comandos arbitrarios sin que lo apruebes |
| `bash: allow` para `./scripts/*`, `npm test`, `npm run*`, `node scripts/recon.mjs` | Los scripts del propio proyecto sí pasan |
| `external_directory: ask` | No sale del directorio del proyecto sin permiso |

Las herramientas del MCP de Playwright no pasan por este filtro. En modo
`auto`, `resolve.sh` además pasa `--auto` a OpenCode para que no se detenga a
pedir permiso en cada llamada.

El `timeout` del servidor MCP está en **60 s** (por defecto son 5 s): el primer
`npx -y @playwright/mcp` descarga el paquete y con 5 s el arranque falla de
forma intermitente.

## Notas sobre Brave

Playwright MCP permite pasar un `--executable-path`, por lo que no dependemos del canal de navegador `chrome` para usar Brave. El proyecto usa esta vía explícita.

## Seguridad práctica

No pongas contraseñas, tokens ni cookies del perfil personal dentro del proyecto. Si un sitio requiere autenticación, inicia sesión manualmente en el perfil dedicado del agente.
