import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

// Paleta única del proyecto: cambiar aquí cambia todo el ambiente.
//
// NO es un cielo de fantasía. Es el mediodía calcinante de Tacora: la luz que
// te quema mientras buscas entre la cachina, tan fuerte que los fotorreceptores
// se saturan y el cerebro devuelve post-imágenes en morados y azules eléctricos.
// El cielo del archivo es la memoria corporal de haber ido a rescatar los objetos.
export const COLORES = {
  cenit: '#4b3a9e',      // violeta profundo: la post-imagen quemada en la retina
  horizonte: '#ff9a4d',  // naranja quemado, sobreexpuesto (¡mismo color que el fog!)
  nadir: '#c49a63',      // ocre polvoriento: tierra, cemento, calor que sube del suelo
  vapor1: '#ffd08a',     // calima caliente
  vapor2: '#7b5fd6',     // el morado de la insolación
  luzAmbiente: '#ffd9ac',
  luzSol: '#fff4d6',
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

    // 1) degradé base
    vec3 color = h >= 0.0
      ? mix(uHorizonte, uCenit, smoothstep(0.0, 0.7, h))
      : mix(uHorizonte, uNadir, smoothstep(0.0, 0.6, -h));

    // 2) vapores: dos capas de gas fbm derivando a distinta velocidad
    float gas1 = fbm(vDir * 2.6 + vec3(uTiempo * 0.018, uTiempo * 0.011, 0.0));
    float gas2 = fbm(vDir * 5.5 + vec3(0.0, -uTiempo * 0.014, uTiempo * 0.02) + 31.7);
    color = mix(color, uVapor1, smoothstep(0.42, 0.78, gas1) * 0.45);
    color = mix(color, uVapor2, smoothstep(0.48, 0.82, gas2) * 0.30);

    // 3) SOBREEXPOSICIÓN: cerca del horizonte la luz revienta el sensor y el
    //    color se lava hacia el blanco. Es el sol de mediodía que no te deja ver.
    float quemado = (1.0 - smoothstep(0.0, 0.30, abs(h))) * 0.62;
    color = mix(color, vec3(1.0, 0.97, 0.88), quemado);

    // 4) grano fino: rompe el degradé "perfecto", textura de ruido
    color += (hash(vDir * 380.0) - 0.5) * 0.045;

    // 5) DESTELLOS: mismos brillitos de siempre, pero ya no son escarcha de hada
    //    — son el sol pegando en vidrio, metal y plástico de la cachina. Más
    //    duros, más blancos, y titilando más rápido (encandilan, no acarician).
    vec3 celda = floor(vDir * 300.0);
    float esChispa = step(0.9972, hash(celda));
    float titilar = 0.5 + 0.5 * sin(uTiempo * 3.4 + hash(celda + 5.0) * 6.2831);
    color += esChispa * titilar * 0.42;

    vec3 celdaGorda = floor(vDir * 90.0);
    float esChispaGorda = step(0.9983, hash(celdaGorda + 3.3));
    float titilar2 = 0.5 + 0.5 * sin(uTiempo * 2.0 + hash(celdaGorda + 8.0) * 6.2831);
    color += esChispaGorda * titilar2 * 0.38;

    gl_FragColor = vec4(color, 1.0);
  }
`

// ---------------------------------------------------------------------------
// EL MUNDO CAMBIA MIENTRAS LO EXPLORAS, y lo que cambia es CUÁNTO CALOR HAS
// AGUANTADO. No son tres paisajes distintos: son tres grados de exposición.
// Cerca del origen es mediodía calcinante. Volando hacia un lado cae el sunset
// de verano, naranja sucio. Hacia el otro llega el golpe de calor: la vista
// falla y todo vira a morados y azules eléctricos. Mientras más lejos vas del
// centro, más insolado estás. La niebla siempre acompaña al horizonte, así que
// nunca se nota dónde termina el mundo — solo que el aire está más caliente.
// ---------------------------------------------------------------------------
const CLIMAS = [
  { cenit: '#4b3a9e', horizonte: '#ff9a4d', nadir: '#c49a63' }, // origen: mediodía calcinante
  { cenit: '#8e3f7a', horizonte: '#ff6b35', nadir: '#a8683f' }, // lado A: sunset de verano, naranja quemado
  { cenit: '#2d2bb5', horizonte: '#b06be0', nadir: '#5f4bc4' }, // lado B: golpe de calor, la vista falla
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
