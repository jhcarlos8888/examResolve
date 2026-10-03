# OpenCode Browser Simulation Agent

## Purpose
This project is a local browser-agent harness for authorized training, QA, and exam-simulation pages.
The agent uses OpenCode's configured model and the Playwright MCP browser tools. Do not introduce Ollama into this project.

## Exam resolution
The full detection-and-answering workflow lives in the project skill
`.opencode/skills/exam-resolver/SKILL.md`. Trigger it when the user asks to
resolve, detect, or start answering an exam/quiz/form (including "comienza a
contestar" on the current page). Key points it defines:

- **Modes**: `auto` (answer everything, report at the end) and `semi` (after
  each question, present the chosen answer and wait for the user's confirmation
  via the `question` tool before selecting). Default to `semi` when the user
  has not explicitly asked for full automation.
- **Detection**: heuristics to decide whether the current page actually
  contains an exam (forms, radio/checkbox groups, ARIA roles, "Pregunta X de
  Y", next/submit buttons, iframes) before answering anything.
- **Mandatory verification**: never advance without confirming the selection
  took effect (`browser_verify_*` or a `browser_evaluate` read of `:checked`).
- **Strategy ladder**: R1 `browser_snapshot` → R2 `browser_find` →
  R3 `browser_evaluate`/`browser_run_code_unsafe` → R4 vision mode →
  R5 report the blockage and stop. Full scenario matrix in
  `docs/capacidades-playwright.md`. Climb only when the previous rung fails.
- **R4 requires a multimodal model.** The default `mimo-v2.6-flash-free` is
  text-only; the skill probes this once at startup and skips R4 if the model
  cannot read images.

## Skill structure (keep it small)
`SKILL.md` is the core flow and is read on **every** invocation, so keep it
under ~350 lines. Per-engine and per-site detail belongs in
`.opencode/skills/exam-resolver/references/`, loaded only when its fingerprint
matches (`patrones-comunes.md`, `audio-y-visual.md`, `dexway.md`,
`articulate-storyline.md`). When you add a finding, put it in the matching
reference file and add its fingerprint to the "Dispatcher de motores" table in
`SKILL.md`; do not grow the core.

## Verification before changing anything
```bash
npm run check   # typecheck + smoke test (resuelve los 5 simuladores y verifica N/N)
npm run doctor  # sistema, MCP, npm, scripts, skill, runtime
```
`npm test` drives the same primitives the agent uses (`:checked`, native
setter + events, exact visible text, iframe traversal). If it breaks, real
exams break too.

## Browser
- The MCP server launches Brave through `scripts/playwright-mcp-brave.sh`.
- Use the dedicated persistent profile under `runtime/brave-profile/` so the user's normal Brave profile is not locked or modified.
- Playwright MCP runs headed by default with all capabilities enabled (vision, testing, network, storage, devtools, pdf, config); vision mode is the fallback for pages whose accessibility tree does not expose an interactive element. Capability override: `PW_CAPS` env var in `scripts/playwright-mcp-brave.sh`.

## Interaction strategy
1. Prefer `browser_snapshot` / accessibility data first. This is normally cheaper and more reliable than screenshots.
2. Use `browser_find` when searching a large page for a question, answer, button, or label.
3. Use ordinary semantic tools such as `browser_click`, `browser_type`, `browser_fill_form`, and `browser_select_option` whenever possible.
4. When an interactive region is not exposed in the accessibility tree, use Vision Mode (`browser_take_screenshot` plus coordinate-based mouse tools) when the page/browser permits screenshots **and the active model can read images**.
5. If the page rejects screenshots or automation, do not attempt to bypass anti-automation, anti-screenshot, DRM, proctoring, or access-control mechanisms. Report the obstacle and stop or ask for manual intervention.
6. After every answer action, verify the visible state before advancing whenever practical.
7. Do not guess if the question or options are unreadable — including audio you cannot transcribe and images you cannot see. Ask for a screenshot/manual check instead.

## Simulation workflow
When the user says to run a simulation (or gives a URL / points at the current tab):
1. Navigate to the supplied URL, or list tabs (`browser_tabs`) and use the active page when no URL is given.
2. Run exam detection (skill Paso 1); report clearly if the page has no exam.
3. Identify the question area and all answer choices.
4. Determine the answer using the currently selected OpenCode model.
5. Select/fill the answer. In `semi` mode, confirm with the user first.
6. Verify the selection.
7. Advance to the next question.
8. Continue until the simulation ends.
9. Report the final score/result if the page provides it, following the skill's report format.

## Important
- This project is for authorized simulation/training/QA use.
- Never use hidden browser state, credential theft, or page-security bypasses.
- Never expose secrets or authentication tokens in logs.
