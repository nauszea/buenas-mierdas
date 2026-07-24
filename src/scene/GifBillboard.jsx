import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { parseGIF, decompressFrames } from 'gifuct-js'

// ---------------------------------------------------------------------------
// GifBillboard: toma un .gif real (de GifCities, por ejemplo) y lo pone a
// flotar en el espacio 3D como un Sprite (billboard: siempre mira a la cámara).
//
// Cómo funciona:
//  1. gifuct-js descarga y descomprime los cuadros (frames) del GIF.
//  2. Dibujamos cada frame en un <canvas> invisible.
//  3. Ese canvas es la textura de un Sprite de three.js (CanvasTexture).
//  4. En cada render, si ya pasó el "delay" del frame actual, dibujamos el
//     siguiente. Solo se re-sube la textura a la GPU cuando cambia el frame.
//
// Optimización clave: los GIFs se cachean por URL. Veinte estrellas que usan
// el mismo GIF comparten UNA sola textura animada.
// ---------------------------------------------------------------------------

const cacheDeGifs = new Map()

function cargarGif(url) {
  if (cacheDeGifs.has(url)) return cacheDeGifs.get(url)
  const promesa = fetch(url)
    .then((res) => res.arrayBuffer())
    .then((buffer) => {
      const gif = parseGIF(buffer)
      const frames = decompressFrames(gif, true) // true = píxeles RGBA listos
      const canvas = document.createElement('canvas')
      canvas.width = gif.lsd.width
      canvas.height = gif.lsd.height
      const ctx = canvas.getContext('2d')

      const textura = new THREE.CanvasTexture(canvas)
      // NearestFilter = sin suavizado = píxel crujiente, como debe ser
      textura.magFilter = THREE.NearestFilter
      textura.minFilter = THREE.NearestFilter
      textura.colorSpace = THREE.SRGBColorSpace

      // canvas auxiliar para componer frames parciales (los GIF optimizados
      // solo guardan "parches" que cambian entre frame y frame)
      const parche = document.createElement('canvas')
      const ctxParche = parche.getContext('2d')

      const estado = { frames, ctx, ctxParche, parche, textura, indice: 0, reloj: 0 }
      pintarFrame(estado, 0)
      return estado
    })
  cacheDeGifs.set(url, promesa)
  return promesa
}

function pintarFrame(estado, i) {
  const frame = estado.frames[i]
  const { dims } = frame
  if (estado.parche.width !== dims.width || estado.parche.height !== dims.height) {
    estado.parche.width = dims.width
    estado.parche.height = dims.height
  }
  const imageData = estado.ctxParche.createImageData(dims.width, dims.height)
  imageData.data.set(frame.patch)
  estado.ctxParche.putImageData(imageData, 0, 0)
  if (frame.disposalType === 2) {
    estado.ctx.clearRect(0, 0, estado.ctx.canvas.width, estado.ctx.canvas.height)
  }
  estado.ctx.drawImage(estado.parche, dims.left, dims.top)
  estado.textura.needsUpdate = true
}

export default function GifBillboard({ url, position = [0, 0, 0], scale = 2, flotar = true }) {
  const spriteRef = useRef()
  const [gif, setGif] = useState(null)
  const desfase = useMemo(() => Math.random() * Math.PI * 2, [])

  useEffect(() => {
    let vivo = true
    cargarGif(url).then((estado) => vivo && setGif(estado))
    return () => { vivo = false }
  }, [url])

  useFrame((_, delta) => {
    if (gif) {
      // avanzar la animación del GIF según su propio timing
      gif.reloj += delta * 1000
      const frameActual = gif.frames[gif.indice]
      const delay = frameActual.delay || 100
      if (gif.reloj >= delay) {
        gif.reloj = 0
        gif.indice = (gif.indice + 1) % gif.frames.length
        pintarFrame(gif, gif.indice)
      }
    }
    // vaivén suave, como respirar
    if (flotar && spriteRef.current) {
      const t = performance.now() / 1000
      spriteRef.current.position.y = position[1] + Math.sin(t * 0.6 + desfase) * 0.4
    }
  })

  if (!gif) return null

  const aspecto = gif.ctx.canvas.width / gif.ctx.canvas.height

  return (
    <sprite ref={spriteRef} position={position} scale={[scale * aspecto, scale, 1]}>
      <spriteMaterial map={gif.textura} transparent depthWrite={false} fog={false} />
    </sprite>
  )
}
