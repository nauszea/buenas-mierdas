// ---------------------------------------------------------------------------
// EtiquetaAfecto: la vista previa liviana de un afecto LEJANO — solo su
// nombre, anclado a su posición en el mundo 3D. El botón para volar hacia
// él YA NO vive acá: es un prompt aparte, fijo en la pantalla (estilo
// "press start"), ver .prompt-volar en App.jsx.
// ---------------------------------------------------------------------------

export default function EtiquetaAfecto({ afecto }) {
  return (
    <div className="etiqueta-lejos">
      <p className="etiqueta-nombre">{afecto.nombre}</p>
    </div>
  )
}
