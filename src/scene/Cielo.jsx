import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

// Paleta única del proyecto: cambiar aquí cambia todo el ambiente.
export const COLORES = {
  cenit: '#9bd7ff',      // celeste cielo
  horizonte: '#9bd7ff',  // celeste cielo
  nadir: '#ffcfd3',      // salmon debajo
  vapor1: '#fffefe',     // vapor  casi blanco
  vapor2: '#fdfbec',     // vapor crema
  luzAmbiente: '#fffef3',
  luzSol: '#f5d7a9',
}

// Cielo infinito y GASEOSO: esfera gigante vista desde adentro.
// Al degradé pastel se le suman, en el mismo shader (gratis en GPU):
//  - dos capas de vapor fbm que se mueven lento (nubes de gas)
//  - grano de ruido fino (textura, nada de degradés "limpios" de computadora)
//  - glitter: puntitos que titilan como escarcha
const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 pos = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    gl_Position = pos.xyww; // truco: siempre al fondo del depth buffer
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uCenit;
  uniform vec3 uHorizonte;
  uniform vec3 uNadir;
  uniform vec3 uVapor1;
  uniform vec3 uVapor2;
  uniform float uTiempo;
  varying vec3 vDir;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  float ruido(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * ruido(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float h = vDir.y; // -1 abajo, 0 horizonte, 1 arriba

    // 1) degradé base — estos dos números son el "cuánto tarda en llegar
    // al color completo" de cada lado. Mientras MÁS ALTO el número, MÁS
    // ARRIBA/ABAJO hay que mirar para que ese color se vea puro — así que
    // subir el número de abajo (nadir) es lo que hace que domine más el
    // celeste, porque el salmón tarda más en aparecer del todo.
    vec3 color = h >= 0.0
      ? mix(uHorizonte, uCenit, smoothstep(0.0, 0.45, h))   // antes 0.7 — en el origen no se nota (cenit y horizonte son el mismo celeste), pero sí lejos, en los otros climas
      : mix(uHorizonte, uNadir, smoothstep(0.0, 1.2, -h));  // antes 0.6 — ESTE es el que hacía ver tanto salmón

    // 2) vapores: dos capas de gas fbm derivando a distinta velocidad
    float gas1 = fbm(vDir * 2.6 + vec3(uTiempo * 0.018, uTiempo * 0.011, 0.0));
    float gas2 = fbm(vDir * 5.5 + vec3(0.0, -uTiempo * 0.014, uTiempo * 0.02) + 31.7);
    color = mix(color, uVapor1, smoothstep(0.42, 0.78, gas1) * 0.45);
    color = mix(color, uVapor2, smoothstep(0.48, 0.82, gas2) * 0.30);

    // 3) grano fino: rompe el degradé "perfecto", textura de ruido
    color += (hash(vDir * 380.0) - 0.5) * 0.06;

    // 4) glitter: escarcha que titila, en DOS escalas (chispas finas y gordas)
    vec3 celda = floor(vDir * 300.0);
    float esChispa = step(0.9962, hash(celda));
    float titilar = 0.5 + 0.5 * sin(uTiempo * 2.5 + hash(celda + 5.0) * 6.2831);
    color += esChispa * titilar * 0.34;

    vec3 celdaGorda = floor(vDir * 90.0);
    float esChispaGorda = step(0.9975, hash(celdaGorda + 3.3));
    float titilar2 = 0.5 + 0.5 * sin(uTiempo * 1.4 + hash(celdaGorda + 8.0) * 6.2831);
    color += esChispaGorda * titilar2 * 0.28;

    gl_FragColor = vec4(color, 1.0);
  }
`

// ---------------------------------------------------------------------------
// EL MUNDO CAMBIA MIENTRAS LO EXPLORAS: hay tres "climas" pastel repartidos
// por el espacio. Cerca del origen reina el alba rosa; volando hacia un lado
// el cielo se vuelve celeste-menta; hacia el otro, durazno-lavanda. La
// transición es un fundido lento según la posición de la cámara, y la
// niebla siempre acompaña el color del horizonte (por eso nunca se nota
// dónde termina el mundo).
// ---------------------------------------------------------------------------
const CLIMAS = [
  { cenit: '#9bd7ff', horizonte: '#9bd7ff', nadir: '#ffcfd3' }, // origen
  { cenit: '#93c6e8', horizonte: '#ffd6cd', nadir: '#fdffe0' }, // lejos, lado A: 
  { cenit: '#93c6e8', horizonte: '#fdf8e2', nadir: '#f5d6ca' }, // lejos, lado B: 
]

export default function Cielo() {
  const uniforms = useMemo(
    () => ({
      uCenit: { value: new THREE.Color(COLORES.cenit) },
      uHorizonte: { value: new THREE.Color(COLORES.horizonte) },
      uNadir: { value: new THREE.Color(COLORES.nadir) },
      uVapor1: { value: new THREE.Color(COLORES.vapor1) },
      uVapor2: { value: new THREE.Color(COLORES.vapor2) },
      uTiempo: { value: 0 },
    }),
    [],
  )

  // paletas y colores temporales (se crean una sola vez, se reusan cada cuadro)
  const clima = useMemo(
    () => ({
      paletas: CLIMAS.map((c) => ({
        cenit: new THREE.Color(c.cenit),
        horizonte: new THREE.Color(c.horizonte),
        nadir: new THREE.Color(c.nadir),
      })),
      objetivo: {
        cenit: new THREE.Color(),
        horizonte: new THREE.Color(),
        nadir: new THREE.Color(),
      },
    }),
    [],
  )

  useFrame(({ clock, camera, scene }) => {
    uniforms.uTiempo.value = clock.elapsedTime

    // ¿en qué zona del mundo estás? (0 = origen; lejos, según el ángulo)
    const distancia = Math.min(1, camera.position.length() / 42)
    const angulo = Math.atan2(camera.position.z, camera.position.x)
    let pesoA = distancia * (0.5 + 0.5 * Math.sin(angulo))
    let pesoB = distancia * (0.5 + 0.5 * Math.cos(angulo + 2.1))
    const pesoOrigen = Math.max(0, 1 - pesoA - pesoB)

    const [p0, pA, pB] = clima.paletas
    for (const capa of ['cenit', 'horizonte', 'nadir']) {
      clima.objetivo[capa]
        .copy(p0[capa]).multiplyScalar(pesoOrigen)
        .add(pA[capa].clone().multiplyScalar(pesoA))
        .add(pB[capa].clone().multiplyScalar(pesoB))
    }

    // fundido suave hacia el clima de la zona (2% por cuadro)
    uniforms.uCenit.value.lerp(clima.objetivo.cenit, 0.02)
    uniforms.uHorizonte.value.lerp(clima.objetivo.horizonte, 0.02)
    uniforms.uNadir.value.lerp(clima.objetivo.nadir, 0.02)

    // la niebla acompaña SIEMPRE al horizonte: el mundo cambia entero
    if (scene.fog) scene.fog.color.copy(uniforms.uHorizonte.value)
  })

  return (
    <mesh>
      <sphereGeometry args={[300, 32, 16]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
