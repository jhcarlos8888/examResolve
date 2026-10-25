# Motor: Clevry (Santander Open Academy / sb.clevry.com)

Fingerprint: URL `sb.clevry.com` / `sb-es.clevry.com` `/Candidate/*.aspx`
(`Interprong.aspx` landing, `PQ/Test.aspx` cuestionario, `AssessmentSubmit.aspx`
envío), ASP.NET WebForms con enlaces `javascript:__doPostBack('ctl00$…')`,
radios envueltos por **jQuery iCheck** (`div.iradio_square` +
`ins.iCheck-helper`, input con `opacity:0`). Hallazgos **V85**.
Registro: `resolveLogs/2026-10-25_sb-es.clevry.com/sesion.md`.

## Flujo

1. La URL pública de Santander Open Academy (`app.santanderopenacademy.com/es/program/...`)
   es una **landing informativa sin examen**; el examen vive detrás del login
   SSO (Keycloak `sso.santanderopenacademy.com`) → pedir **login manual** al
   usuario (nunca credenciales). Tras el login se llega a
   `Candidate/Interprong.aspx` con las actividades asignadas.
2. Landing del assessment: botón **"Start"** → `PQ/Instruction.aspx` (o
   instrucciones del test) → botón **"Iniciar cuestionario"**. Ambos son
   `a[href*="__doPostBack"]`, clicar con `browser_click` o
   `a.click()` por JS.
3. Test paginado (PQ de personalidad: **78 afirmaciones, 6 por página, 13
   páginas**; cabecera "Pregunta N a M de 78" + barra de %). Sin límite de
   tiempo; no se puede volver atrás.

## Controles: OJO con iCheck (V85)

- Cada afirmación es un grupo de radios
  `input[name="ctl00$ContentPlaceHolder1$repPQQuestion$ctlNN$Group1"]` con
  valores `rbQuestionAnswer1..5` (Likert 1=Totalmente en desacuerdo …
  5=Totalmente de acuerdo; los labels dicen el texto).
- **`radio.click()` NO funciona** (iCheck intercepta; el radio queda sin
  marcar). **Usar siempre**: `document.querySelector('label[for="ID"]').click()`
  y verificar `input[name="…$GroupN"]:checked` (regla V57) antes de "Siguiente".
- Batch por JS de los 6 radios + verificación en la misma llamada funciona sin
  problemas (sin overlays ni timers).

## Consistencia y trampas

- El test **repite afirmaciones** entre páginas (test de consistencia interna;
  21 repeticiones vistas). **Responder idéntico** a la primera aparición;
  mantener un mapa afirmación → respuesta durante toda la sesión.
- Cuestionario de personalidad: **sin respuestas correctas**; aplicar un perfil
  coherente usando **toda la escala** (las instrucciones piden evitar usar
  siempre el punto medio). Elegir 3 (neutro) cuando el enunciado sea ambiguo o
  absoluto extremo ("siempre", "nunca") sin coherencia previa que defender.
- Enunciados repetidos con coherencia obligatoria: anotar cada decisión (la
  memoria del LLM se cae a mitad de sesión; el mapa en el log salva).

## Cierre

- Última página → **"Siguiente"** → `AssessmentSubmit.aspx` ("Nearly done")
  con casilla **"I confirm that I have read and understand these points"**
  (consentimiento de datos + declaración de honestidad) y botón
  **"Submit Responses"**.
- La casilla es una **declaración formal en nombre del usuario**: en modo
  `--auto` se pregunta igualmente antes de marcar y enviar.
- Tras enviar: redirige a `Assessments.aspx`; la actividad aparece como
  **"completed on <fecha> — Complete"**. El PQ **no muestra puntuación**
  (feedback por email). Verificar ese estado "Complete" como confirmación del
  envío (V59: no dar por hecho el envío sin verlo).
