import * as THREE from 'three'

// ---------------------------------------------------------------------------
// aura.js — el halo del afecto consagrado. Un resplandor radial, dibujado
// una sola vez en un canvas y compartido por todos los consagrados. Va en
// un sprite grande con mezcla ADITIVA — por eso se sigue viendo como un
// punto brillante incluso muy de lejos, a diferencia de un material normal
// que se apaga con la distancia como cualquier otra cosa del altar.
// ---------------------------------------------------------------------------

let textura = null

export function texturaAura() {
  if (textura) return textura

  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')

  const centro = 128
  const degradado = ctx.createRadialGradient(centro, centro, 0, centro, centro, centro)
  degradado.addColorStop(0, 'rgba(255, 248, 220, 1)')
  degradado.addColorStop(0.25, 'rgba(255, 240, 180, 0.55)')
  degradado.addColorStop(0.6, 'rgba(255, 230, 150, 0.16)')
  degradado.addColorStop(1, 'rgba(255, 230, 150, 0)')
  ctx.fillStyle = degradado
  ctx.fillRect(0, 0, 256, 256)

  textura = new THREE.CanvasTexture(c)
  return textura
}
