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
// 6. Vistazo corto: al hacer clic directo en un afecto (`mirarHacia`), el
//    punto de mira se reacomoda suave hacia él SIN mover la cámara de
//    sitio — el "empujón" de encuadre estilo N64 al abrir su ficha, más
//    discreto que el vuelo completo (que si moviera toda la cámara cada
//    vez que tocas un objeto cercano se sentiría mareador).
// 7. Ancla de seguimiento: mientras la ficha de un afecto está abierta
//    (cerca), este orbita/flota (deriva) y se saldría del cuadro solo. En
//    vez de trabarlo, el PUNTO DE MIRA lo sigue solo, cuadro a cuadro —
//    hasta que el usuario toca cualquier control (arrastrar, zoom, WASD),
//    momento en el que el ancla se suelta y no vuelve a agarrar sola
//    hasta que se abra la ficha de otro afecto distinto.
// ---------------------------------------------------------------------------

const VELOCIDAD = 14 // unidades por segundo al volar con teclado

export default function ControlesCamara({ destino, onFinDeVuelo, mirarHacia, posSeguirRef, posicionesRef }) {
  const controles = useRef()
  const teclas = useRef({})
  const mirando = useRef(null)
  const anclaSuelta = useRef(false) // true = el usuario ya movió algo, no seguir más
  const dueñoAncla = useRef(null) // id del afecto anclado actualmente (para saber cuándo cambia)

  useEffect(() => {
    if (mirarHacia) mirando.current = new THREE.Vector3(...mirarHacia)
  }, [mirarHacia])

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

  // soltar el ancla de seguimiento apenas el usuario toca CUALQUIER
  // control — arrastrar/pan ('start' de OrbitControls) o la rueda del
  // mouse (el zoom no dispara 'start' en three.js, así que se escucha
  // aparte). El WASD se maneja abajo, en el mismo lugar donde ya mueve la cámara.
  useEffect(() => {
    const c = controles.current
    if (!c) return
    const soltar = () => { anclaSuelta.current = true }
    c.addEventListener('start', soltar)
    c.domElement?.addEventListener('wheel', soltar)
    return () => {
      c.removeEventListener('start', soltar)
      c.domElement?.removeEventListener('wheel', soltar)
    }
  }, [])

  useFrame(({ camera }, delta) => {
    const c = controles.current
    if (!c) return

    if (destino) {
      // ---- vuelo automático hacia un afecto ----
      // adonde el afecto ESTÁ ahora (flota a la deriva, hasta 3 unidades de
      // su coordenada base) — apuntar a la base lo dejaba fuera de cuadro
      // al llegar, porque a 6 unidades de distancia 3 de desvío es medio
      // encuadre. Si todavía no publicó su posición, la base sirve igual.
      const objetivo = new THREE.Vector3(
        ...(posicionesRef?.current?.[destino.id] ?? destino.posicion),
      )
      // posición deseada: un poco arriba y atrás del objeto, del lado actual de la cámara
      const direccion = camera.position.clone().sub(objetivo)
      direccion.y = 0
      if (direccion.lengthSq() < 0.001) direccion.set(0, 0, 1)
      direccion.normalize().multiplyScalar(6)
      const posDeseada = objetivo.clone().add(direccion).add(new THREE.Vector3(0, 2, 0))

      c.target.lerp(objetivo, 0.07)
      camera.position.lerp(posDeseada, 0.07)

      // margen holgado (antes 0.2): el objetivo ya no está quieto, se mueve
      // con la deriva del afecto, así que exigir una precisión mínima podía
      // dejar el vuelo persiguiéndolo para siempre sin darse por terminado.
      if (camera.position.distanceTo(posDeseada) < 0.6) onFinDeVuelo?.()
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
        anclaSuelta.current = true // volar manualmente también suelta el ancla
      }

      if (mirando.current) {
        c.target.lerp(mirando.current, 0.12)
        if (c.target.distanceTo(mirando.current) < 0.05) mirando.current = null
      }

      // ancla de seguimiento: mientras haya un afecto con su ficha abierta
      // (posSeguirRef.current no es null), el punto de mira lo persigue
      // solo cuadro a cuadro. Si cambia A CUÁL afecto se sigue (se abrió
      // la ficha de otro), el ancla se re-arma sola; si el usuario ya
      // tocó algo (anclaSuelta), no vuelve a agarrar hasta ese cambio.
      const seguido = posSeguirRef?.current
      if (seguido?.id !== dueñoAncla.current) {
        dueñoAncla.current = seguido?.id ?? null
        anclaSuelta.current = false
      }
      if (seguido && !anclaSuelta.current) {
        c.target.x += (seguido.pos[0] - c.target.x) * 0.1
        c.target.y += (seguido.pos[1] - c.target.y) * 0.1
        c.target.z += (seguido.pos[2] - c.target.z) * 0.1
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
