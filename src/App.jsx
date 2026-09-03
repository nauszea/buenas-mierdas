import { Canvas } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { useCallback, useEffect, useRef, useState } from 'react'
import Cielo, { COLORES } from './scene/Cielo.jsx'
import ConstelacionGifs from './scene/ConstelacionGifs.jsx'
import Velos from './scene/Velos.jsx'
import Brillitos from './scene/Brillitos.jsx'
import Afecto from './scene/Afecto.jsx'
import ControlesCamara from './scene/ControlesCamara.jsx'
import VentanaRetro from './ui/VentanaRetro.jsx'
import PantallaCarga from './ui/PantallaCarga.jsx'
import AyudaNavegacion from './ui/AyudaNavegacion.jsx'
import { alternarMusica } from './lib/musica.js'
import { sonidoConsagrar, sonidoReapropiar } from './lib/efectos.js'
import Tutorial from './ui/Tutorial.jsx'
import Buscador from './ui/Buscador.jsx'
import FormularioSubida from './ui/FormularioSubida.jsx'
import InstruccionesEscaneo from './ui/InstruccionesEscaneo.jsx'
import Confirmacion from './ui/Confirmacion.jsx'
import { cargarAfectos, registrarReapropiacion } from './lib/api.js'
import { IdiomaContext, TEXTOS } from './lib/idioma.js'

