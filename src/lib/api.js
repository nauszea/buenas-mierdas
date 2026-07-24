import PocketBase from 'pocketbase'
import { AFECTOS } from '../data/afectos.js'

// ---------------------------------------------------------------------------
// api.js — la única puerta hacia los datos.
//
// Funciona en DOS modos, automáticamente:
//
//  · MODO ALTAR (con backend): si Pocketbase está corriendo en tu laptop
//    (http://127.0.0.1:8090), todo se guarda ahí de verdad: los .glb,
//    las historias y las reapropiaciones. Instrucciones en backend/README.md.
//
//  · MODO ENSAYO (sin backend): si no hay Pocketbase, la app no se rompe:
//    guarda los afectos en el propio navegador (localStorage). Los textos
//    sobreviven al recargar; el archivo 3D solo dura la sesión (el navegador
//    no puede guardar archivos grandes para siempre — para eso está el altar).
// ---------------------------------------------------------------------------

const URL_BACKEND = 'http://127.0.0.1:8090'
const pb = new PocketBase(URL_BACKEND)
pb.autoCancellation(false)

let modoBackend = null // null = aún no sabemos; true/false después del primer intento
const glbDeLaSesion = new Map() // id → URL temporal del .glb (solo modo ensayo)

const PASTELES = ['#ffb7d5', '#e2d7ff', '#c9f6ff', '#ffe9a8', '#b8e6c9', '#ffd6e8']
const FORMAS = ['icosaedro', 'caja', 'esfera', 'toro', 'nudo', 'dodecaedro']

async function hayBackend() {
  if (modoBackend !== null) return modoBackend
  try {
    await pb.health.check({ requestKey: null })
    modoBackend = true
  } catch {
    modoBackend = false
    console.info('[buenas mierdas] sin Pocketbase: modo ensayo (localStorage)')
  }
  return modoBackend
}

export function estaEnModoAltar() {
  return modoBackend === true
}

// coordenada nueva en el domo del altar (bien espaciado: hay que explorar)
function posicionNueva() {
  const angulo = Math.random() * Math.PI * 2
  const radio = 18 + Math.random() * 42
  return [
    Math.round(Math.cos(angulo) * radio * 10) / 10,
    Math.round((1 + Math.random() * 26) * 10) / 10,
    Math.round(Math.sin(angulo) * radio * 10) / 10,
  ]
}

function alAzar(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

// ---- modo ensayo: guardar/leer del navegador ----
const CLAVE_LOCAL = 'buenas-mierdas-afectos'

function leerLocales() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_LOCAL)) || []
  } catch {
    return []
  }
}

function guardarLocales(lista) {
  localStorage.setItem(CLAVE_LOCAL, JSON.stringify(lista))
}

// ---- conversor: registro de Pocketbase → afecto de la app ----
function desdeRegistro(r) {
  return {
    id: r.id,
    nombre: r.nombre,
    historia: r.historia,
    ubicacion: r.ubicacion,
    tags: r.tags || [],
    posicion: r.posicion,
    color: r.color || '#ffd6e8',
    forma: r.forma || 'icosaedro',
    glb: r.modelo ? pb.files.getUrl(r, r.modelo) : undefined,
    reapropiaciones: r.reapropiaciones || 0,
    esBackend: true,
  }
}

// ---------------------------------------------------------------------------
// API pública (lo que usa App.jsx)
// ---------------------------------------------------------------------------

export async function cargarAfectos() {
  const semillas = AFECTOS.map((a) => ({ ...a, reapropiaciones: 0 }))
  if (await hayBackend()) {
    const registros = await pb.collection('afectos').getFullList({ sort: 'created' })
    return [...semillas, ...registros.map(desdeRegistro)]
  }
  const locales = leerLocales().map((a) => ({ ...a, glb: glbDeLaSesion.get(a.id) }))
  return [...semillas, ...locales]
}

export async function subirAfecto({ nombre, ubicacion, historia, tags, archivo }) {
  const base = {
    nombre,
    ubicacion,
    historia,
    tags,
    posicion: posicionNueva(),
    color: alAzar(PASTELES),
    forma: alAzar(FORMAS),
    reapropiaciones: 0,
  }

  if (await hayBackend()) {
    const fd = new FormData()
    fd.append('nombre', base.nombre)
    fd.append('ubicacion', base.ubicacion)
    fd.append('historia', base.historia)
    fd.append('tags', JSON.stringify(base.tags))
    fd.append('posicion', JSON.stringify(base.posicion))
    fd.append('color', base.color)
    fd.append('forma', base.forma)
    fd.append('reapropiaciones', '0')
    if (archivo) fd.append('modelo', archivo)
    const registro = await pb.collection('afectos').create(fd)
    return desdeRegistro(registro)
  }

  // modo ensayo
  const nuevo = { ...base, id: 'local-' + Date.now(), esBackend: false }
  guardarLocales([...leerLocales(), nuevo])
  if (archivo) {
    const url = URL.createObjectURL(archivo)
    glbDeLaSesion.set(nuevo.id, url)
    return { ...nuevo, glb: url }
  }
  return nuevo
}

export async function registrarReapropiacion(afecto, cuentaNueva) {
  if (afecto.esBackend && (await hayBackend())) {
    try {
      await pb.collection('afectos').update(afecto.id, { reapropiaciones: cuentaNueva })
    } catch {
      // si falla, el destello igual pasó; el número se corrige al recargar
    }
  } else if (!afecto.esBackend && String(afecto.id).startsWith('local-')) {
    guardarLocales(
      leerLocales().map((a) => (a.id === afecto.id ? { ...a, reapropiaciones: cuentaNueva } : a)),
    )
  }
}
