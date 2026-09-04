// Freno suave, por navegador: cuántas veces la MISMA persona puede
// reapropiar el MISMO afecto desde el mismo navegador — no es un límite
// técnico (se esquiva borrando localStorage), es fricción social, no
// vigilancia. Se prefirió esto a un límite por IP porque ese castiga redes
// compartidas (una casa, una universidad) y se esquiva con cualquier VPN.
const CLAVE = 'buenas-mierdas-reapropiados'

function leerSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE)) || [])
  } catch {
    return new Set()
  }
}

export function yaReapropiado(id) {
  return leerSet().has(id)
}

export function marcarReapropiado(id) {
  const set = leerSet()
  set.add(id)
  localStorage.setItem(CLAVE, JSON.stringify([...set]))
}
