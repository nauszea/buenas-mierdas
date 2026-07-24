import VentanaRetro from './VentanaRetro.jsx'
import { useTexto } from '../lib/idioma.js'

// Pantalla 7: cómo escanear tu objeto con el celular (DIY, gratis).
export default function InstruccionesEscaneo({ onVolver }) {
  const { t } = useTexto()
  return (
    <VentanaRetro titulo={t.escaneoTitulo} onCerrar={onVolver}>
      {t.escaneoPasos.map((paso, i) => (
        <p key={i}>
          <b>{i + 1}.</b> {paso}
        </p>
      ))}
      <p className="parpadeo">{t.escaneoLema}</p>
      <div className="centrado">
        <button className="boton-retro" onClick={onVolver}>
          {t.escaneoVolver}
        </button>
      </div>
    </VentanaRetro>
  )
}
