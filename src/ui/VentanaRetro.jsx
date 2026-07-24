// VentanaRetro: ventana estilo Mac OS clásico (System 7) en pasteles.
// Barra de título con rayitas, título centrado que las interrumpe,
// y botón de cerrar como cuadradito a la IZQUIERDA (como en los Mac viejos).
// Flota SOBRE el canvas 3D (no vive dentro de él).
export default function VentanaRetro({ titulo, onCerrar, children }) {
  return (
    <div className="ventana-fondo">
      <div className="ventana-retro" role="dialog" aria-label={titulo}>
        <div className="ventana-titulo">
          <button className="ventana-cerrar" onClick={onCerrar} aria-label="cerrar">
            ▪
          </button>
          <span>{titulo}</span>
        </div>
        <div className="ventana-cuerpo">{children}</div>
      </div>
    </div>
  )
}
