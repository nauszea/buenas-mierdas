import { useMemo } from 'react'
import GifBillboard from './GifBillboard.jsx'
import EstrellaPixel from './EstrellaPixel.jsx'

// ---------------------------------------------------------------------------
// ConstelacionGifs: reparte billboards por el cielo.
//
// Pon tus GIFs de GifCities en la carpeta  public/gifs/  y agrégalos a la
// lista GIFS de abajo. Mientras la lista esté vacía, se usan estrellitas
// pixeladas procedurales (EstrellaPixel) para que la escena nunca esté vacía.
// ---------------------------------------------------------------------------

const GIFS = [
  // '/gifs/estrella1.gif',
  // '/gifs/luna.gif',
  // '/gifs/angelito.gif',
]

// generador determinista de posiciones (mismo cielo en cada visita)
function posicionesEnDomo(cantidad, semilla = 7) {
  let s = semilla
  const azar = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return Array.from({ length: cantidad }, () => {
    const angulo = azar() * Math.PI * 2
    const radio = 18 + azar() * 45
    const altura = 2 + azar() * 22
    return [Math.cos(angulo) * radio, altura, Math.sin(angulo) * radio]
  })
}

export default function ConstelacionGifs({ cantidad = 24 }) {
  const posiciones = useMemo(() => posicionesEnDomo(cantidad), [cantidad])

  return (
    <group>
      {posiciones.map((pos, i) =>
        GIFS.length > 0 ? (
          <GifBillboard
            key={i}
            url={GIFS[i % GIFS.length]}
            position={pos}
            scale={1.5 + (i % 3) * 0.7}
          />
        ) : (
          <EstrellaPixel key={i} position={pos} scale={0.9 + (i % 4) * 0.4} />
        ),
      )}
    </group>
  )
}
