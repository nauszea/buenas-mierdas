import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// ---------------------------------------------------------------------------
// Velos: cortinas de vapor translúcidas flotando por el cielo.
// Cada velo es un plano grande con un shader de ruido fbm que dibuja
// "gas" con bordes suaves. Entre varios, cruzados y a distintas alturas,
// dan la sensación de líquido-gaseoso al volar entre ellos.
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTiempo;
  uniform float uSemilla;
  uniform float uOpacidad;
  uniform vec3 uColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float ruido(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * ruido(p);
      p *= 2.07;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // el vapor se desplaza lento, cada velo con su propia deriva
    vec2 p = vUv * 3.0 + vec2(uTiempo * 0.03 + uSemilla * 13.0, uSemilla * 7.0 - uTiempo * 0.012);
    float gas = fbm(p);

    // bordes desvanecidos para que el plano nunca se note rectangular
    float borde = smoothstep(0.0, 0.38, vUv.x) * smoothstep(1.0, 0.62, vUv.x)
                * smoothstep(0.0, 0.38, vUv.y) * smoothstep(1.0, 0.62, vUv.y);

    float alfa = smoothstep(0.38, 0.85, gas) * borde * uOpacidad;

    // glitter finito dentro del vapor
    float chispa = step(0.9975, hash(floor(p * 60.0)));
    vec3 color = uColor + chispa * 0.35;

    gl_FragColor = vec4(color, alfa);
  }
`

const PALETA_VAPOR = ['#ffd6e8', '#e6d9ff', '#d3f2ff', '#fff3d9', '#ffe0f4']

function velosAleatorios(cantidad, semillaBase = 3) {
  let s = semillaBase
  const azar = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  return Array.from({ length: cantidad }, (_, i) => ({
    posicion: [(azar() - 0.5) * 70, 2 + azar() * 20, (azar() - 0.5) * 70],
    rotacionY: azar() * Math.PI,
    ancho: 30 + azar() * 30,
    alto: 14 + azar() * 12,
    color: PALETA_VAPOR[i % PALETA_VAPOR.length],
    semilla: azar(),
    opacidad: 0.16 + azar() * 0.14,
  }))
}

function Velo({ posicion, rotacionY, ancho, alto, color, semilla, opacidad }) {
  const uniforms = useMemo(
    () => ({
      uTiempo: { value: 0 },
      uSemilla: { value: semilla },
      uOpacidad: { value: opacidad },
      uColor: { value: new THREE.Color(color) },
    }),
    [semilla, opacidad, color],
  )
  const material = useRef()

  useFrame(({ clock }) => {
    uniforms.uTiempo.value = clock.elapsedTime
  })

  return (
    <mesh position={posicion} rotation={[0, rotacionY, 0]}>
      <planeGeometry args={[ancho, alto]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        fog={false}
      />
    </mesh>
  )
}

export default function Velos({ cantidad = 10 }) {
  const velos = useMemo(() => velosAleatorios(cantidad), [cantidad])
  return (
    <group>
      {velos.map((v, i) => (
        <Velo key={i} {...v} />
      ))}
    </group>
  )
}
