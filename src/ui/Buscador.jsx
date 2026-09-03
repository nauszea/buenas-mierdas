import { useMemo, useRef, useState } from 'react'
import VentanaRetro from './VentanaRetro.jsx'
import { useTexto } from '../lib/idioma.js'

// ---------------------------------------------------------------------------
// Buscador (pantalla 5): se abre con Ctrl+F o con el botón ⌕.
// Índice visual de afectos; al hacer clic la cámara vuela hacia el elegido.
//
// Dos modos, según si hay texto escrito:
// - En reposo: lista alfabética completa, con un índice A-Z arriba para
//   saltar directo a esa sección (como una agenda de contactos).
// - Escribiendo: la lista se filtra Y se agrupa por etiqueta (un afecto con
//   varios tags puede aparecer en más de un grupo) — ahí es cuando importan
//   las categorías, no explorando en reposo.
// ---------------------------------------------------------------------------

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const SIN_ETIQUETA = '(sin etiqueta)'

function agruparPorTag(afectos) {
  const grupos = new Map()
  afectos.forEach((a) => {
    const tags = a.tags.length ? a.tags : [SIN_ETIQUETA]
    tags.forEach((tag) => {
      if (!grupos.has(tag)) grupos.set(tag, [])
      grupos.get(tag).push(a)
    })
  })
  return [...grupos.entries()]
    .sort(([tagA], [tagB]) => tagA.localeCompare(tagB))
    .map(([tag, items]) => [tag, [...items].sort((a, b) => a.nombre.localeCompare(b.nombre))])
}

function primeraLetra(nombre) {
  return (nombre[0] || '#').toUpperCase()
}

function ItemAfecto({ a, onVolar }) {
  return (
    <button className="item-afecto" onClick={() => onVolar(a)}>
      <span className="muestra-color" style={{ background: a.color }} />
      <span className="item-nombre">{a.nombre}</span>
      <span className="item-coords">
        [{a.posicion.map((n) => Math.round(n)).join(', ')}]
      </span>
      <span className="item-tags">
        {a.tags.map((tag) => (
          <span key={tag} className="chip-tag">#{tag}</span>
        ))}
      </span>
    </button>
  )
}

export default function Buscador({ afectos, onVolar, onCerrar }) {
  const { t } = useTexto()
  const [filtro, setFiltro] = useState('')
  const listaRef = useRef()

  const texto = filtro.trim().toLowerCase()

  const ordenados = useMemo(
    () => [...afectos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [afectos],
  )
  const letrasConDatos = useMemo(
    () => new Set(ordenados.map((a) => primeraLetra(a.nombre))),
    [ordenados],
  )

  // ojo: NO usar scrollIntoView acá — cuando el elemento ya está "visible lo
  // suficiente" para el navegador, sube a mover el scroll de un ancestro
  // (hasta el de la página entera) en vez del div interno. Con getBoundingClientRect
  // se calcula la distancia real dentro del contenedor y se mueve SOLO su scrollTop.
  const irALetra = (letra) => {
    const contenedor = listaRef.current
    const el = contenedor?.querySelector(`[data-letra="${letra}"]`)
    if (!contenedor || !el) return
    contenedor.scrollTop += el.getBoundingClientRect().top - contenedor.getBoundingClientRect().top
  }

  return (
    <VentanaRetro titulo={t.buscadorTitulo} onCerrar={onCerrar}>
      <input
        className="input-retro"
        type="text"
        placeholder={t.buscadorPlaceholder}
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        autoFocus
      />

      {!texto && (
        <div className="indice-alfabetico">
          {LETRAS.map((letra) => (
            <button
              key={letra}
              className="indice-letra"
              disabled={!letrasConDatos.has(letra)}
              onClick={() => irALetra(letra)}
            >
              {letra}
            </button>
          ))}
        </div>
      )}

      <div className="lista-afectos" ref={listaRef}>
        {texto ? (
          (() => {
            const resultados = afectos.filter(
              (a) =>
                a.nombre.toLowerCase().includes(texto) ||
                a.tags.some((tag) => tag.toLowerCase().includes(texto)),
            )
            return resultados.length === 0 ? (
              <p className="sin-resultados">{t.buscadorVacio}</p>
            ) : (
              agruparPorTag(resultados).map(([tag, items]) => (
                <div key={tag}>
                  <p className="categoria-titulo">{tag === SIN_ETIQUETA ? tag : `#${tag}`}</p>
                  {items.map((a) => <ItemAfecto key={a.id} a={a} onVolar={onVolar} />)}
                </div>
              ))
            )
          })()
        ) : (
          ordenados.map((a, i) => {
            const letra = primeraLetra(a.nombre)
            const esPrimeraDeLetra = i === 0 || primeraLetra(ordenados[i - 1].nombre) !== letra
            return (
              <div key={a.id} data-letra={esPrimeraDeLetra ? letra : undefined}>
                <ItemAfecto a={a} onVolar={onVolar} />
              </div>
            )
          })
        )}
      </div>
    </VentanaRetro>
  )
}
