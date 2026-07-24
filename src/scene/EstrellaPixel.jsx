import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// ---------------------------------------------------------------------------
// EstrellaPixel: estrellita pixelada procedural (relleno mientras no haya
// GIFs en public/gifs/). Se dibuja UNA vez en un canvas de 16x16 y todas
// las estrellas comparten esa misma textura.
// ---------------------------------------------------------------------------

let texturaCompartida = null

function obtenerTextura() {
  if (texturaCompartida) return texturaCompartida
  const c = document.createElement('canvas')
  c.width = c.height = 16
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff6fb'
  // cruz pixelada estilo sprite de 8 bits
  ctx.fillRect(7, 1, 2, 14)
  ctx.fillRect(1, 7, 14, 2)
  ctx.fillStyle = '#ffc7e6'
  ctx.fillRect(5, 5, 6, 6)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(7, 7, 2, 2)
  texturaCompartida = new THREE.CanvasTexture(c)
  texturaCompartida.magFilter = THREE.NearestFilter
  texturaCompartida.minFilter = THREE.NearestFilter
  return texturaCompartida
}

export default function EstrellaPixel({ position, scale = 1 }) {
  const ref = useRef()
  const textura = useMemo(obtenerTextura, [])
  const desfase = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(() => {
    // titilar: opacidad oscilando, cada estrella con su propio ritmo
    if (ref.current) {
      const t = performance.now() / 1000
      ref.current.material.opacity = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + desfase))
    }
  })

  return (
    <sprite ref={ref} position={position} scale={[scale, scale, 1]}>
      <spriteMaterial map={textura} transparent depthWrite={false} fog={false} />
    </sprite>
  )
}
