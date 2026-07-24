import VentanaRetro from './VentanaRetro.jsx'
import { useTexto } from '../lib/idioma.js'

// Pantalla 9: el afecto ya existe. La cámara volará hacia él.
export default function Confirmacion({ afecto, onIr }) {
  const { t } = useTexto()
  return (
    <VentanaRetro titulo="✧" onCerrar={onIr}>
      <p className="mensaje-confirmacion">
        {t.confirmacionTexto}
        <br />
        <b>{afecto.nombre}</b>
        <br />
        {t.confirmacionFlota} [{afecto.posicion.map((n) => Math.round(n)).join(', ')}]
      </p>
      <div className="centrado">
        <button className="boton-retro boton-start boton-primario" onClick={onIr}>
          {t.confirmacionIr}
        </button>
      </div>
    </VentanaRetro>
  )
}
