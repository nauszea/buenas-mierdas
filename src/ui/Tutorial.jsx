import VentanaRetro from './VentanaRetro.jsx'
import { useTexto } from '../lib/idioma.js'

// Pantalla 3 del flujo: guía rápida de controles + botón Start.
export default function Tutorial({ onEmpezar }) {
  const { t } = useTexto()
  return (
    <VentanaRetro titulo={t.tutorialTitulo} onCerrar={onEmpezar}>
      <table className="tabla-controles">
        <tbody>
          {t.tutorialFilas.map(([accion, efecto]) => (
            <tr key={accion}>
              <td>{accion}</td>
              <td>{efecto}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="centrado">
        <button className="boton-retro boton-start boton-primario" onClick={onEmpezar}>
          {t.tutorialStart}
        </button>
      </div>
    </VentanaRetro>
  )
}
