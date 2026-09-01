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
  uniform float uTiempo;
  uniform vec3 uAlcance;
  attribute float aTam;
  attribute float aFase;
  attribute float aVel;
  attribute vec3 aColor;
  attribute vec3 aFacet; // orientación aleatoria propia — de aquí sale el "ángulo real"
  varying float vFase;
  varying float vVel;
  varying vec3 vColor;
  varying float vDestello;
  void main() {
    vFase = aFase;
    vVel = aVel;
    vColor = aColor;

    // DERIVA: cada partícula viaja lentamente por el espacio en su propia
    // dirección, como polvo en el aire o nubes cruzando el cielo. Al llegar
    // al borde del campo reaparece por el lado opuesto (mod), así el viaje
    // nunca termina y nunca se ve un "borde" del mundo.
    vec3 p = position + aFacet * uTiempo * 0.4;
    p.x = mod(p.x + uAlcance.x * 0.5, uAlcance.x) - uAlcance.x * 0.5;
    p.z = mod(p.z + uAlcance.z * 0.5, uAlcance.z) - uAlcance.z * 0.5;
    p.y = mod(p.y, uAlcance.y);
    // encima de la deriva, un vaivén suave — el mismo que usan los GIFs
    p.y += sin(uTiempo * aVel * 0.3 + aFase) * 0.5;

    // EL ÁNGULO REAL: qué tan alineada está la cara de este brillo con tu
    // mirada. abs() = la cara refleja por sus dos lados, así que hay más
    // chance de "prender". Potencia alta = destello angosto y notorio, que
    // aparece y desaparece cuando giras la cámara. NO depende del reloj.
    vec3 posMundo = (modelMatrix * vec4(p, 1.0)).xyz;
    vec3 haciaCamara = normalize(cameraPosition - posMundo);
    vDestello = pow(abs(dot(haciaCamara, aFacet)), 5.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // más lejos = más chico (perspectiva). Al destellar crece un poco, como
    // el glitter real cuando le pega la luz de frente.
    float tam = aTam * (1.0 + vDestello * 0.8);
    gl_PointSize = clamp(tam * (260.0 / -mv.z), 1.0, 15.0);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTiempo;
  varying float vFase;
  varying float vVel;
  varying vec3 vColor;
  varying float vDestello;
  void main() {
    // titileo propio, suave — le da vida, pero NO es quien decide si se ve
    float titilar = 0.55 + 0.45 * sin(uTiempo * vVel * 1.6 + vFase);
    // forma de rombo (destello clásico), con borde suave
    vec2 p = gl_PointCoord - 0.5;
    float rombo = abs(p.x) + abs(p.y);
    // siempre visible como puntito de color (0.3), pero al alinearse el
    // ángulo sube fuerte (hasta 1.0): ahí está el highlight que se nota
    float alfa = smoothstep(0.5, 0.12, rombo) * titilar * (0.3 + 0.7 * vDestello);
    // y al destellar además se aclara hacia el blanco, como un reflejo real
    vec3 color = vColor + vDestello * 0.5;
    gl_FragColor = vec4(color, alfa);
  }
`

// los mismos pasteles del resto de la UI (--rosa, --lila, --celeste, --menta,
// --vainilla) — antes estaban casi blancos y el brillo aditivo los quemaba
// del todo; estos sí se notan como color incluso encendidos
const PASTELES = ['#ffb3d9', '#d4bdff', '#a8e8ff', '#b0f2cd', '#fff0b3', '#ffc9a8']

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
    const facetas = new Float32Array(cantidad * 3)
    const color = new THREE.Color()
    const facet = new THREE.Vector3()

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
      // orientación propia al azar — de esto depende desde qué ángulo "prende"
      facet.set(azar() - 0.5, azar() - 0.5, azar() - 0.5).normalize()
      facetas[i * 3] = facet.x
      facetas[i * 3 + 1] = facet.y
      facetas[i * 3 + 2] = facet.z
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3))
    geo.setAttribute('aTam', new THREE.BufferAttribute(tams, 1))
    geo.setAttribute('aFase', new THREE.BufferAttribute(fases, 1))
    geo.setAttribute('aVel', new THREE.BufferAttribute(vels, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colores, 3))
    geo.setAttribute('aFacet', new THREE.BufferAttribute(facetas, 3))

    return {
      geometria: geo,
      uniforms: {
        uTiempo: { value: 0 },
        uAlcance: { value: new THREE.Vector3(...alcance) },
      },
    }
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
