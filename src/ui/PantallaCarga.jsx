import { useEffect, useState } from 'react'
import { TEXTOS } from '../lib/idioma.js'

// ---------------------------------------------------------------------------
// PantallaCarga (pantalla 1): barra de progreso pixelada + selección de
// idioma. Cubre todo (tapa el 3D mientras carga). Cuando la barra llega
// al 100%, aparecen las banderitas; elegir una arranca el altar.
// ---------------------------------------------------------------------------

const CELDAS = 18 // cuántos bloques tiene la barra

const IDIOMAS = [
  { codigo: 'en', etiqueta: 'ENG', bandera: '🇬🇧' },
  { codigo: 'es', etiqueta: 'SPA', bandera: '🇵🇪' },
  { codigo: 'de', etiqueta: 'DEU', bandera: '🇩🇪' },
]

export default function PantallaCarga({ onElegirIdioma }) {
  const [progreso, setProgreso] = useState(0)

  // la barra avanza a saltitos irregulares, como en 1984
  useEffect(() => {
    const intervalo = setInterval(() => {
      setProgreso((p) => {
        if (p >= 100) return 100
        return Math.min(100, p + 4 + Math.floor(Math.random() * 9))
      })
    }, 130)
    return () => clearInterval(intervalo)
  }, [])

  const llenas = Math.round((progreso / 100) * CELDAS)
  const lista = progreso >= 100

  return (
    <div className="pantalla-carga">
      <div className="ventana-retro ventana-carga">
        <div className="ventana-titulo">
          <span>✦ buenas mierdas ✦</span>
        </div>
        <div className="ventana-cuerpo centrado">
          <p className="carga-texto">
            {lista
              ? IDIOMAS.map((i) => TEXTOS[i.codigo].eligeIdioma).join(' · ')
              : TEXTOS.es.cargando}
          </p>

          <div className="barra-carga" role="progressbar" aria-valuenow={progreso}>
            {Array.from({ length: CELDAS }, (_, i) => (
              <span key={i} className={'barra-celda' + (i < llenas ? ' llena' : '')} />
            ))}
          </div>

          {lista && (
            <div className="banderitas">
              {IDIOMAS.map((i) => (
                <button
                  key={i.codigo}
                  className="boton-retro boton-idioma"
                  onClick={() => onElegirIdioma(i.codigo)}
                >
                  <span className="bandera">{i.bandera}</span> {i.etiqueta}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
