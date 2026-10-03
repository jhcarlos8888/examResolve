# Capacidades de Playwright MCP (v0.0.83) y estrategias por escenario

Referencia operativa del agente: qué herramienta usar según el tipo de página y
las protecciones que encuentre. El servidor se arranca con
`scripts/playwright-mcp-brave.sh` (Brave + perfil persistente + todas las caps).

Verificado por sonda stdio contra `@playwright/mcp@0.0.83`: **72 herramientas**.

## Caps activas

| Cap | Herramientas que añade | Uso en exámenes |
| --- | --- | --- |
| `vision` | `browser_mouse_*` (mover, click, drag, rueda por coordenadas) | Páginas cuyo árbol de accesibilidad no expone controles útiles |
| `testing` | `browser_verify_value`, `browser_verify_element_visible`, `browser_verify_text_visible`, `browser_verify_list_visible`, `browser_generate_locator` | Verificar que la respuesta quedó seleccionada antes de avanzar |
| `network` | `browser_route`, `browser_route_list`, `browser_unroute`, `browser_network_state_set` | Diagnosticar si el examen falla por llamadas API; simular respuestas |
| `storage` | `browser_cookie_*`, `browser_localstorage_*`, `browser_sessionstorage_*`, `browser_storage_state`, `browser_set_storage_state` | Mantener login/sesión del examen entre ejecuciones |
| `devtools` | `browser_start/stop_tracing`, `browser_start/stop_video`, `browser_highlight`, `browser_annotate`, `browser_resume` | Depurar páginas stubborn; grabar trazas de una sesión |
| `pdf` | `browser_pdf_save` | Exportar el set de preguntas a PDF (captura de solo lectura) |
| `config` | `browser_get_config` | Inspeccionar la config resuelta del MCP |

Herramientas **core** (siempre presentes, sin cap): `browser_navigate`,
`browser_snapshot`, `browser_find`, `browser_click`, `browser_hover`,
`browser_drag`, `browser_type`, `browser_fill_form`, `browser_select_option`,
`browser_press_key`, `browser_take_screenshot`, `browser_tabs`,
`browser_handle_dialog`, `browser_file_upload`, `browser_console_messages`,
`browser_network_requests`, `browser_network_request`, `browser_evaluate`,
`browser_run_code_unsafe`, `browser_wait_for`, `browser_resize`, `browser_close`.

Nota: el `--help` de 0.0.83 declara solo `vision, pdf, devtools`, pero
`network, storage, testing, config` también se aceptan y registran sus
herramientas (sonido verificado con sonda MCP).

## Escalera de estrategias (de menor a mayor costo de tokens)

El agente debe subir escalones solo cuando el anterior falle:

```text
R1  browser_snapshot            → árbol de accesibilidad + refs (preferida)
R2  browser_find                → buscar texto dentro de la página sin snapshot completo
R3  browser_evaluate            → leer/manipular DOM por JS cuando el a11y tree es pobre
R4  vision (screenshot + xy)    → cuando ni refs ni DOM sirven para interactuar
R5  reportar bloqueo            → detenerse; nunca evadir protecciones
```

`browser_run_code_unsafe` es una variante de R3 para operaciones por lote
(recorrer varias preguntas con la API de Playwright en una sola llamada).

> **Importante sobre R4 y el modelo**: `browser_take_screenshot` devuelve la
> imagen al modelo. Si el modelo activo **no soporta entrada de imagen** (p.
> ej. `zen-proxy/mimo-v2.6-flash-free`), la captura no se puede leer y R4
> queda inutilizado para *comprender* la página — el error típico es
> *"Cannot read image (this model does not support image input)"*.
> Alternativas sin visión: extraer `alt`/`src` descriptivos con R3, usar los
> `[box=...]` del snapshot (`--snapshot-boxes`) para **hacer** clicks por
> coordenadas sin mirar, y R5 con propuesta de cambiar a un modelo
> multimodal para preguntas puramente visuales.

## Matriz escenario → estrategia

| Escenario | Estrategia | Herramientas concretas |
| --- | --- | --- |
| Página normal con radios/botones | R1 | `browser_snapshot` → `browser_click` sobre el ref del radio |
| Página muy larga (muchas preguntas visibles) | R1+R2 | `browser_find` por enunciado u opción |
| Controles sin rol accesible (divs clickeables, SPA) | R3 | `browser_evaluate` para localizar nodos; clicking por selector o R4 |
| Sitio **bloquea screenshots** | R1+R3 (+boxes) | El snapshot se emite con `[box=x,y,w,h]`; `browser_evaluate` lee el DOM; click por ref o por coordenadas del box sin captura |
| Framework **ignora** cambios sintéticos (`checked=true` a mano) | R1/R3 con click real | Preferir `browser_click` (click real de Playwright). Fallback en JS: `el.click()` y luego disparar `input`+`change` con `bubbles:true` |
| Examen dentro de **iframe** | R1 | El snapshot incluye el frame; los refs funcionan igualmente. Alternativa: `browser_evaluate` con acceso al `contentDocument` |
| **Drag & drop** (matching, ordenar) | R4 | `browser_mouse_drag_xy` con coordenadas del snapshot/box |
| Dropdown / select | R1 | `browser_select_option`; fallback R3 con `el.value=...` + `input`/`change` |
| Verificación de la respuesta | testing | `browser_verify_value` / `browser_verify_element_visible`; o `browser_evaluate` leyendo `:checked` |
| El botón "Siguiente" no responde / llamada API falla | diagnóstico | `browser_network_requests` + `browser_console_messages` |
| Se pierde la sesión del examen | storage + perfil | El perfil `runtime/brave-profile/` ya persiste cookies; `browser_cookie_list/set` para inspección/reparación |
| Ventana de diálogo/alert del sitio | R1 | `browser_handle_dialog` |
| **Preguntas con audio / listening** | R3 → R5 | Buscar transcript (toggle "Show transcript", `[class*=transcript]`, `<track>`, `data-transcript`); si es TTS, envolver `speechSynthesis.speak` antes de reproducir para capturar el texto; sin transcript → **R5** (nunca adivinar) |
| Página que rechaza automatización o capturas | R5 | Reportar el obstáculo y detenerse (ver Límites) |

## Patrones de `browser_evaluate` para formularios

Leer todas las preguntas de la página:

```js
() => [...document.querySelectorAll('input[type=radio]')].map(r => ({
  name: r.name, value: r.value,
  label: r.closest('label')?.innerText || r.parentElement.innerText
}))
```

Marcar una opción disparando los eventos que escuchan los frameworks:

```js
(el) => {
  el.click();
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
```

Verificar la selección actual:

```js
() => [...document.querySelectorAll('input[type=radio]:checked')]
       .map(r => r.closest('label')?.innerText || r.value)
```

Preferencia: si `browser_click` sobre el ref funciona, úsalo — es el click
real del navegador y el más compatible con frameworks.

## Límites (no negociables)

- No evadir anti-automation, anti-screenshot, DRM, proctoring ni controles de
  acceso. Si la página los activa → reportar y parar.
- No extraer credenciales ni estado oculto del navegador.
- Las caps `devtools`/`network` son para diagnóstico propio, no para suplir
  protecciones del sitio.

## Costo de tokens

Todas las caps registran sus tools en el contexto del modelo. Si una sesión
resulta muy pesada, degrada solo esa ejecución:

```bash
PW_CAPS=vision,testing ./scripts/run.sh
```
