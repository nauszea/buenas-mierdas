// ---------------------------------------------------------------------------
// efectos.js — sonidos cortos de logro, sintetizados igual que musica.js
// (WebAudio en vivo, sin archivos, cero peso). Comparten un solo contexto
// de audio, creado recién cuando se necesita el primer sonido.
// ---------------------------------------------------------------------------

let ctx = null

function contexto() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function nota(c, frecuencia, cuando, duracion, volumen) {
  const osc = c.createOscillator()
  const gan = c.createGain()
  osc.type = 'square'
  osc.frequency.value = frecuencia
  gan.gain.setValueAtTime(0, cuando)
  gan.gain.linearRampToValueAtTime(volumen, cuando + 0.01)
  gan.gain.exponentialRampToValueAtTime(0.001, cuando + duracion)
  osc.connect(gan).connect(c.destination)
  osc.start(cuando)
  osc.stop(cuando + duracion + 0.05)
}

// EL ACORDE TRIUNFAL — referencia: el "niqui niqui" del plumbob dorado de
// Los Sims. Cuatro notas de un acorde mayor, subiendo rápido; la última se
// queda sonando un poco más — la sensación de "algo grande acaba de pasar".
// Para cambiar las notas: son frecuencias en Hz (C5=523.3, E5=659.3,
// G5=784.0, C6=1046.5 — un acorde de Do mayor, una octava de diferencia
// entre la primera y la última nota).
export function sonidoConsagrar() {
  const c = contexto()
  const ahora = c.currentTime
  const notas = [523.3, 659.3, 784.0, 1046.5]
  notas.forEach((frecuencia, i) => {
    const esUltima = i === notas.length - 1
    nota(c, frecuencia, ahora + i * 0.09, esUltima ? 0.8 : 0.16, esUltima ? 0.11 : 0.09)
  })
}

// el "plinnnn" de cada reapropiación — como un xilófono/lira: NO usa
// nota()/'square' de arriba, porque una sola onda cuadrada suena a botón
// de videojuego. Un xilófono real no es un tono puro: es una fundamental
// más un par de sobretonos INarmónicos (no múltiplos exactos — por eso
// "campana"/"barra" y no "flauta"), con ataque rápido y una cola larga
// que se apaga sola. Para cambiar el tono: `fundamental` en Hz. Para
// cambiar cuánto "suena sostenido": el 0.9 de abajo (segundos de cola).
export function sonidoReapropiar() {
  const c = contexto()
  const ahora = c.currentTime
  const fundamental = 1108.7 // C#6 — cálido, no tan agudo como el "tin" anterior
  const cola = 0.9
  const parciales = [
    { razon: 1, volumen: 0.075 },
    { razon: 2.4, volumen: 0.03 }, // inarmónico: le da el timbre "barra golpeada"
    { razon: 4.1, volumen: 0.012 },
  ]
  parciales.forEach(({ razon, volumen }) => {
    const osc = c.createOscillator()
    const gan = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = fundamental * razon
    gan.gain.setValueAtTime(0, ahora)
    gan.gain.linearRampToValueAtTime(volumen, ahora + 0.006) // ataque de mazo, casi instantáneo
    gan.gain.exponentialRampToValueAtTime(0.0004, ahora + cola) // cola que se apaga sola
    osc.connect(gan).connect(c.destination)
    osc.start(ahora)
    osc.stop(ahora + cola + 0.05)
  })
}

// la musiquita de los créditos — un "ganaste el juego" de verdad, no solo
// un acorde corto como sonidoConsagrar: una escalerita que sube, un
// respiro, y un remate más alto que se queda sonando. Distinta a propósito
// de las demás — esta es la única que se oye una sola vez en toda la app,
// al abrir los créditos.
export function sonidoCreditos() {
  const c = contexto()
  const ahora = c.currentTime
  const melodia = [
    { frecuencia: 523.3, cuando: 0, duracion: 0.12 }, // C5
    { frecuencia: 659.3, cuando: 0.12, duracion: 0.12 }, // E5
    { frecuencia: 784.0, cuando: 0.24, duracion: 0.12 }, // G5
    { frecuencia: 1046.5, cuando: 0.36, duracion: 0.22 }, // C6
    { frecuencia: 784.0, cuando: 0.62, duracion: 0.12 }, // G5 (respiro)
    { frecuencia: 1046.5, cuando: 0.74, duracion: 0.12 }, // C6
    { frecuencia: 1318.5, cuando: 0.86, duracion: 0.55 }, // E6 — remate sostenido
  ]
  melodia.forEach(({ frecuencia, cuando, duracion }) => nota(c, frecuencia, ahora + cuando, duracion, 0.09))
}

// el "materializar" de cualquier ventana al abrirse (Fase N64) — a
// propósito NO es una nota de 'square' como las de arriba: es un barrido
// de frecuencia muy corto en un oscilador 'sine' (más suave, sin el
// timbre de videojuego de 8 bits) pasado por un filtro que se abre de
// golpe, más parecido a un "clic" digital que a una melodía.
export function sonidoAparecer() {
  const c = contexto()
  const ahora = c.currentTime
  const osc = c.createOscillator()
  const filtro = c.createBiquadFilter()
  const gan = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, ahora)
  osc.frequency.exponentialRampToValueAtTime(900, ahora + 0.09)
  filtro.type = 'lowpass'
  filtro.frequency.setValueAtTime(200, ahora)
  filtro.frequency.exponentialRampToValueAtTime(4000, ahora + 0.09)
  gan.gain.setValueAtTime(0, ahora)
  gan.gain.linearRampToValueAtTime(0.07, ahora + 0.015)
  gan.gain.exponentialRampToValueAtTime(0.001, ahora + 0.14)
  osc.connect(filtro).connect(gan).connect(c.destination)
  osc.start(ahora)
  osc.stop(ahora + 0.16)
}
