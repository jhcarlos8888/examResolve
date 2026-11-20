# Preguntas visuales y de audio

Reglas para dos tipos de pregunta que el flujo genérico no cubre:
contenido **visual** (imágenes, canvas, SVG) y contenido **auditivo**
(listening, TEXTO, doblaje).

`SKILL.md` tiene el resumen; este archivo tiene el desarrollo completo con
los fragmentos de código.

## Preguntas visuales (imágenes/gráficos)

1. Intenta siempre antes extraer texto: `alt`, `title`, `figcaption`,
   `aria-label`, `data-*`, el texto del contenedor y el **nombre de archivo
   del `src`** si es descriptivo (`usb-port.jpg`) — todo vía
   `browser_evaluate`.
2. **Delegación especializada automática:** el agente principal
   `exam-operator` usa DeepSeek Flash para texto, pero cuando una respuesta
   depende de información visual debe invocar `exam-vision` (Nemotron
   3.5 Super VL Free). Este subagente usa `browser_take_screenshot` del
   MCP compartido y devuelve transcripción, ejes/leyendas, opción,
   razonamiento y confianza. Evita tomar capturas de pantalla completa si
   es posible capturar el elemento específico a mejor resolución.
3. **Fallo de visión:** si el subagente no recibe la imagen, informa
   "pregunta visual no legible", solicita intervención manual o usa
   solo las partes realmente legibles; no adivines ni confundas
   `--caps vision` con la capacidad multimodal del modelo.
4. Verifica la selección igual que en cualquier otro tipo (nunca asumas que
   el click acertó).

La decisión de **qué** respuesta es correcta la tomas tú con tu conocimiento
del tema. Si no sabes la respuesta con razonable confianza, elige la mejor
justificada y, en modo `semi`, dilo explícitamente.

## Preguntas con audio / listening (inglés con audio)

Detecta audio en: elementos `<audio>`/`<source>`, iframes de
youtube/soundcloud, botones "Play audio"/"▶ Play"/"Listen", marcadores
`transcript`, y juegos TTS. Ladder de resolución:

1. **Transcript en la página** → ¡caso fácil! (hallado en testme.com:
   botón "Show transcript" por pregunta). Pulsa todos los toggles, lee el
   texto de cada audio y responde normalmente. Verificado: **5/5**.
2. **Transcript oculto en DOM**: busca `[class*=transcript]`,
   `[id*=script]`, `<track kind=...>`, atributos `data-transcript`, o texto
   tipo "See transcript"/"Transcription" vía `browser_evaluate`.
3. **Juegos TTS (speechSynthesis)**: si no hay `<audio>`, la voz es
   sintetizada. Engancha `speechSynthesis.speak` ANTES de reproducir para
   capturar el texto hablado (hallado en talkdrill.com):

   ```js
   () => {
     window.__tts = [];
     const orig = speechSynthesis.speak.bind(speechSynthesis);
     speechSynthesis.speak = (u) => { window.__tts.push(String(u.text || '')); return orig(u); };
   }
   ```

   Luego haz clic en "Play/Passage", espera, y lee `window.__tts`.
4. **Audio sin transcript y sin TTS** (hallado en oxfordonlineenglish 24
   preguntas, ielts-up): el modelo no puede oír audio. **R5**: reporta
   "preguntas de audio sin transcripción" y ofrece al usuario resolverlas
   manualmente, o preguntar si el sitio ofrece pistas (p. ej. "Show hint"
   de ielts-up). **Nunca adivines respuestas de audio.**
5. Si la UI del juego no avanza tras reproducir (entorno sin dispositivo de
   audio), reporta el bloqueo junto con el transcript capturado.
