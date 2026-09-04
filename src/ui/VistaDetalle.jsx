import { useEffect } from 'react'
import { useTexto, f } from '../lib/idioma.js'
import { sonidoAparecer } from '../lib/efectos.js'
import { ANCHO_FICHA_PX, GAP_FICHA_PX } from '../lib/disposicionFicha.js'
import { yaReapropiado } from '../lib/reapropiacionLocal.js'

// ---------------------------------------------------------------------------
// VistaDetalle: la ficha de un afecto — YA NO es una ventana centrada.
// Vive anclada al lado del objeto en el mundo 3D (ver <Html> en Afecto.jsx),
// así que no lleva VentanaRetro (ese es el que centra + dispara el
// desenfoque de fondo). Reusa las mismas clases .ventana-retro/.ventana-titulo
// para mantener el look, solo que posicionada por su padre en vez de por
// .ventana-fondo.
//
// Dos elementos anidados, A PROPÓSITO, y no uno solo: .ventana-anclada
// (el de afuera) pone la POSICIÓN — translate(Npx, -50%), calculado desde
// disposicionFicha.js — y .ventana-retro (el de adentro) trae su propia
// animación de aparición (scale, ver global.css). Si ambos transforms
// vivieran en el MISMO elemento, la animación de scale pisa por completo
// al translate mientras dura (los navegadores no las combinan solas), así
// que la ficha aparecía en el lugar por defecto y RECIÉN al terminar la
// animación saltaba de golpe a su posición real. Separados en dos
// elementos, cada transform vive en lo suyo y no compiten.
//
// Sin likes: solo "reapropiar". Cada reapropiación agrieta un poco más el
// objeto (Fase 4). A las 100, se consagra y ya no puede ser dañado.
// ---------------------------------------------------------------------------

export default function VistaDetalle({ afecto, reapropiaciones, onReapropiar, onCerrar, zIndex }) {
  const { t } = useTexto()
  const consagrado = reapropiaciones >= 100
  // freno suave por navegador (ver reapropiacionLocal.js): si esta persona
  // ya reapropió este mismo afecto antes, el botón se apaga y se explica.
  const yaHecho = !consagrado && yaReapropiado(afecto.id)

  useEffect(() => { sonidoAparecer() }, [])

  return (
    <div
      className="ventana-anclada"
      style={{ width: ANCHO_FICHA_PX, transform: `translate(${GAP_FICHA_PX}px, -50%)`, zIndex }}
    >
      <div className="ventana-retro" role="dialog" aria-label={afecto.nombre}>
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
              <button
                className={'boton-retro' + (yaHecho ? ' boton-gris' : '')}
                onClick={onReapropiar}
                disabled={yaHecho}
              >
                {t.detalleReapropiar}
              </button>
            )}
          </div>

          {yaHecho && <p className="vineta-reapropiado">{t.detalleYaReapropiado}</p>}
        </div>
      </div>
    </div>
  )
}
