# examResolve — OpenCode, agentes multimodelo y Playwright MCP

Herramienta local para **prácticas, simulacros y pruebas de QA autorizadas**. OpenCode coordina preguntas de una página usando Brave y Playwright MCP: detecta el cuestionario, lee enunciados y opciones, propone respuestas, verifica que cada selección quedó registrada, avanza y deja un informe. No puede garantizar acertar cualquier examen.

**Novedad principal:** el navegador trabaja **oculto por defecto**, sin quitar el foco a las otras aplicaciones. Puedes mirar una sesión activa desde un **visor privado de solo lectura** cuando lo necesites, sin traer Brave al frente.

> Solo utiliza páginas que permitan este tipo de automatización. No intentes evitar proctoring, antibots, controles de acceso, restricciones de capturas o medidas de seguridad.

## Requisitos e instalación

Linux, Brave, Node.js 20+, npm, npx y OpenCode 2.x. Para los agentes DeepSeek y GLM configurados se requiere acceso a los modelos correspondientes de **OpenCode Go**; las cuotas y precios dependen del plan y pueden cambiar.

~~~bash
git clone https://github.com/jhcarlos8888/examResolve.git
cd examResolve
npm install
npm run doctor
npm run check
~~~

Se usa `playwright-core` para las pruebas y el MCP `@playwright/mcp@0.0.83` fijado por versión para la sesión del agente. `scripts/install-browser.sh` permite verificar la disponibilidad del MCP.

## Primer uso

~~~bash
# Práctica autorizada con confirmación antes de cada respuesta:
./scripts/resolve.sh https://ejemplo.org/simulacro --semi

# Ejecución automática autorizada, pero con verificaciones:
./scripts/resolve.sh https://ejemplo.org/simulacro --auto

# Continuar sobre la pestaña ya abierta por el agente:
./scripts/resolve.sh --current --semi
~~~

- **Semi (por defecto):** propone la respuesta y te pregunta antes de seleccionarla.
- **Auto:** no pide confirmación por cada respuesta, pero conserva las comprobaciones y la política de ritmo de la skill.
- Ambos modos verifican el estado real de la página antes de avanzar y se detienen ante contenido ilegible o controles del sitio.
- Si necesitas iniciar sesión en la plataforma, usa el modo visible descrito más abajo.

También puedes entrar en OpenCode con `./scripts/run.sh` y escribir `/resolver URL --semi` o `/resolver --current --auto` dentro de OpenCode. El agente primero confirma que existe un examen y no inventa preguntas si está en otra página.

## Navegador sin interrupciones

### Oculto de forma predeterminada

~~~bash
./scripts/resolve.sh https://ejemplo.org/simulacro --auto
# Alternativa con interfaz OpenCode:
PW_BROWSER_MODE=background ./scripts/run.sh
~~~

`scripts/playwright-mcp-brave.sh` lanza Brave con `--headless` de forma predeterminada y deja de forzar el display gráfico de Linux. Por ello las acciones del agente no deberían robar el foco de tus otras ventanas.

### Visor en vivo, solo cuando quieras

En **otra terminal**, desde el proyecto:

~~~bash
npm run watch
~~~

Se imprime un enlace parecido a `http://127.0.0.1:PUERTO/?key=TOKEN`. Abre esa URL en tu navegador personal **cuando decidas observar la ejecución**. El visor muestra una lista de pestañas y capturas que se actualizan aproximadamente cada 1,5 segundos. No hace clic, no envía respuestas y no activa ventanas del agente.

Para abrir directamente el visor por decisión tuya:

~~~bash
npm run watch:open
~~~

Si el agente todavía no abrió Brave, el visor indica que está esperando la sesión. Puedes cerrar solo el visor con Ctrl+C: el agente sigue trabajando en su navegador.

**Seguridad del visor:** el servidor HTTP y CDP se limitan a `127.0.0.1`. El visor genera un token aleatorio por arranque, usa cabeceras sin caché y no guarda las imágenes capturadas. **No compartas el enlace con token** ni expongas el puerto CDP a otras máquinas; CDP por sí mismo otorga amplio acceso al navegador a procesos locales.

### Modo visible para intervención humana

~~~bash
PW_BROWSER_MODE=visible ./scripts/run.sh
# También:
./scripts/resolve.sh https://ejemplo.org/simulacro --semi --visible
~~~

La ventana visible puede recuperar el foco; úsala solo si necesitas interactuar o autenticarte manualmente. Cuando termines, **cierra la sesión que mantiene abierto el perfil** y vuelve al modo predeterminado. No es posible convertir en una ventana normal una instancia headless que ya está viva sin reiniciarla: para verla mientras trabaja usa el visor anterior.

Brave usa un perfil persistente y separado del navegador personal: `runtime/brave-profile/`. Guarda cookies y sesiones autenticadas entre ejecuciones, pero no garantiza que una página exacta siga abierta tras un reinicio. **No abras dos instancias con el mismo perfil** y no elimines ese directorio sin saber que perderás tus sesiones.

