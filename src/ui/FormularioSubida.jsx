import { useRef, useState } from 'react'
import VentanaRetro from './VentanaRetro.jsx'
import { subirAfecto } from '../lib/api.js'
import { useTexto } from '../lib/idioma.js'

// ---------------------------------------------------------------------------
// FormularioSubida (pantalla 8): drag & drop del .glb + los campos del afecto.
// Sin GPS, sin datos personales: la ubicación es texto libre y poético.
// ---------------------------------------------------------------------------

export default function FormularioSubida({ onCreado, onCerrar, onInstrucciones }) {
  const { t } = useTexto()
  const inputArchivo = useRef()
  const [archivo, setArchivo] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [historia, setHistoria] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [subiendo, setSubiendo] = useState(false)

  const recibirArchivo = (archivoNuevo) => {
    if (!archivoNuevo) return
    const nombreArchivo = archivoNuevo.name.toLowerCase()
    if (!nombreArchivo.endsWith('.glb') && !nombreArchivo.endsWith('.gltf')) {
      setError(t.errorArchivo)
      return
    }
    setError('')
    setArchivo(archivoNuevo)
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError(t.errorNombre)
      return
    }
    setError('')
    setSubiendo(true)
    try {
      const nuevo = await subirAfecto({
        nombre: nombre.trim(),
        ubicacion: ubicacion.trim(),
        historia: historia.trim(),
        tags: tags
          .split(',')
          .map((etiqueta) => etiqueta.trim().replace(/^#/, '').toLowerCase())
          .filter(Boolean),
        archivo,
      })
      onCreado(nuevo)
    } catch (err) {
      console.error(err)
      setError(t.errorSubida)
      setSubiendo(false)
    }
  }

  return (
    <VentanaRetro titulo={t.subirTitulo} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <div
          className={
            'zona-drop' + (arrastrando ? ' arrastrando' : '') + (archivo ? ' con-archivo' : '')
          }
          onClick={() => inputArchivo.current.click()}
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault()
            setArrastrando(false)
            recibirArchivo(e.dataTransfer.files[0])
          }}
        >
          {archivo
            ? `▣ ${archivo.name} (${Math.round(archivo.size / 1024)} KB) — ${t.subirDropCambiar}`
            : t.subirDrop}
          <input
            ref={inputArchivo}
            type="file"
            accept=".glb,.gltf"
            hidden
            onChange={(e) => recibirArchivo(e.target.files[0])}
          />
        </div>

        <p className="nota-form">
          {t.subirNota1}{' '}
          <button type="button" className="enlace-retro" onClick={onInstrucciones}>
            {t.subirNota2}
          </button>{' '}
          {t.subirNota3}
        </p>

        <div className="campo-form">
          <label>{t.subirNombre}</label>
          <input
            className="input-retro"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t.subirNombreEj}
          />
        </div>

        <div className="campo-form">
          <label>{t.subirUbicacion}</label>
          <input
            className="input-retro"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder={t.subirUbicacionEj}
          />
        </div>

        <div className="campo-form">
          <label>{t.subirHistoria}</label>
          <textarea
            className="input-retro"
            value={historia}
            onChange={(e) => setHistoria(e.target.value)}
            placeholder={t.subirHistoriaEj}
          />
        </div>

        <div className="campo-form">
          <label>{t.subirTags}</label>
          <input
            className="input-retro"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t.subirTagsEj}
          />
        </div>

        {error && <p className="error-form">{error}</p>}

        <div className="centrado">
          <button className="boton-retro boton-start boton-primario" type="submit" disabled={subiendo}>
            {subiendo ? t.subirSubiendo : t.subirBoton}
          </button>
        </div>
      </form>
    </VentanaRetro>
  )
}
