// ---------------------------------------------------------------------------
// musica.js — el reproductor 8-bits del altar.
//
// No usa archivos: SINTETIZA la música en vivo con WebAudio, con ondas
// cuadradas (la voz de un Game Boy) y triangulares (el bajo). Es una
// canción de cuna pentatónica, lenta y dulce, que hace loop infinito.
// Cero descargas, cero copyright, cero peso.
//
// Si algún día quieres una canción tuya: pon un archivo en
// public/musica/tema.mp3 y este módulo lo usará en lugar del sintetizador.
// ---------------------------------------------------------------------------

let ctx = null
let maestro = null
let temporizador = null
let audioHtml = null
let sonando = false
let compas = 0

// Do mayor pentatónico, registro dulce (frecuencias en Hz)
const NOTAS = { C4: 261.6, D4: 293.7, E4: 329.6, G4: 392.0, A4: 440.0, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784.0 }

// la melodía: 16 pasos por vuelta, null = silencio (respiración)
const MELODIA = [
  'E5', null, 'C5', 'D5', 'E5', null, 'G5', null,
  'E5', 'D5', 'C5', null, 'A4', null, 'C5', null,
  'D5', null, 'E5', 'C5', 'A4', null, 'G4', null,
  'C5', null, 'D5', null, 'C5', null, null, null,
]
const BAJO = ['C4', 'G4', 'A4', 'G4'] // una nota por compás de 8 pasos
const PASO = 0.28 // segundos por paso (~lento, de cuna)

function nota(frecuencia, cuando, duracion, tipo, volumen) {
  const osc = ctx.createOscillator()
  const gan = ctx.createGain()
  osc.type = tipo
  osc.frequency.value = frecuencia
  // envolvente de "chip": ataque instantáneo, caída rápida
  gan.gain.setValueAtTime(0, cuando)
  gan.gain.linearRampToValueAtTime(volumen, cuando + 0.01)
  gan.gain.exponentialRampToValueAtTime(0.001, cuando + duracion)
  osc.connect(gan).connect(maestro)
  osc.start(cuando)
  osc.stop(cuando + duracion + 0.05)
}

function programarVuelta() {
  const inicio = ctx.currentTime + 0.05
  MELODIA.forEach((nombre, i) => {
    if (nombre) nota(NOTAS[nombre], inicio + i * PASO, PASO * 0.9, 'square', 0.045)
    if (i % 8 === 0) {
      const grave = NOTAS[BAJO[(compas + i / 8) % BAJO.length]] / 2
      nota(grave, inicio + i * PASO, PASO * 7.5, 'triangle', 0.05)
    }
  })
  compas = (compas + MELODIA.length / 8) % BAJO.length
  temporizador = setTimeout(programarVuelta, MELODIA.length * PASO * 1000 - 60)
}

export async function alternarMusica() {
  // ¿hay una canción propia en public/musica/tema.mp3?
  if (audioHtml === null) {
    try {
      const prueba = await fetch('/musica/tema.mp3', { method: 'HEAD' })
      const esAudio = prueba.ok && (prueba.headers.get('content-type') || '').includes('audio')
      audioHtml = esAudio ? Object.assign(new Audio('/musica/tema.mp3'), { loop: true, volume: 0.5 }) : false
    } catch {
      audioHtml = false
    }
  }

  if (sonando) {
    if (audioHtml) audioHtml.pause()
    if (temporizador) clearTimeout(temporizador)
    if (maestro) maestro.gain.value = 0
    sonando = false
    return false
  }

  if (audioHtml) {
    audioHtml.play()
  } else {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      maestro = ctx.createGain()
      // filtro suave para que el "chip" no chille
      const filtro = ctx.createBiquadFilter()
      filtro.type = 'lowpass'
      filtro.frequency.value = 2600
      maestro.connect(filtro).connect(ctx.destination)
    }
    if (ctx.state === 'suspended') await ctx.resume()
    maestro.gain.value = 1
    programarVuelta()
  }
  sonando = true
  return true
}
