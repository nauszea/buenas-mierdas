import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// ---------------------------------------------------------------------------
// ControlesCamara: navegación 3D completa.
//
// 1. Orbitar  → clic izquierdo + arrastrar
// 2. Desplazarse (pan) → clic derecho + arrastrar (o dos dedos en trackpad)
// 3. Zoom → rueda del mouse
// 4. VOLAR con el teclado → W A S D (o flechas) avanza/retrocede/lados,
//    Q sube, E baja. Mueve la cámara Y su punto de mira juntos, como
//    caminar por el cielo.
// 5. Vuelo automático: si `destino` tiene un afecto, la cámara viaja sola
//    hacia él con suavizado; al llegar (o si el usuario toca los controles)
//    avisa con `onFinDeVuelo`.
// ---------------------------------------------------------------------------

const VELOCIDAD = 14 // unidades por segundo al volar con teclado

export default function ControlesCamara({ destino, onFinDeVuelo }) {
  const controles = useRef()
  const teclas = useRef({})

  // escuchar teclado (ignorando cuando escribes en un input del buscador/formularios)
  useEffect(() => {
    const abajo = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      teclas.current[e.code] = true
    }
    const arriba = (e) => { teclas.current[e.code] = false }
    window.addEventListener('keydown', abajo)
    window.addEventListener('keyup', arriba)
    return () => {
      window.removeEventListener('keydown', abajo)
      window.removeEventListener('keyup', arriba)
    }
  }, [])

  // si el usuario agarra los controles a mitad de un vuelo, el vuelo se cancela
  useEffect(() => {
    const c = controles.current
    if (!c || !destino) return
    const cancelar = () => onFinDeVuelo?.()
    c.addEventListener('start', cancelar)
    return () => c.removeEventListener('start', cancelar)
  }, [destino, onFinDeVuelo])

  useFrame(({ camera }, delta) => {
    const c = controles.current
    if (!c) return

    if (destino) {
      // ---- vuelo automático hacia un afecto ----
      const objetivo = new THREE.Vector3(...destino.posicion)
      // posición deseada: un poco arriba y atrás del objeto, del lado actual de la cámara
      const direccion = camera.position.clone().sub(objetivo)
      direccion.y = 0
      if (direccion.lengthSq() < 0.001) direccion.set(0, 0, 1)
      direccion.normalize().multiplyScalar(6)
      const posDeseada = objetivo.clone().add(direccion).add(new THREE.Vector3(0, 2, 0))

      c.target.lerp(objetivo, 0.07)
      camera.position.lerp(posDeseada, 0.07)

      if (camera.position.distanceTo(posDeseada) < 0.2) onFinDeVuelo?.()
    } else {
      // ---- vuelo manual con teclado ----
      const t = teclas.current
      const paso = new THREE.Vector3()
      const frente = new THREE.Vector3()
      camera.getWorldDirection(frente)
      frente.y = 0 // avanzar no te hunde ni te eleva
      frente.normalize()
      const lado = new THREE.Vector3().crossVectors(frente, camera.up).normalize()

      if (t.KeyW || t.ArrowUp) paso.add(frente)
      if (t.KeyS || t.ArrowDown) paso.sub(frente)
      if (t.KeyD || t.ArrowRight) paso.add(lado)
      if (t.KeyA || t.ArrowLeft) paso.sub(lado)
      if (t.KeyQ) paso.y += 1
      if (t.KeyE) paso.y -= 1

      if (paso.lengthSq() > 0) {
        paso.normalize().multiplyScalar(VELOCIDAD * delta)
        camera.position.add(paso)
        c.target.add(paso) // el punto de mira viaja contigo
      }
    }

    c.update()
  })

  return (
    <OrbitControls
      ref={controles}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      enablePan
      screenSpacePanning
      minDistance={2}
      maxDistance={90}
    />
  )
}
