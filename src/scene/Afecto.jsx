import * as THREE from 'three'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Sparkles, Html } from '@react-three/drei'
import { texturaDesgaste } from './desgaste.js'
import { texturaAura } from './aura.js'
import VistaDetalle from '../ui/VistaDetalle.jsx'
import EtiquetaAfecto from '../ui/EtiquetaAfecto.jsx'

const COLOR_CONSAGRADO = new THREE.Color('#fff6b8')

// ---------------------------------------------------------------------------
// Afecto: un objeto del altar.
//
// - Si tiene `glb`, carga el modelo escaneado… pero SOLO cuando la cámara
//   está cerca (carga perezosa por distancia). Así el altar aguanta decenas.
// - Si no tiene `glb`, muestra una forma geométrica pastel.
// - Al pasar el mouse brilla suavecito; `pulso` hace destellar (glitch).
// - FASE 4 — reapropiación visual: una "malla fantasma" con la textura de
//   grietas/mugre envuelve al objeto; su opacidad crece con cada
//   reapropiación (n/100). Nunca se toca la geometría: solo capas.
// - A las 100: CONSAGRADO — brilla permanente, con su constelación
//   orbitando, y las grietas se congelan (brilla a través de ellas).
// ---------------------------------------------------------------------------

const DISTANCIA_DE_CARGA = 60 // a menos de esto (en unidades 3D) se carga el .glb — holgada, solo por performance
// "de verdad cerca": a menos de esto se abre la ficha completa y empuja la
// cámara. Tiene que ser chica — la de carga (60) solo evita cargar el
// modelo de más lejos, pero a 60 unidades el objeto se ve chiquito en
// pantalla; usarla también para esto hacía que la ficha se abriera con el
// objeto todavía lejos y diminuto, a mitad del vuelo hacia él.
// (10 quedó DEMASIADO chica: la cámara arranca a 14.3 unidades del primer
// afecto, así que ni el objeto que tenés justo en frente al abrir el
// altar pasaba este umbral — el clic directo no hacía nada ahí, y solo
// funcionaba después de volar con el buscador. 20 deja ese primer objeto
// adentro sin volver a dejar pasar los que de verdad se ven como un punto
// lejano en el cielo.)
const DISTANCIA_INTERACCION = 20

function Forma({ forma }) {
  switch (forma) {
    case 'caja': return <boxGeometry args={[1.4, 1.4, 1.4]} />
    case 'esfera': return <sphereGeometry args={[1, 12, 10]} />
    case 'toro': return <torusGeometry args={[0.9, 0.35, 10, 24]} />
    case 'nudo': return <torusKnotGeometry args={[0.7, 0.26, 48, 8]} />
    case 'dodecaedro': return <dodecahedronGeometry args={[1.1, 0]} />
    default: return <icosahedronGeometry args={[1.2, 0]} />
  }
}

