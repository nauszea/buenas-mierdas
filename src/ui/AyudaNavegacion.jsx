import { useEffect, useRef, useState } from 'react'
import { useTexto } from '../lib/idioma.js'

// ---------------------------------------------------------------------------
// AyudaNavegacion: recordatorio de controles, abajo de la pantalla.
// Aparece TITILANDO con baja opacidad cuando dejas de navegar unos
// segundos, y se esconde apenas vuelves a moverte. Nunca estorba.
// ---------------------------------------------------------------------------

const SEGUNDOS_QUIETA = 3.5

export default function AyudaNavegacion() {
  const { t } = useTexto()
  const [quieta, setQuieta] = useState(false)
  const temporizador = useRef()

  useEffect(() => {
    const despertar = () => {
      setQuieta(false)
      clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => setQuieta(true), SEGUNDOS_QUIETA * 1000)
    }
    despertar() // arranca el conteo al entrar
    const eventos = ['pointerdown', 'pointermove', 'wheel', 'keydown']
    eventos.forEach((e) => window.addEventListener(e, despertar))
    return () => {
      clearTimeout(temporizador.current)
      eventos.forEach((e) => window.removeEventListener(e, despertar))
    }
  }, [])

  return <div className={'ayuda-nav' + (quieta ? ' visible' : '')}>{t.ayudaNav}</div>
}
