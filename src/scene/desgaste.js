import * as THREE from 'three'

// ---------------------------------------------------------------------------
// desgaste.js — la textura de grietas y mugre de la reapropiación (Fase 4).
// Se dibuja UNA sola vez en un canvas (grietas quebradas + manchas + motas)
// y todos los objetos del altar comparten esa misma textura; lo único que
// cambia por objeto es la opacidad (reapropiaciones / 100).
// ---------------------------------------------------------------------------

let textura = null

export function texturaDesgaste() {
  if (textura) return textura

  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')

  let s = 99 // azar determinista: las grietas son iguales en cada visita
  const azar = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }

  // 1) grietas: líneas quebradas oscuras que se ramifican
  const grieta = (x, y, largo, grosor) => {
    ctx.strokeStyle = `rgba(58, 46, 62, ${0.55 + azar() * 0.3})`
    ctx.lineWidth = grosor
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let i = 0; i < largo; i++) {
      x += (azar() - 0.5) * 26
      y += (azar() - 0.5) * 26
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  for (let i = 0; i < 10; i++) grieta(azar() * 256, azar() * 256, 5 + azar() * 7, 1 + azar() * 1.5)
  for (let i = 0; i < 6; i++) grieta(azar() * 256, azar() * 256, 3 + azar() * 3, 0.6)

  // 2) mugre: manchas suaves marrón-grisáceas
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(96, 78, 64, ${0.08 + azar() * 0.1})`
    ctx.beginPath()
    ctx.ellipse(azar() * 256, azar() * 256, 12 + azar() * 34, 8 + azar() * 22, azar() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3) motas: puntitos de suciedad
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = `rgba(70, 58, 70, ${0.15 + azar() * 0.25})`
    ctx.fillRect(azar() * 256, azar() * 256, 1 + azar() * 2, 1 + azar() * 2)
  }

  textura = new THREE.CanvasTexture(c)
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping
  textura.magFilter = THREE.NearestFilter // mugre pixelada, coherente con todo
  return textura
}
