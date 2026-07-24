// ---------------------------------------------------------------------------
// afectos.js — el catálogo de objetos del altar.
//
// Por ahora es una lista escrita a mano con objetos de ejemplo (formas
// geométricas de mentira). En la Fase 3, esta lista vendrá de Pocketbase
// con los .glb reales que suba la gente.
//
// Para probar un .glb TUYO hoy mismo:
//   1. pon el archivo en  public/modelos/  (ej: public/modelos/taza.glb)
//   2. agrega aquí un objeto con  glb: '/modelos/taza.glb'
//      (la forma/color se ignoran cuando hay glb)
// ---------------------------------------------------------------------------

export const AFECTOS = [
  {
    id: 'a1',
    nombre: 'taza despostillada',
    historia: 'Era de mi abuela. El borde roto marca el lado por donde ella tomaba.',
    ubicacion: 'cocina de una casa que ya no existe',
    tags: ['cerámica', 'familia', 'desayuno'],
    posicion: [0, 0, 0],
    forma: 'icosaedro',
    color: '#ffb7d5',
  },
  {
    id: 'a2',
    nombre: 'walkman amarillo',
    historia: 'Lo encontré en la cachina. Todavía gira, aunque ya no suena.',
    ubicacion: 'mercado de segunda, mesa del fondo',
    tags: ['música', 'plástico', '90s'],
    posicion: [24, 5, -16],
    forma: 'caja',
    color: '#ffe9a8',
  },
  {
    id: 'a3',
    nombre: 'peluche tuerto',
    historia: 'Perdió el ojo en una mudanza. Nadie lo quiso tirar.',
    ubicacion: 'caja de "cosas que duelen"',
    tags: ['infancia', 'suave', 'testigo'],
    posicion: [-29, 10, -8],
    forma: 'esfera',
    color: '#d9c6ff',
  },
  {
    id: 'a4',
    nombre: 'anillo de fantasía',
    historia: 'Me lo regalaron a los 15. El dorado se fue, la promesa no.',
    ubicacion: 'joyero heredado',
    tags: ['promesa', 'metal', 'brillo'],
    posicion: [16, 18, 21],
    forma: 'toro',
    color: '#c9f6ff',
  },
  {
    id: 'a5',
    nombre: 'casete sin etiqueta',
    historia: 'Nadie sabe qué tiene grabado. Preferimos no averiguarlo.',
    ubicacion: 'guantera de un auto vendido',
    tags: ['misterio', 'voz', 'cinta'],
    posicion: [-18, 3, 26],
    forma: 'caja',
    color: '#ffc7e6',
  },
  {
    id: 'a6',
    nombre: 'llave de una puerta demolida',
    historia: 'La casa ya no está. La llave sigue abriendo algo, no sabemos qué.',
    ubicacion: 'llavero de mi papá',
    tags: ['casa', 'pérdida', 'metal'],
    posicion: [37, 13, 11],
    forma: 'nudo',
    color: '#b8e6c9',
  },
  {
    id: 'a7',
    nombre: 'gameboy con pantalla quemada',
    historia: 'Se ve una sombra fantasma de Tetris para siempre.',
    ubicacion: 'cajón de cables viejos',
    tags: ['juego', 'pantalla', 'fantasma'],
    posicion: [-10, 23, -31],
    forma: 'caja',
    color: '#cdefff',
  },
  {
    id: 'a8',
    nombre: 'flor de tela desteñida',
    historia: 'Vino en un ramo de despedida. Es la única que no se marchitó.',
    ubicacion: 'entre las páginas de un diccionario',
    tags: ['despedida', 'tela', 'rosa'],
    posicion: [5, 30, -47],
    forma: 'dodecaedro',
    color: '#ffd6e8',
  },
  // ejemplo REAL con .glb: la palta CC0 de los samples oficiales de glTF,
  // comprimida de 8.3 MB a 0.6 MB con gltf-transform (así se verán los
  // escaneos). `escala` agranda modelos que vienen en tamaño real.
  {
    id: 'a9',
    nombre: 'palta de muestra',
    historia: 'No es una ruina de nadie todavía: es la palta de prueba que demuestra que los escaneos pueden vivir aquí.',
    ubicacion: 'los ejemplos oficiales de glTF (CC0)',
    tags: ['prueba', 'glb', 'fruta'],
    posicion: [-39, 8, 31],
    glb: '/modelos/palta.glb',
    escala: 34,
    forma: 'esfera',
    color: '#b8e6c9',
  },
]