## Arquitectura de modelos y subagentes

~~~text
OpenCode 2.x
  exam-operator — DeepSeek V4.1 Flash (OpenCode Go)
      ├── Pregunta textual clara → responde directamente
      ├── Texto ambiguo o difícil → exam-reviewer — GLM 5.3 Flash (Go)
      └── Gráfica/imagen/canvas → exam-vision — Nemotron 3.5 Super VL Free
                   │                    (OpenCode, modelo visual)
                   └── Captura del navegador vía Playwright MCP
                                   ↓
              Brave dedicado (headless por defecto)
                                   ↓
                 CDP localhost → visor opcional
~~~

| Agente | Modelo concreto | Responsabilidad |
| --- | --- | --- |
| `exam-operator` | `opencode-go/deepseek-v4.1-flash` | Orquestación, respuestas normales y comprobación |
| `exam-reviewer` | `opencode-go/glm-5.3-flash` | Segunda opinión independiente ante dudas |
| `exam-vision` | `opencode/nemotron-3.5-super-vl-free` | Lectura de fotografías, gráficos, diagramas, canvas, SVG y tablas visuales |

La configuración está en `opencode.json` y las instrucciones de cada agente en `.opencode/agents/`. La configuración global de OpenCode del usuario **no se modifica**.

**Cambio automático por pregunta:** el operador no cambia el modelo de su sesión activa. Cuando necesita visión o revisión, invoca al subagente indicado, espera el resultado y decide qué seleccionar. No se llama a los tres modelos para todas las preguntas, evitando latencia y gasto innecesarios. Como la delegación es instruida a un modelo de IA, debe validarse en pruebas reales; no es una garantía algorítmica absoluta.

**Visión de Playwright no es comprensión visual:** `--caps vision` permite acciones por coordenadas. La interpretación semántica la hace el modelo multimodal cuando **recibe de verdad** una captura. Si una imagen es ilegible o el subagente no puede verla, el agente debe reconocer el límite y no adivinar.

El modelo visual gratuito identificado pertenece al catálogo público **OpenCode**, no al listado de modelos Go gratuitos. DeepSeek y GLM Go están sujetos a las condiciones del plan. Comprueba la disponibilidad actual con:

~~~bash
~/.opencode/bin/opencode models
~~~

En OpenCode 2.x, `opencode models opencode-go` es un comando **inválido**: `models` ya no acepta ese argumento. Para pruebas puntuales desde CLI, `opencode run --model proveedor/modelo "mensaje"` sí admite un modelo específico.

## Flujo operativo y estrategias

1. Detecta si la URL o pestaña contiene una evaluación real, y distingue preguntas de filtros, login y controles decorativos.
2. Lee el enunciado, opciones, contexto, elementos visibles e iframes.
3. Delega a `exam-vision` cuando el contenido de una gráfica o imagen es indispensable; a `exam-reviewer` ante incertidumbre textual importante.
4. En modo semi, solicita aprobación antes de cambiar la selección.
5. Interactúa con la página y **verifica el valor real** (radio/checkbox marcado, texto guardado o estado interno) antes de avanzar.
6. Repite, recoge la puntuación visible y documenta aciertos, errores, bloqueos y pendientes, sin inventar resultados.

| Ruta | Tecnología | Ejemplo |
| --- | --- | --- |
| R1 | Snapshot de accesibilidad | Radios, botones y textos |
| R2 | Buscar dentro del snapshot | Páginas extensas |
| R3 | DOM, eventos nativos y comprobación | SPA, controles personalizados |
| R4 | Capturas multimodales y coordenadas | Imágenes, gráficos, canvas |
| R5 | Reportar y detener | Bloqueos, protección o contenido ilegible |

Las reglas específicas para Moodle, Dexway, Articulate Storyline, Clevry y NetAcad se cargan de las referencias cuando se reconoce su estructura. No garantizan compatibilidad con cualquier versión ni autorizan eludir controles de seguridad.

## Estructura del proyecto

