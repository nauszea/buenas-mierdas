import { useEffect } from 'react'
import { useTexto, f } from '../lib/idioma.js'
import { sonidoAparecer } from '../lib/efectos.js'

// ---------------------------------------------------------------------------
// VistaDetalle: la ficha de un afecto — YA NO es una ventana centrada.
// Vive anclada al lado del objeto en el mundo 3D (ver <Html> en Afecto.jsx),
// así que no lleva VentanaRetro (ese es el que centra + dispara el
// desenfoque de fondo). Reusa las mismas clases .ventana-retro/.ventana-titulo
// para mantener el look, solo que posicionada por su padre en vez de por
// .ventana-fondo.
//
// Sin likes: solo "reapropiar". Cada reapropiación agrieta un poco más el
// objeto (Fase 4). A las 100, se consagra y ya no puede ser dañado.
// ---------------------------------------------------------------------------

export default function VistaDetalle({ afecto, reapropiaciones, onReapropiar, onCerrar }) {
  const { t } = useTexto()
  const consagrado = reapropiaciones >= 100

  useEffect(() => { sonidoAparecer() }, [])

  return (
    <div className="ventana-retro ventana-anclada" role="dialog" aria-label={afecto.nombre}>
      <div className="ventana-titulo">
        <button className="ventana-cerrar" onClick={onCerrar} aria-label="cerrar">
          ▪
        </button>
        <span>{afecto.nombre}</span>
      </div>
      <div className="ventana-cuerpo">
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
        </div>
      </div>
    </div>
  )
}
