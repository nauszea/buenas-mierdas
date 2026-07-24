import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

// ---------------------------------------------------------------------------
// Brillitos: el glitter del universo. Cientos de partículas-rombo donde
// CADA UNA tiene su propio tamaño (chicas, medianas, grandonas), su color
// pastel, su velocidad y su fase de titileo — nada parpadea al unísono.
// Todo el enjambre cuesta UN solo draw call.
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  attribute float aTam;
  attribute float aFase;
  attribute float aVel;
  attribute vec3 aColor;
  varying float vFase;
  varying float vVel;
  varying vec3 vColor;
  void main() {
    vFase = aFase;
    vVel = aVel;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // más lejos = más chico (perspectiva), con tope para no desaparecer
    gl_PointSize = clamp(aTam * (260.0 / -mv.z), 1.5, 26.0);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTiempo;
  varying float vFase;
  varying float vVel;
  varying vec3 vColor;
  void main() {
    // titileo: cada brillo respira con su propio ritmo y desfase
    float titilar = 0.12 + 0.88 * abs(sin(uTiempo * vVel + vFase));
    // forma de rombo (destello clásico), con borde suave
    vec2 p = gl_PointCoord - 0.5;
    float rombo = abs(p.x) + abs(p.y);
    float alfa = smoothstep(0.5, 0.12, rombo) * titilar;
    gl_FragColor = vec4(vColor + 0.15 * titilar, alfa);
  }
`

const PASTELES = ['#fff6fb', '#ffd9f2', '#c9f6ff', '#fff3c9', '#e2d7ff', '#c5f2d9']

export default function Brillitos({ cantidad = 750, alcance = [180, 60, 180], semilla = 11 }) {
  const { geometria, uniforms } = useMemo(() => {
    let s = semilla
    const azar = () => {
      s = (s * 16807) % 2147483647
      return s / 2147483647
    }

    const posiciones = new Float32Array(cantidad * 3)
    const tams = new Float32Array(cantidad)
    const fases = new Float32Array(cantidad)
    const vels = new Float32Array(cantidad)
    const colores = new Float32Array(cantidad * 3)
    const color = new THREE.Color()

    for (let i = 0; i < cantidad; i++) {
      posiciones[i * 3] = (azar() - 0.5) * alcance[0]
      posiciones[i * 3 + 1] = azar() * alcance[1]
      posiciones[i * 3 + 2] = (azar() - 0.5) * alcance[2]
      // tamaños MUY variados: polvillo, brillos medianos y estrellones
      const rango = azar()
      tams[i] = rango < 0.6 ? 1.5 + azar() * 2.5 : rango < 0.9 ? 4 + azar() * 4 : 8 + azar() * 6
      fases[i] = azar() * Math.PI * 2
      vels[i] = 0.4 + azar() * 2.2
      color.set(PASTELES[Math.floor(azar() * PASTELES.length)])
      colores[i * 3] = color.r
      colores[i * 3 + 1] = color.g
      colores[i * 3 + 2] = color.b
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3))
    geo.setAttribute('aTam', new THREE.BufferAttribute(tams, 1))
    geo.setAttribute('aFase', new THREE.BufferAttribute(fases, 1))
    geo.setAttribute('aVel', new THREE.BufferAttribute(vels, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colores, 3))

    return { geometria: geo, uniforms: { uTiempo: { value: 0 } } }
  }, [cantidad, alcance, semilla])

  useFrame(({ clock }) => {
    uniforms.uTiempo.value = clock.elapsedTime
  })

  return (
    <points geometry={geometria}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        fog={false}
      />
    </points>
  )
}