| Archivo/directorio | Para qué sirve |
| --- | --- |
| `opencode.json` | Modelo, agente principal, permisos OpenCode V2 y MCP |
| `.opencode/agents/` | Operador DeepSeek, revisor GLM, especialista visual |
| `.opencode/skills/exam-resolver/SKILL.md` | Flujo central, control de ritmo y dispatcher de plataformas |
| `.opencode/skills/exam-resolver/references/` | Reglas y patrones de cada plataforma, audio y visión |
| `.opencode/command/resolver.md` | Comando `/resolver` |
| `AGENTS.md` | Instrucciones generales y límites operativos |
| `scripts/playwright-mcp-brave.sh` | Inicio del MCP y selección headless/visible |
| `scripts/playwright-mcp.config.json` | Configuración Brave y puerto CDP local |
| `scripts/watch-browser.mjs` y `monitor.html` | Visor privado de solo lectura |
| `scripts/resolve.sh` y `scripts/run.sh` | Flujos de inicio |
| `scripts/smoke.mjs` | Pruebas de los cinco simuladores |
| `scripts/browser-regression.mjs` | Pruebas reales del visor, foco y conexión CDP |
| `scripts/mcp-regression.mjs` | Prueba MCP real por JSON-RPC: navegación, DOM, snapshots y capturas |
| `docs/capacidades-playwright.md` | Matriz detallada R1–R5 |
| `docs/pruebas-reales.md` | Registro histórico de hallazgos y sesiones |
| `docs/urls-recon*.txt` y `scripts/recon.mjs` | Reconocimiento estructural de páginas |
| `resolveLogs/` | Registro de sesiones; resúmenes seleccionados versionados |
| `runtime/` | Perfil y capturas locales; excluido de Git |

## Diagnóstico y pruebas

~~~bash
npm run doctor         # Revisa sistema, modelos configurados, archivos y MCP V2
npm run typecheck      # Comprobación TypeScript de scripts
npm test               # 31 aserciones en 5 simuladores (Brave oculto)
npm run test:browser   # 7 verificaciones: CDP, token, capturas y foco
npm run test:mcp       # 6 verificaciones: MCP real, navegación, DOM e imágenes
npm run check          # Typecheck y las tres baterías de pruebas
~~~

**Qué cubren las pruebas:** radios, múltiples respuestas, selects, texto, iframes, SPA, conexiones CDP, capturas en vivo, foco y el protocolo MCP real conectado a un simulador local. Son 44 aserciones funcionales (31 + 7 + 6). **Qué NO cubren:** la exactitud de todos los modelos de IA, sus respuestas reales, las delegaciones en todas las plataformas ni los cambios de páginas ajenas. Probar primero con simuladores propios.

Para una prueba manual local, ejecuta en otra terminal:

~~~bash
python3 -m http.server 8765 --directory simulators
~~~

Después inicia `./scripts/run.sh` y escribe `/resolver http://127.0.0.1:8765/index.html --semi`.

## Preguntas frecuentes y solución de errores

**«opencode no encontrado»:** los scripts reconocen también `~/.opencode/bin/opencode`. Verifica con `~/.opencode/bin/opencode --version`.

**«El navegador sigue poniéndose delante»:** confirma `PW_BROWSER_MODE=background`, cierra sesiones MCP antiguas que se iniciaron en visible y crea una sesión nueva. Las preferencias solo se aplican al arrancar el MCP.

**«El visor está esperando»:** el MCP aún no abrió Brave, tu sesión terminó o `BRAVE_AGENT_PROFILE` apunta a otro directorio. Inicia una acción de navegación del agente.

**«Perfil ocupado»:** cierra otra sesión del agente que use `runtime/brave-profile/`. No compartas el perfil entre dos servidores.

**«El modelo no ve las imágenes»:** comprueba la invocación de `exam-vision` y que `browser_take_screenshot` le entregue una captura como imagen. Consulta `references/audio-y-visual.md`. Sin imagen legible, reporta y detente.

**«No aparece Playwright MCP»:** asegúrate de abrir el proyecto desde su raíz y de que OpenCode cargó `opencode.json`. En V2 los comandos pueden consultar el servicio global en lugar de la sesión del proyecto. Revisa `opencode debug config` y la interfaz de MCP dentro de esa sesión.

**Timeout o acción dudosa:** el MCP tiene 60 segundos para catálogo y ejecución. Verifica el estado del DOM antes de reintentar; un fallo de herramienta no implica que el clic anterior se haya revertido.

**Cambios que no surten efecto:** reinicia la sesión o recarga OpenCode: un MCP ya arrancado conserva los argumentos con los que se inició.

## Privacidad y uso seguro

- No captures credenciales ni guardes tokens del sitio en archivos versionados. El perfil dedicado contiene cookies y es información sensible.
- No compartas el enlace del visor; aunque la página del visor es de lectura, el puerto CDP local es privilegiado.
- Antes de publicar commits, revisa `resolveLogs/*/sesion*.md`: los resúmenes podrían contener preguntas y datos identificables.
- No evadas sistemas de vigilancia, anti-bots, límites de intentos ni bloqueos de captura.
- Los resultados de IA son probabilísticos: verifica la respuesta y no declares puntuación sin evidencia.
- `auto` no implica permisos ilimitados ni asegura que nunca haya que intervenir.
- El visor no permite hacer login, pulsar controles ni reanudar un examen manualmente; para eso usa el modo visible.

Consulta la [licencia](LICENSE), las [capacidades Playwright](docs/capacidades-playwright.md) y el [historial de pruebas reales](docs/pruebas-reales.md).