// Cada .glb que sube la gente puede venir centrado en cualquier lado y a
// cualquier escala (según cómo lo haya exportado quien lo escaneó) — sin
// esto, cada objeto nuevo aparece descentrado o gigante/diminuto al azar.
// Se recentra en su propio origen y se normaliza a un tamaño de referencia
// (2.2 unidades en su lado más largo, parecido a las formas geométricas).
//
// El orden de las operaciones importa: hay que ESCALAR primero y recién
// después medir el centro (con la escala ya aplicada). Si se centra con
// las coordenadas originales y se escala después, el desplazamiento queda
// sin achicar (la posición se suma DESPUÉS de escalar la geometría) — el
// modelo termina lejos de donde debería, diminuto, y al orbitar el grupo
// padre describe un arco ancho alrededor de un eje que ya no pasa por su
// centro visual (el "rebote" exagerado al flotar).
//
// Además: acá también viven la malla fantasma del desgaste y el pulso de
// brillo, que antes solo existían para las formas geométricas — por eso
// reapropiar un .glb no hacía nada visible.
function ModeloGLB({ url, escala = 1, desgaste = 0, consagrado = false, hover = false, pulso = 0 }) {
  const { scene } = useGLTF(url)

  const { objeto, capaDesgaste, materiales, desgasteMats } = useMemo(() => {
    const clon = scene.clone()

    const cajaOriginal = new THREE.Box3().setFromObject(clon)
    const tamano = cajaOriginal.getSize(new THREE.Vector3())
    const dimensionMayor = Math.max(tamano.x, tamano.y, tamano.z) || 1
    // `escala` (el ajuste fino por afecto de afectos.js) se hornea ACÁ, no
    // como prop de <primitive> más abajo — pasarla como prop le pisaría a
    // Three.js esta escala calculada (React Three Fiber aplica `scale`
    // directo sobre el objeto ya existente), dejando el modelo en su
    // tamaño CRUDO original de archivo en vez del normalizado. Ese era el
    // bug real detrás de "la palta y el tamagotchi se ven diminutos": cada
    // .glb volvía a su escala nativa (distinta en cada archivo), sin
    // relación con el resto del altar.
    clon.scale.setScalar((2.2 / dimensionMayor) * escala)

    clon.updateMatrixWorld(true)
    const cajaEscalada = new THREE.Box3().setFromObject(clon)
    clon.position.sub(cajaEscalada.getCenter(new THREE.Vector3()))

    // materiales propios por instancia (no compartidos con otras copias del
    // mismo .glb) — necesario porque abajo se les cambia emissiveIntensity
    // en vivo, y guardamos su color base para que el brillo de hover y
    // reapropiación se encienda en el propio tono del objeto
    const materiales = []
    clon.traverse((hijo) => {
      if (hijo.isMesh && hijo.material) {
        hijo.material = hijo.material.clone()
        if ('emissiveIntensity' in hijo.material) {
          materiales.push({
            mat: hijo.material,
            colorBase: hijo.material.color ? hijo.material.color.clone() : new THREE.Color('#ffffff'),
          })
        }
      }
    })

    // la capa fantasma del desgaste: copia de cada malla del modelo vestida
    // de grietas — a diferencia de <Forma>, un .glb no tiene una geometría
    // fija, así que se clona la malla real en vez de redibujar una forma
    const capa = clon.clone()
    const desgasteMats = []
    capa.traverse((hijo) => {
      if (hijo.isMesh) {
        const mat = new THREE.MeshBasicMaterial({
          map: texturaDesgaste(), transparent: true, opacity: 0, depthWrite: false,
        })
        hijo.material = mat
        desgasteMats.push(mat)
      }
    })
    capa.scale.multiplyScalar(1.02)

    return { objeto: clon, capaDesgaste: capa, materiales, desgasteMats }
  }, [scene, escala])

  useEffect(() => {
    desgasteMats.forEach((m) => { m.opacity = desgaste * (consagrado ? 0.45 : 0.9) })
  }, [desgaste, consagrado, desgasteMats])

  useFrame(() => {
    const destello = pulso ? Math.max(0, 1.6 - (performance.now() - pulso) / 300) : 0
    const base = consagrado ? 0.5 : hover ? 0.35 : 0.08
    materiales.forEach(({ mat, colorBase }) => {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, base + destello, 0.18)
      mat.emissive.copy(consagrado ? COLOR_CONSAGRADO : colorBase)
    })
  })

  return (
    <>
      <primitive object={objeto} />
      {desgaste > 0 && <primitive object={capaDesgaste} />}
    </>
  )
}