export default function App() {
  // flujo de pantallas: carga → manifiesto → tutorial → null (altar libre)
  // además: 'subir', 'instrucciones', 'confirmacion'
  const [pantalla, setPantalla] = useState('carga')
  const [idioma, setIdioma] = useState('es')
  // carga en dos tiempos: el cielo (atmósfera) arranca de inmediato; los
  // afectos y GIFs (contenido) esperan a que se elija idioma
  const [listo, setListo] = useState(false)
  const [afectos, setAfectos] = useState([])
  const [nuevoAfecto, setNuevoAfecto] = useState(null)
  const [buscadorAbierto, setBuscadorAbierto] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  // el afecto que está siendo hover-eado mientras sigue lejos — gobierna
  // el prompt fijo de "volar hacia él" (ver más abajo). Es un estado
  // aparte de `seleccionado`: `seleccionado` es sobre CLIC + cerca (abre
  // la ficha completa), esto es sobre HOVER + lejos (vista previa liviana).
  const [objetoLejanoHover, setObjetoLejanoHover] = useState(null)
  const [mirarHacia, setMirarHacia] = useState(null)
  const [destino, setDestino] = useState(null)
  // NO es estado de React (a propósito): la posición del afecto anclado
  // cambia cada cuadro (orbita/flota) — pasarla por useState forzaría un
  // re-render 60 veces por segundo. Un ref mutable compartido entre
  // Afecto (que escribe) y ControlesCamara (que lee) evita eso. Forma:
  // { id, pos: [x,y,z] } o null si no hay nadie anclado.
  const posSeguirRef = useRef(null)
  // posición EN VIVO de cada afecto ({ id: [x,y,z] }), reescrita cada
  // cuadro por cada Afecto. Los afectos flotan a la deriva hasta 3 unidades
  // de su coordenada base, así que volar hacia la coordenada base te deja
  // el objeto fuera de cuadro al llegar. Igual que posSeguirRef: es un ref
  // y no estado, porque cambia 60 veces por segundo.
  const posicionesRef = useRef({})
  const [reapropiaciones, setReapropiaciones] = useState({})
  const [pulsos, setPulsos] = useState({})
  const [musicaSonando, setMusicaSonando] = useState(false)

  const t = TEXTOS[idioma]

  // cualquier ventana emergente sobre el altar libre (buscador, o cualquier
  // pantalla que no sea el altar mismo ni la carga). La ficha de un afecto
  // seleccionado NO cuenta: es un panel fijo a un costado (ver
  // VistaDetalle) y nunca desenfoca el fondo.
  const ventanaAbierta = buscadorAbierto || (pantalla !== null && pantalla !== 'carga')
  // desenfoque: fuerte en la carga, más suave detrás de cualquier ventana,
  // nada en el altar libre sin nada abierto
  const blurPx = pantalla === 'carga' ? 6 : ventanaAbierta ? 3 : 0

  // duración de la transición: LENTA solo la primera vez que se despeja el
  // cielo (saliendo de la carga); RÁPIDA para cualquier ventana que se
  // abra o cierre después de eso. El ref se marca "hecho" recién después
  // de ese primer despeje, así que ese primer cambio todavía alcanza a
  // usar la duración lenta antes de que se active la rápida.
  const primerDespejeHecho = useRef(false)
  useEffect(() => {
    if (pantalla !== 'carga') primerDespejeHecho.current = true
  }, [pantalla])
  const duracionBlur = primerDespejeHecho.current ? 'var(--duracion-modal)' : 'var(--duracion-carga)'

  // recién cuando se eligió idioma: cargar los afectos (de Pocketbase si
  // está encendido, si no del navegador). Antes de eso, solo existe el cielo.
  useEffect(() => {
    if (!listo) return
    cargarAfectos().then((lista) => {
      setAfectos(lista)
      const cuentas = {}
      lista.forEach((a) => { cuentas[a.id] = a.reapropiaciones || 0 })
      setReapropiaciones(cuentas)
    })
  }, [listo])

  // atajos: Ctrl+F buscador · Escape cierra ventanas
  useEffect(() => {
    const onTecla = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setBuscadorAbierto(true)
      }
      if (e.key === 'Escape') {
        setBuscadorAbierto(false)
        setSeleccionado(null)
        setObjetoLejanoHover(null)
      }
    }
    window.addEventListener('keydown', onTecla)
    return () => window.removeEventListener('keydown', onTecla)
  }, [])

  // volar desde el buscador: igual que clicar un afecto lejano — lo deja
  // seleccionado para que al llegar se abra su ficha y la cámara lo siga
  // (si no, el afecto sigue flotando y se te va del cuadro apenas llegas).
  const volarHacia = (afecto) => {
    setBuscadorAbierto(false)
    setSeleccionado(afecto)
    setObjetoLejanoHover(null)
    setMirarHacia(null)
    setDestino(afecto)
  }

  // clic sobre un afecto que YA está cerca: abre su ficha y empuja suave
  // la cámara para encuadrarlo.
  const seleccionarAfecto = (afecto) => {
    setSeleccionado(afecto)
    setMirarHacia(afecto.posicion)
    setObjetoLejanoHover(null)
  }

  // clic sobre un afecto LEJANO: vuela hacia él y lo deja seleccionado, así
  // que apenas la cámara llega (y Afecto.jsx lo detecta como "cerca") su
  // ficha se abre sola, sin un segundo clic. Sin empujón de cámara acá: el
  // vuelo ya reencuadra, y girar la cámara antes de salir marearía.
  const volarLejano = (afecto) => {
    setSeleccionado(afecto)
    setDestino(afecto)
    setObjetoLejanoHover(null)
    setMirarHacia(null)
  }

  // quién puede prender/apagar el cartel de "clic para volar hacia él":
  // prenderlo, cualquiera que tenga el mouse encima; apagarlo, SOLO el que
  // lo tenía prendido. Sin esta guarda, cualquier afecto al que le cambie
  // su distancia (mover la cámara le cambia `cerca` a varios a la vez) le
  // borraría el cartel al que de verdad está en hover.
  const reportarHoverLejos = useCallback((afectoONull, id) => {
    setObjetoLejanoHover((actual) => {
      if (afectoONull) return afectoONull
      return actual?.id === id ? null : actual
    })
  }, [])

  const reapropiar = (afecto) => {
    const cuentaAnterior = reapropiaciones[afecto.id] || 0
    const cuentaNueva = cuentaAnterior + 1
    setReapropiaciones((r) => ({ ...r, [afecto.id]: cuentaNueva }))
    setPulsos((p) => ({ ...p, [afecto.id]: performance.now() }))
    registrarReapropiacion(afecto, cuentaNueva) // persiste sin bloquear la UI
    // el acorde triunfal suena UNA sola vez, justo al cruzar a consagrado
    if (cuentaAnterior < 100 && cuentaNueva >= 100) sonidoConsagrar()
    else sonidoReapropiar()
  }

  const alCrearAfecto = (nuevo) => {
    setAfectos((lista) => [...lista, nuevo])
    setReapropiaciones((r) => ({ ...r, [nuevo.id]: 0 }))
    setNuevoAfecto(nuevo)
    setPantalla('confirmacion')
  }

  return (
    <IdiomaContext.Provider value={{ idioma, t }}>
      <div className="app">
        {/* ---------- EL LIENZO 3D (el altar) ---------- */}
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 3, 14], fov: 55, near: 0.1, far: 400 }}
          gl={{ antialias: false }}
          onPointerMissed={() => { setSeleccionado(null); setObjetoLejanoHover(null) }}
        >
          <fog attach="fog" args={[COLORES.horizonte, 15, 120]} />
          <ambientLight intensity={0.9} color={COLORES.luzAmbiente} />
          <directionalLight position={[5, 10, 5]} intensity={0.7} color={COLORES.luzSol} />

          <Cielo />
          <Velos cantidad={10} />
          {/* glitter titilante de tamaños variados (un draw call) + polvo en deriva */}
          <Brillitos cantidad={750} />
          {/* esta segunda tanda vive en la misma altura donde están los afectos (1-27),
              para que convivan con los objetos y no sean solo telón de fondo */}
          <Brillitos cantidad={450} alcance={[110, 28, 110]} semilla={29} />
          <Sparkles count={450} scale={[70, 40, 70]} size={2.6} speed={0.35} color="#ffd9f2" opacity={0.7} />

          {/* el contenido (GIFs y afectos) espera a que se elija idioma —
              durante la carga solo existe la atmósfera del cielo */}
          {listo && <ConstelacionGifs />}

          {listo && afectos.map((a) => (
            <Afecto
              key={a.id}
              afecto={a}
              reapropiaciones={reapropiaciones[a.id] || 0}
              pulso={pulsos[a.id] || 0}
              seleccionado={seleccionado?.id === a.id}
              onSeleccionar={seleccionarAfecto}
              onVolarLejano={volarLejano}
              onCerrarSeleccion={() => { setSeleccionado(null); setObjetoLejanoHover(null) }}
              onReapropiar={reapropiar}
              onHoverLejos={reportarHoverLejos}
              posSeguirRef={posSeguirRef}
              posicionesRef={posicionesRef}
            />
          ))}

          <ControlesCamara
            destino={destino}
            onFinDeVuelo={() => setDestino(null)}
            mirarHacia={mirarHacia}
            posSeguirRef={posSeguirRef}
            posicionesRef={posicionesRef}
          />
        </Canvas>

        {/* ---------- LA UI 2D (HTML plano flotando encima) ---------- */}
        {/* Un solo desenfoque, en .ui-overlay (nunca se desmonta) — sigue
            borroso durante toda la carga y la elección de idioma, y se
            despeja recién al entrar al manifiesto. El valor va DIRECTO en
            backdropFilter, no por una variable CSS — los navegadores no
            siempre animan bien una transición cuando el valor llega a
            través de var(), aunque la variable sí cambie. */}
        <div
          className="ui-overlay"
          style={{ backdropFilter: `blur(${blurPx}px)`, transition: `backdrop-filter ${duracionBlur} ease` }}
        >
          {/* grano sobre el blur — mismo tiempo que el desenfoque (--duracion-atmosfera) */}
          <div className={'ruido-atmosfera' + (pantalla === 'carga' ? ' visible' : '')} />

          {pantalla === 'carga' && (
            <PantallaCarga
              onElegirIdioma={(codigo) => {
                setIdioma(codigo)
                setPantalla('manifiesto')
                setListo(true) // recién ahora se cargan afectos y GIFs
              }}
            />
          )}

          {pantalla !== 'carga' && (
            <>
              <header className="barra-superior">
                <span className="titulo-sitio">✦ buenas mierdas ✦</span>
                <span>
                  <button
                    className="boton-retro"
                    onClick={async () => setMusicaSonando(await alternarMusica())}
                    aria-label="música"
                  >
                    {musicaSonando ? '❚❚' : '♪ ▶'}
                  </button>{' '}
                  <button className="boton-retro" onClick={() => setBuscadorAbierto(true)}>
                    {t.botonBuscar}
                  </button>{' '}
                  <button className="boton-retro" onClick={() => setPantalla('manifiesto')}>
                    {t.botonManifiesto}
                  </button>
                </span>
              </header>

              <button className="boton-retro boton-subir" onClick={() => setPantalla('subir')}>
                {t.botonSubir}
              </button>

              {/* solo en el altar libre de verdad — nada abierto encima, ni
                  un afecto lejano en hover (ese mismo lugar lo ocupa el
                  prompt de "volar hacia él" de abajo) */}
              {pantalla === null && !ventanaAbierta && !objetoLejanoHover && <AyudaNavegacion />}

              {/* hover sobre un afecto lejano: el cartel de abajo. Es un
                  AVISO, no un botón — lo que se clica es el objeto mismo,
                  como el "press start" de un arcade (que te dice qué hacer,
                  no es donde haces clic). Al no ser clicable tampoco se
                  queda pegado esperando que llegues: se apaga solo cuando
                  sacas el mouse del objeto.
                  Dos estilos para comparar — cambia la clase acá mismo:
                  "estilo-texto" (blanco con borde negro, sin caja) o
                  "estilo-boton" (la cajita redondeada de siempre). */}
              {objetoLejanoHover && (
                <span className="prompt-volar estilo-texto">{t.etiquetaVolar}</span>
              )}
            </>
          )}

          {pantalla === 'manifiesto' && (
            <VentanaRetro titulo={t.manifiestoTitulo} onCerrar={() => setPantalla('tutorial')}>
              <p style={{ whiteSpace: 'pre-line' }}>{t.manifiestoCuerpo}</p>
              <p className="parpadeo">{t.manifiestoContinuar}</p>
            </VentanaRetro>
          )}

          {pantalla === 'tutorial' && <Tutorial onEmpezar={() => setPantalla(null)} />}

          {pantalla === 'subir' && (
            <FormularioSubida
              onCreado={alCrearAfecto}
              onCerrar={() => setPantalla(null)}
              onInstrucciones={() => setPantalla('instrucciones')}
            />
          )}

          {pantalla === 'instrucciones' && (
            <InstruccionesEscaneo onVolver={() => setPantalla('subir')} />
          )}

          {pantalla === 'confirmacion' && nuevoAfecto && (
            <Confirmacion
              afecto={nuevoAfecto}
              onIr={() => {
                setPantalla(null)
                volarHacia(nuevoAfecto)
              }}
            />
          )}

          {buscadorAbierto && (
            <Buscador afectos={afectos} onVolar={volarHacia} onCerrar={() => setBuscadorAbierto(false)} />
          )}
        </div>
      </div>
    </IdiomaContext.Provider>
  )
}
