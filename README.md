# OpenCode + Brave + Playwright MCP — Resolutor de exámenes

Proyecto listo para usar **OpenCode como agente resolutor de exámenes**, con el modelo que ya tienes configurado en tu proveedor `zen-proxy`, y **Playwright MCP como capa de interacción con Brave**.

En este proyecto **Ollama no participa**.

## Qué incluye

- `opencode.json`: selecciona `zen-proxy/mimo-v2.6-flash-free` y registra un MCP local llamado `playwright`.
- `scripts/playwright-mcp-brave.sh`: encuentra automáticamente el ejecutable de Brave y arranca `@playwright/mcp@0.0.83` con **todas las capacidades** (vision, testing, network, storage, devtools, pdf, config), snapshot con coordenadas y un perfil persistente separado.
- `.opencode/skills/exam-resolver/SKILL.md`: skill del agente — detecta si la página tiene examen, responde (radio/checkbox/select/texto/iframe/drag/**audio-listening**), verifica cada selección y reporta. Modos `semi` (confirmas cada respuesta) y `auto`.
- `.opencode/command/resolver.md`: comando `/resolver [url] [--semi|--auto]` dentro de OpenCode.
- `scripts/resolve.sh`: un solo comando de terminal para arrancar la resolución.
- `docs/capacidades-playwright.md`: matriz escenario → estrategia (escalera R1-R5) de Playwright MCP.
- `docs/pruebas-reales.md`: registro de pruebas en 8 rondas — 35 páginas/flujo en profundidad y 120 escaneadas (W3Schools 25/25, ComputerIELTS **40/40 Band 9.0**, Statistics **20/20**, GoKwiz **19/20 con JSON-LD**, SQL Quiz **90%**, TestMe **5/5** semi, **SENA Placement Test 100/300 = 100 Puntos**, **UNAL 198/200**, **PAA/PrepMaster 55/55 = 800/800**, **Java 1Z0-808 10/10**, **Dexway CUN Unidad 1 completa: Greetings 87% (voz falsa), People 92%, Introducing yourself 98%, Role-play 100%, Test 79%** + hallazgos V1-V34 y validación de los modos auto/semi/pestaña/URL).
- `docs/urls-recon.txt` + `docs/urls-recon-r2.txt` + `docs/urls-recon-r3.txt` + `docs/urls-recon-r4.txt` + `docs/urls-recon-r5.txt` + `scripts/recon.mjs`: escáner estructural headless con detección de audio/media (`npm run recon -- docs/urls-recon-r4.txt`).
- `AGENTS.md`: instrucciones generales del agente (estrategia de interacción, límites éticos).
- `scripts/doctor.sh`: revisa OpenCode, Node, npm, npx, Brave y el JSON.
- `scripts/install-browser.sh`: comprueba que Playwright MCP 0.0.83 puede descargarse.
- `simulators/`: cuatro simuladores locales (`index.html` clásico, `formularios.html` tipos mixtos, `iframe-examen.html` embebido, `spa-a11y.html` componentes custom) para validar toda la cadena antes de probar páginas externas.
- `runtime/`: directorio local para perfil de Brave y salidas de Playwright; no se versiona.

> **Nota**: OpenCode carga la configuración, las skills y los comandos al
> arrancar. Después de cambiar `opencode.json`, la skill o el comando,
> **reinicia OpenCode** para que los cambios tomen efecto.

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

## Primera prueba: simulador local

Desde el proyecto, puedes servir el HTML con Python:

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
**lee** enunciado y opciones (texto, desplegables, **imágenes o gráficos** vía
Vision Mode) → **responde** → **verifica** la selección → **avanza** → repite
hasta el final y entrega el reporte con la puntuación.

Tipos de pregunta soportados: opción única, varias correctas (checkbox),
desplegable, verdadero/falso, respuesta corta, embebidos en iframe, examenes
paginados uno-por-página, arrastres, opciones visuales (imágenes/canvas) por
coordenadas, **listening con audio** (transcript en la página o captura del
texto TTS del navegador) y **ejercicios de pronunciación / grabación de voz**
(el agente inyecta el audio del modelo como micrófono falso y lee la
puntuación `word|score` que devuelve el servidor; ver hallazgo V31).

> **Ejercicios de voz (Dexway y similares)**: el agente no tiene micrófono,
> pero donde la página pide `getUserMedia` puede devolver un stream falso con
> el audio oficial de la lección — **una sola reproducción por palabra/frase
> (sin loop)** — y verificar con la nota del propio evaluador. Curso completo
> de prueba: **Dexway CUN Unidad 1 (5/5)** → Greetings **87%** (Pronunciation
> 98%), People **92%**, Introducing yourself **98%**, Role-play con IA
> **100%** (respuesta por chat, sin voz) y Test **79%**. Nota media del curso
> 91%. Ver `docs/pruebas-reales.md` (hallazgos V31-V34).

> **Preguntas 100% visuales** (imagen en el enunciado sin texto alternativo):
> el modelo por defecto `mimo-v2.6-flash-free` **no puede leer imágenes**. En
> esos casos el agente extrae `alt`/`src` si ayudan, o reporta la pregunta y
> te sugiere relanzar con un modelo multimodal:
> `./scripts/run.sh --model zen-proxy/OTRO_MODELO`. Ver
> `docs/pruebas-reales.md` (hallazgo V1).

> **Preguntas de audio sin transcripción**: el agente no puede oír audio.
> Busca transcript (botón "Show transcript", `<track>`, DOM oculto) y, en
> juegos TTS, captura el texto hablado; si no hay nada, reporta la pregunta
> en lugar de adivinar. Ver `docs/pruebas-reales.md` (hallazgos V9-V13).

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

### Ruta 5 — Reportar el bloqueo

Si ninguna ruta anterior funciona (el sitio rechaza la interacción o las capturas), el agente explica el obstáculo y se detiene sin reintentar por la fuerza.

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

Si prefieres cambiarlo sin editar el archivo:

```bash
./scripts/run.sh --model zen-proxy/OTRO_MODELO
```

El ID de modelo de OpenCode sigue el formato `provider/model`.

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

## Notas sobre Brave

Playwright MCP permite pasar un `--executable-path`, por lo que no dependemos del canal de navegador `chrome` para usar Brave. El proyecto usa esta vía explícita.

## Seguridad práctica

No pongas contraseñas, tokens ni cookies del perfil personal dentro del proyecto. Si un sitio requiere autenticación, inicia sesión manualmente en el perfil dedicado del agente.