export default function Afecto({
  afecto,
  reapropiaciones = 0,
  pulso = 0,
  seleccionado = false,
  onSeleccionar,
  onVolarLejano,
  onCerrarSeleccion,
  onReapropiar,
  onHoverLejos,
  posSeguirRef,
  posicionesRef,
}) {
  const grupo = useRef()
  const material = useRef()
  const [hover, setHover] = useState(false)
  const [cargarGlb, setCargarGlb] = useState(false)
  const [cerca, setCerca] = useState(false)
  const cuadro = useRef(0)

  const consagrado = reapropiaciones >= 100
  // cuánta grieta/mugre se ve: crece clic a clic hasta 100
  const desgaste = Math.min(reapropiaciones / 100, 1)

  // Mientras el mouse está encima de un afecto LEJANO, avisamos a App.jsx
  // para que muestre abajo el cartel "clic para volar hacia él". Es un
  // CARTEL, no un botón: lo que se clica es el objeto mismo (ver onClick
  // más abajo). Por eso puede apagarse apenas el mouse se va — antes era
  // un botón allá abajo y había que dejarlo "pegado" para que diera tiempo
  // de llegar a clicarlo, y por eso se quedaba trabado en pantalla.
  //
  // El segundo argumento (el id) evita que un afecto le apague el cartel a
  // otro: cualquiera puede PRENDERLO para sí, pero solo puede apagarlo si
  // el que está prendido es el suyo. Sin eso, cualquier afecto cuyo `cerca`
  // cambie (p. ej. al mover la cámara) borraría el cartel del que de verdad
  // tiene el mouse encima.
  useEffect(() => {
    const debeMostrar = hover && !cerca && !seleccionado
    onHoverLejos?.(debeMostrar ? afecto : null, afecto.id)
  }, [hover, cerca, seleccionado, afecto, onHoverLejos])

  // ancla de seguimiento (ver ControlesCamara.jsx): mientras la ficha de
  // ESTE afecto está abierta, publicamos su posición en vivo (sigue
  // orbitando/flotando) para que la cámara pueda perseguirlo sola. Al
  // dejar de ser el seleccionado+cercano, soltamos el "dueño" del ancla —
  // pero solo si todavía éramos nosotros (si no, sería pisarle la posta a
  // quien sea que esté anclado ahora).
  useEffect(() => {
    return () => {
      if (posSeguirRef?.current?.id === afecto.id) posSeguirRef.current = null
    }
  }, [seleccionado, cerca, afecto.id, posSeguirRef])

  // deriva planetaria: cada afecto orbita LENTO alrededor de su coordenada,
  // respira sube-y-baja y gira sobre sí mismo. Cada uno con su propio ritmo.
  const deriva = useMemo(
    () => ({
      fase: Math.random() * Math.PI * 2,
      radio: 1 + Math.random() * 2,
      velOrbita: 0.015 + Math.random() * 0.025,
      velRespira: 0.25 + Math.random() * 0.3,
      velGiro: (Math.random() - 0.5) * 0.12,
    }),
    [],
  )

  useFrame(({ camera, clock }) => {
    cuadro.current += 1

    // los consagrados son anclas del cielo: quietos para siempre
    if (grupo.current) {
      if (consagrado) {
        grupo.current.position.set(...afecto.posicion)
        grupo.current.rotation.y = 0
      } else {
        const t = clock.elapsedTime
        const angulo = deriva.fase + t * deriva.velOrbita
        grupo.current.position.set(
          afecto.posicion[0] + Math.cos(angulo) * deriva.radio,
          afecto.posicion[1] + Math.sin(t * deriva.velRespira + deriva.fase) * 0.7,
          afecto.posicion[2] + Math.sin(angulo) * deriva.radio,
        )
        grupo.current.rotation.y = t * deriva.velGiro
      }
    }

    // dos distancias, dos propósitos: `cargarGlb` es holgada (rendimiento,
    // aplica a cualquier afecto igual, tenga o no .glb — hoy la interacción
    // también la usa un afecto sin .glb); `cerca` es ajustada y gobierna
    // la interacción real (ficha completa, empujón de cámara, cuándo la
    // etiqueta de hover deja de mostrarse).
    if (cuadro.current % 20 === 0 && grupo.current) {
      const d = camera.position.distanceTo(grupo.current.position)
      setCargarGlb(d < DISTANCIA_DE_CARGA)
      setCerca(d < DISTANCIA_INTERACCION)
    }
    if (material.current) {
      const destello = pulso ? Math.max(0, 1.6 - (performance.now() - pulso) / 300) : 0
      const base = consagrado ? 0.5 : hover ? 0.35 : 0.08
      material.current.emissiveIntensity = THREE.MathUtils.lerp(
        material.current.emissiveIntensity, base + destello, 0.18,
      )
    }

    // posición EN VIVO de este afecto, para que el vuelo automático apunte
    // adonde el objeto ESTÁ (flota a la deriva) y no a su coordenada base
    if (posicionesRef && grupo.current) {
      posicionesRef.current[afecto.id] = [
        grupo.current.position.x, grupo.current.position.y, grupo.current.position.z,
      ]
    }

    // mientras la ficha de ESTE afecto está abierta, publicamos su
    // posición en vivo cuadro a cuadro — sigue orbitando/flotando (deriva)
    // y ControlesCamara lo usa para que el punto de mira lo persiga solo
    if (seleccionado && cerca && posSeguirRef && grupo.current) {
      posSeguirRef.current = {
        id: afecto.id,
        pos: [grupo.current.position.x, grupo.current.position.y, grupo.current.position.z],
      }
    }
  })

  return (
    <group
      ref={grupo}
      position={afecto.posicion}
      onClick={(e) => {
        e.stopPropagation()
        // UN solo gesto para todo: clic. Si ya está cerca, abre su ficha;
        // si está lejos, vuela hacia él (y al llegar la ficha se abre
        // sola). Antes el clic en un afecto lejano NO hacía nada y había
        // que ir a clicar un botón abajo en la pantalla — pero los afectos
        // están a 26-60 unidades unos de otros y el umbral de "cerca" es
        // 20, así que en la práctica NINGÚN otro objeto respondía al clic.
        if (cerca) onSeleccionar(afecto)
        else onVolarLejano(afecto)
      }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'default' }}
    >
      {afecto.glb && cargarGlb ? (
        <Suspense fallback={null}>
          <ModeloGLB
            url={afecto.glb}
            escala={afecto.escala || 1}
            desgaste={desgaste}
            consagrado={consagrado}
            hover={hover}
            pulso={pulso}
          />
        </Suspense>
      ) : (
        <>
          <mesh>
            <Forma forma={afecto.forma} />
            <meshStandardMaterial
              ref={material}
              color={afecto.color}
              emissive={consagrado ? '#fff6b8' : afecto.color}
              emissiveIntensity={0.08}
              flatShading
            />
          </mesh>

          {/* la malla fantasma del desgaste: mismo cuerpo, 2% más grande,
              vestido de grietas cuya opacidad es la memoria de los clics */}
          {desgaste > 0 && (
            <mesh scale={1.02}>
              <Forma forma={afecto.forma} />
              <meshBasicMaterial
                map={texturaDesgaste()}
                transparent
                opacity={desgaste * (consagrado ? 0.45 : 0.9)}
                depthWrite={false}
              />
            </mesh>
          )}
        </>
      )}

      {/* los consagrados llevan su propia constelación orbitando — reforzada */}
      {consagrado && <Sparkles count={60} scale={4.5} size={9} speed={0.5} color="#fff6b8" opacity={0.9} />}

      {/* el aura: un halo grande con mezcla ADITIVA, así se sigue viendo
          como un punto brillante incluso desde muy lejos — la "estrella
          más brillante del firmamento", a diferencia del glow normal del
          material, que se apaga con la distancia como todo lo demás */}
      {consagrado && (
        <sprite scale={[5, 5, 1]}>
          <spriteMaterial
            map={texturaAura()}
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </sprite>
      )}

      {/* hover + lejos: solo el nombre, anclado al objeto — pura vista
          previa, no toca cámara ni selección. El prompt de "volar hacia
          él" vive fijo en la pantalla (ver .prompt-volar en App.jsx), no
          acá, porque no tiene sentido que darle hover a un objeto lejano
          mueva o desenfoque nada del resto del altar. */}
      {hover && !cerca && (
        <Html occlude={false} style={{ pointerEvents: 'none' }}>
          <EtiquetaAfecto afecto={afecto} />
        </Html>
      )}

      {/* clic + cerca: la ficha completa, anclada en 3D pero AL LADO del
          objeto (no encima) — con distancia suficiente para que el
          objeto se siga viendo y apreciando entero, no tapado por la
          ventana. SIN desenfocar el fondo. Sin botón de "volar hacia
          él" — si ya está lo bastante cerca como para tener la ficha
          abierta, no tiene sentido pedirle que vuele más cerca todavía. */}
      {seleccionado && cerca && (
        <Html occlude={false} style={{ pointerEvents: 'none' }}>
          <VistaDetalle
            afecto={afecto}
            reapropiaciones={reapropiaciones}
            onReapropiar={() => onReapropiar(afecto)}
            onCerrar={onCerrarSeleccion}
          />
        </Html>
      )}
    </group>
  )
}
