import { useEffect, useState } from 'react'
import VentanaRetro from './VentanaRetro.jsx'
import { useTexto } from '../lib/idioma.js'
import { sonidoCreditos } from '../lib/efectos.js'

// ---------------------------------------------------------------------------
// Creditos: el gesto escondido del archivo — un botón chico, abajo a la
// derecha, casi invisible. Al abrirlo: la musiquita de "ganaste el juego",
// un crawl de texto que sube como los títulos finales de una película, y
// al final una animación ASCII de regalo (un piolín con lentes de sol,
// porque sí).
// ---------------------------------------------------------------------------

// dos cuadros nomás: el piolín normal, y el mismo con lentes de sol
// puestos — el "cangri" pedido. Se alternan cada FRAME_MS.
const CUADROS_ASCII = [
  '   ,___,\n   (o.o)\n   /)  )\n  -"---"-',
  '   ,___,\n   (⌐■_■)\n   /)  )\n  -"---"-',
]
const FRAME_MS = 500
const DURACION_CRAWL_S = 12
// el piolín aparece ANTES de que el crawl termine del todo (no a los 12s
// exactos) — así no se siente como una espera aparte pegada al final,
// sino que llega "encima" de las últimas líneas
const RETRASO_ASCII_S = DURACION_CRAWL_S - 2

export default function Creditos({ onCerrar, zIndex }) {
  const { t } = useTexto()
  const [cuadro, setCuadro] = useState(0)

  useEffect(() => {
    sonidoCreditos()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCuadro((c) => (c + 1) % CUADROS_ASCII.length), FRAME_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <VentanaRetro titulo={t.creditosTitulo} onCerrar={onCerrar} zIndex={zIndex}>
      <div className="creditos-cuerpo">
        <div className="creditos-crawl-marco">
          <p
            className="creditos-crawl-texto"
            style={{ whiteSpace: 'pre-line', animationDuration: `${DURACION_CRAWL_S}s` }}
          >
            {t.creditosTexto}
          </p>
        </div>
        <pre className="creditos-ascii" style={{ animationDelay: `${RETRASO_ASCII_S}s` }}>
          {CUADROS_ASCII[cuadro]}
        </pre>
      </div>
    </VentanaRetro>
  )
}
