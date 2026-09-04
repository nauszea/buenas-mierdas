import { useState } from 'react'
import VentanaRetro from './VentanaRetro.jsx'
import { useTexto, f } from '../lib/idioma.js'
import { UMBRAL_CONSAGRACION } from '../lib/consagracion.js'

// el "tragamonedas": el número viejo sale hacia arriba, el nuevo entra
// desde abajo — nunca se re-renderiza en el mismo lugar de golpe. Recibe
// `de`/`a` ya fijos: si cambiaran solos en cada render (por venir de un
// prop reactivo) la animación se repetiría o se pisaría con cada
// actualización del contador general, así que VentanaReapropiacion los
// congela en el momento exacto en que se acepta, antes de avisarle a
// App.jsx que sume el nuevo conteo real.
function ContadorTragamonedas({ de, a }) {
  return (
    <div className="contador-tragamonedas">
      <span className="num-vieja">{de}</span>
      <span className="num-nueva">{a}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// VentanaReapropiacion: el ritual completo de reapropiar, no solo un botón.
// Se abre desde VistaDetalle en vez de reapropiar directo — primero el
// texto de gratitud/responsabilidad, recién al aceptar se dispara la
// reapropiación real (afuera, en App.jsx) y se revela el contador +
// la descarga de la "copia de artista".
// ---------------------------------------------------------------------------
export default function VentanaReapropiacion({ afecto, reapropiaciones, onAceptar, onCerrar, zIndex, canvasRef }) {
  const { t } = useTexto()
  const [aceptado, setAceptado] = useState(false)
  const [cuentaVieja, setCuentaVieja] = useState(null)

  const aceptar = () => {
    setCuentaVieja(reapropiaciones) // se congela ANTES de que App.jsx actualice el conteo real
    setAceptado(true)
    onAceptar()
  }

  const descargar = () => {
    const canvas = canvasRef?.current
    if (!canvas) return
    // versión simple por ahora: la captura tal cual del altar, sin marco
    // ni sello ni número grabado — eso llega cuando exista el diseño del
    // sello (ver pendientes.md). Igual es YA una copia única de este
    // momento exacto del afecto.
    const enlace = document.createElement('a')
    enlace.href = canvas.toDataURL('image/png')
    enlace.download = `${afecto.nombre.replace(/\s+/g, '-')}-copia-${cuentaVieja + 1}.png`
    enlace.click()
  }

  const cuentaNueva = (cuentaVieja ?? reapropiaciones) + 1
  const consagradaAhora =
    cuentaVieja !== null && cuentaVieja < UMBRAL_CONSAGRACION && cuentaNueva >= UMBRAL_CONSAGRACION

  return (
    <VentanaRetro titulo={t.reapropiarTitulo} onCerrar={onCerrar} zIndex={zIndex}>
      {!aceptado ? (
        <>
          <p className="reapropiar-gratitud">{t.reapropiarGratitud}</p>
          <p className="reapropiar-edicion">
            {f(t.reapropiarEdicionUnica, { n: reapropiaciones + 1, nombre: afecto.nombre })}
          </p>
          <div className="centrado">
            <button className="boton-retro boton-primario" onClick={aceptar}>
              {t.reapropiarAceptar}
            </button>
          </div>
        </>
      ) : (
        <>
          <ContadorTragamonedas de={cuentaVieja} a={cuentaNueva} />
          {consagradaAhora && <p className="consagrado centrado">{t.reapropiarNuevaConsagracion}</p>}
          <div className="centrado">
            <button className="boton-retro" onClick={descargar}>
              {t.reapropiarDescargar}
            </button>
          </div>
        </>
      )}
    </VentanaRetro>
  )
}
