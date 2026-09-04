import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ANCHO_FICHA_PX, GAP_FICHA_PX } from '../lib/disposicionFicha.js'

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

// cuánto se corre el punto de mira hacia la DERECHA del objeto (no el
// objeto en sí — es el punto que la cámara centra) para que la ficha, que
// vive a su lado, no empuje toda la composición hacia la derecha.
//
// Así lo resuelven los videojuegos: no existe un número fijo de unidades
// 3D que "sea" un ancho en píxeles — esa conversión depende del FOV, del
// ancho de la ventana y de qué tan lejos está la cámara, y cambia cada vez
// que cualquiera de esos tres cambia. Por eso esto se recalcula CADA
// CUADRO en vez de usar una constante: se mide cuántas unidades 3D ocupa
// un píxel a la distancia actual (con el FOV horizontal real, derivado del
// FOV vertical de la cámara y el aspecto ancho/alto de la ventana), y se
// usa eso para convertir el hueco de la ficha (ver disposicionFicha.js,
// la MISMA fuente que usa VistaDetalle.jsx para su ancho real) a unidades
// 3D. Así queda "responsivo" de verdad: sirve igual en una ventana angosta,
// una pantalla ancha, o si el usuario hace zoom con la rueda.
function conEspacioParaFicha(camera, size, base) {
  const frente = new THREE.Vector3()
  camera.getWorldDirection(frente)
  frente.y = 0
  if (frente.lengthSq() < 0.0001) frente.set(0, 0, 1)
  frente.normalize()
  const derecha = new THREE.Vector3().crossVectors(frente, camera.up).normalize()

  const distancia = camera.position.distanceTo(base) || 1
  const fovVerticalRad = THREE.MathUtils.degToRad(camera.fov)
  const fovHorizontalRad = 2 * Math.atan(Math.tan(fovVerticalRad / 2) * (size.width / size.height))
  const anchoMundoVisible = 2 * distancia * Math.tan(fovHorizontalRad / 2)
  const unidadesPorPixel = anchoMundoVisible / size.width
  const pixelesAOcupar = (GAP_FICHA_PX + ANCHO_FICHA_PX) / 2
  const desplazamiento = pixelesAOcupar * unidadesPorPixel

  return base.clone().add(derecha.multiplyScalar(desplazamiento))
}

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

  useFrame(({ camera, size }, delta) => {
    const c = controles.current
    if (!c) return

    if (destino) {
      // ---- vuelo automático hacia un afecto ----
      // adonde el afecto ESTÁ ahora (flota a la deriva, hasta 3 unidades de
      // su coordenada base) — apuntar a la base lo dejaba fuera de cuadro
      // al llegar, porque a 6 unidades de distancia 3 de desvío es medio
      // encuadre. Si todavía no publicó su posición, la base sirve igual.
      const objetivoReal = new THREE.Vector3(
        ...(posicionesRef?.current?.[destino.id] ?? destino.posicion),
      )
      // el punto de mira se corre a la derecha del objeto real, así este
      // aparece a la izquierda en pantalla y le deja sitio a su ficha
      const objetivo = conEspacioParaFicha(camera, size, objetivoReal)
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
        // mirando.current guarda la posición REAL del objeto; el punto de
        // mira apunta un poco a la derecha de eso, dejándole sitio a la
        // ficha — por eso el "ya llegamos" se mide contra ESE punto corrido,
        // no contra el objeto real (si no, nunca se da por terminado: se
        // queda 1.3 unidades corto para siempre).
        const objetivoConEspacio = conEspacioParaFicha(camera, size, mirando.current)
        c.target.lerp(objetivoConEspacio, 0.12)
        if (c.target.distanceTo(objetivoConEspacio) < 0.05) mirando.current = null
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
        const conEspacio = conEspacioParaFicha(camera, size, new THREE.Vector3(...seguido.pos))
        c.target.x += (conEspacio.x - c.target.x) * 0.1
        c.target.y += (conEspacio.y - c.target.y) * 0.1
        c.target.z += (conEspacio.z - c.target.z) * 0.1
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
