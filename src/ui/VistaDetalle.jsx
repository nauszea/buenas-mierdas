import VentanaRetro from './VentanaRetro.jsx'
import { useTexto, f } from '../lib/idioma.js'

// ---------------------------------------------------------------------------
// VistaDetalle (pantalla 6): la ficha de un afecto.
// Sin likes: solo "reapropiar". Cada reapropiación agrieta un poco más el
// objeto (Fase 4). A las 100, se consagra y ya no puede ser dañado.
// ---------------------------------------------------------------------------

export default function VistaDetalle({ afecto, reapropiaciones, onReapropiar, onVolar, onCerrar }) {
  const { t } = useTexto()
  const consagrado = reapropiaciones >= 100

  return (
    <VentanaRetro titulo={afecto.nombre} onCerrar={onCerrar}>
      <p className="detalle-campo"><b>{t.detalleUbicacion}:</b> {afecto.ubicacion}</p>
      <p className="detalle-campo"><b>{t.detalleHistoria}:</b> {afecto.historia}</p>
      <p className="detalle-campo">
        {afecto.tags.map((tag) => (
          <span key={tag} className="chip-tag">#{tag}</span>
        ))}
      </p>

      <p className="detalle-campo contador-reapropiaciones">
        {consagrado ? (
          <span className="consagrado">{t.detalleConsagrado}</span>
        ) : (
          f(t.detalleReapropiado, { n: reapropiaciones })
        )}
      </p>

      <div className="centrado botones-detalle">
        {!consagrado && (
          <button className="boton-retro" onClick={onReapropiar}>
            {t.detalleReapropiar}
          </button>
        )}
        <button className="boton-retro" onClick={onVolar}>
          {t.detalleVolar}
        </button>
      </div>
    </VentanaRetro>
  )
}
