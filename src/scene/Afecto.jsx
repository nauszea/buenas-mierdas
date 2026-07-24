import * as THREE from 'three'
import { Suspense, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, Sparkles } from '@react-three/drei'
import { texturaDesgaste } from './desgaste.js'

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

const DISTANCIA_DE_CARGA = 60 // a menos de esto (en unidades 3D) se carga el .glb

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

function ModeloGLB({ url, escala = 1 }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} scale={escala} />
}

export default function Afecto({ afecto, reapropiaciones = 0, pulso = 0, onClick }) {
  const grupo = useRef()
  const material = useRef()
  const [hover, setHover] = useState(false)
  const [cerca, setCerca] = useState(false)
  const cuadro = useRef(0)

  const consagrado = reapropiaciones >= 100
  // cuánta grieta/mugre se ve: crece clic a clic hasta 100
  const desgaste = Math.min(reapropiaciones / 100, 1)

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

    if (afecto.glb && cuadro.current % 20 === 0 && grupo.current) {
      const d = camera.position.distanceTo(grupo.current.position)
      setCerca(d < DISTANCIA_DE_CARGA)
    }
    if (material.current) {
      const destello = pulso ? Math.max(0, 1.6 - (performance.now() - pulso) / 300) : 0
      const base = consagrado ? 0.5 : hover ? 0.35 : 0.08
      material.current.emissiveIntensity = THREE.MathUtils.lerp(
        material.current.emissiveIntensity, base + destello, 0.18,
      )
    }
  })

  return (
    <group
      ref={grupo}
      position={afecto.posicion}
      onClick={(e) => { e.stopPropagation(); onClick(afecto) }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'default' }}
    >
      {afecto.glb && cerca ? (
        <Suspense fallback={null}>
          <ModeloGLB url={afecto.glb} escala={afecto.escala || 1} />
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

      {/* los consagrados llevan su propia constelación orbitando */}
      {consagrado && <Sparkles count={24} scale={3.4} size={5} speed={0.6} color="#fff6b8" />}
    </group>
  )
}
