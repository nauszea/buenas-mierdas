import { createContext, useContext } from 'react'

// ---------------------------------------------------------------------------
// idioma.js — todos los textos de la interfaz en los tres idiomas.
// Para cambiar cualquier texto del altar, se edita AQUÍ (y solo aquí).
// Las claves son iguales en los tres; {n} y {nombre} se rellenan al vuelo.
// ---------------------------------------------------------------------------

export const TEXTOS = {
  es: {
    cargando: 'cargando el altar…',
    eligeIdioma: 'elige tu idioma',
    botonBuscar: '⌕ buscar',
    botonManifiesto: 'manifiesto.txt',
    botonSubir: '↑ Subir un afecto',

    manifiestoTitulo: 'manifiesto.txt',
    manifiestoCuerpo:
      'Archivo de ruinas digitales y afectos reapropiados.\n\nContra el colonialismo de datos, este altar vive en una computadora portátil. Aquí las cosas rotas, viejas y amadas existen en un plano más allá del físico.',
    manifiestoContinuar: '▸ cierra esta ventana para continuar',

    tutorialTitulo: 'como_navegar.txt',
    tutorialFilas: [
      ['arrastrar', 'girar alrededor del altar'],
      ['clic derecho + arrastrar', 'desplazarte de lado'],
      ['rueda', 'acercarte / alejarte'],
      ['W A S D o flechas', 'volar por el cielo'],
      ['Q / E', 'subir / bajar'],
      ['Ctrl + F', 'buscar un afecto'],
      ['clic en un objeto', 'ver su historia'],
    ],
    tutorialStart: '▶ Start',

    buscadorTitulo: 'buscar_afecto',
    buscadorPlaceholder: 'escribe un nombre o etiqueta…',
    buscadorVacio: 'no se encontró ese afecto…',

    detalleUbicacion: 'ubicación',
    detalleHistoria: 'historia',
    detalleReapropiado: 'reapropiado {n} de 100 veces',
    detalleConsagrado: '★ CONSAGRADO ★ afecto de afectos',
    detalleReapropiar: '✥ Reapropiar',
    detalleVolar: '➤ Volar hacia él',

    subirTitulo: 'subir_un_afecto',
    subirDrop: '↓ arrastra aquí tu escaneo .glb\n(o haz clic para buscarlo)',
    subirDropCambiar: 'clic para cambiar',
    subirNota1: '¿todavía no escaneas tu objeto?',
    subirNota2: 'aprende a escanearlo aquí',
    subirNota3: '— también puedes subir solo la historia y el objeto flotará como forma pastel.',
    subirNombre: 'nombre de tu afecto *',
    subirNombreEj: 'taza despostillada de la abuela',
    subirUbicacion: 'ubicación (texto libre — sin GPS, tu anonimato importa)',
    subirUbicacionEj: 'cocina de una casa que ya no existe',
    subirHistoria: 'historia (el porqué)',
    subirHistoriaEj: 'por qué este objeto merece existir en otro plano…',
    subirTags: 'etiquetas (separadas por comas)',
    subirTagsEj: 'cerámica, familia, desayuno',
    subirBoton: '✧ Situar en el altar',
    subirSubiendo: 'subiendo…',
    errorArchivo: 'Ese archivo no es un modelo 3D — necesito un .glb (exportado de Polycam o similar).',
    errorNombre: 'Tu afecto necesita al menos un nombre.',
    errorSubida: 'No se pudo subir. ¿El altar (Pocketbase) está encendido? Intenta de nuevo.',

    escaneoTitulo: 'como_escanear.txt',
    escaneoPasos: [
      'Descarga Polycam en tu celular (también sirven Luma AI o Kiri Engine — todas tienen modo gratis).',
      'Pon tu objeto sobre una mesa con buena luz y dale la vuelta despacio con la cámara, como si lo acariciaras con la mirada. Entre 20 y 50 fotos alcanzan.',
      'Exporta como GLB. Si te deja elegir calidad, elige la MÁS BAJA: lo tosco y lo roto son parte de la estética de este altar, y además carga rápido.',
      'Pásate el archivo a la computadora (correo, WhatsApp, cable…) y arrástralo al formulario.',
    ],
    escaneoLema: '▸ las ruinas no necesitan verse perfectas',
    escaneoVolver: '← volver al formulario',

    confirmacionTexto: 'Tu afecto ahora existe en este plano.',
    confirmacionFlota: 'flota en',
    confirmacionIr: 'Ve con él →',
    ayudaNav: 'arrastra para girar · W A S D para volar · Q / E subir y bajar · Ctrl+F para buscar',
  },

  en: {
    cargando: 'loading the altar…',
    eligeIdioma: 'choose your language',
    botonBuscar: '⌕ search',
    botonManifiesto: 'manifesto.txt',
    botonSubir: '↑ Upload an affect',

    manifiestoTitulo: 'manifesto.txt',
    manifiestoCuerpo:
      'An archive of digital ruins and reappropriated affects.\n\nAgainst data colonialism, this altar lives on a laptop. Here the broken, old and beloved things exist on a plane beyond the physical.',
    manifiestoContinuar: '▸ close this window to continue',

    tutorialTitulo: 'how_to_navigate.txt',
    tutorialFilas: [
      ['drag', 'orbit around the altar'],
      ['right-click + drag', 'move sideways'],
      ['wheel', 'zoom in / out'],
      ['W A S D or arrows', 'fly through the sky'],
      ['Q / E', 'go up / down'],
      ['Ctrl + F', 'search for an affect'],
      ['click an object', 'read its story'],
    ],
    tutorialStart: '▶ Start',

    buscadorTitulo: 'find_affect',
    buscadorPlaceholder: 'type a name or a tag…',
    buscadorVacio: 'that affect was not found…',

    detalleUbicacion: 'location',
    detalleHistoria: 'story',
    detalleReapropiado: 'reappropriated {n} of 100 times',
    detalleConsagrado: '★ CONSECRATED ★ affect of affects',
    detalleReapropiar: '✥ Reappropriate',
    detalleVolar: '➤ Fly to it',

    subirTitulo: 'upload_an_affect',
    subirDrop: '↓ drop your .glb scan here\n(or click to browse)',
    subirDropCambiar: 'click to change',
    subirNota1: "haven't scanned your object yet?",
    subirNota2: 'learn how to scan it here',
    subirNota3: '— you can also upload just the story and the object will float as a pastel shape.',
    subirNombre: 'name of your affect *',
    subirNombreEj: "grandma's chipped mug",
    subirUbicacion: 'location (free text — no GPS, your anonymity matters)',
    subirUbicacionEj: 'kitchen of a house that no longer exists',
    subirHistoria: 'story (the why)',
    subirHistoriaEj: 'why this object deserves to exist on another plane…',
    subirTags: 'tags (separated by commas)',
    subirTagsEj: 'ceramic, family, breakfast',
    subirBoton: '✧ Place on the altar',
    subirSubiendo: 'uploading…',
    errorArchivo: 'That file is not a 3D model — I need a .glb (exported from Polycam or similar).',
    errorNombre: 'Your affect needs at least a name.',
    errorSubida: "Couldn't upload. Is the altar (Pocketbase) turned on? Try again.",

    escaneoTitulo: 'how_to_scan.txt',
    escaneoPasos: [
      'Download Polycam on your phone (Luma AI or Kiri Engine also work — all have a free mode).',
      'Place your object on a table with good light and circle it slowly with the camera, as if caressing it with your gaze. 20 to 50 photos are enough.',
      'Export as GLB. If it lets you choose quality, pick the LOWEST: the rough and the broken are part of this altar’s aesthetics, and it loads fast.',
      'Send the file to your computer (email, WhatsApp, cable…) and drag it into the form.',
    ],
    escaneoLema: '▸ ruins don’t need to look perfect',
    escaneoVolver: '← back to the form',

    confirmacionTexto: 'Your affect now exists on this plane.',
    confirmacionFlota: 'it floats at',
    confirmacionIr: 'Go with it →',
    ayudaNav: 'drag to orbit · W A S D to fly · Q / E up and down · Ctrl+F to search',
  },

  de: {
    cargando: 'der Altar lädt…',
    eligeIdioma: 'wähle deine Sprache',
    botonBuscar: '⌕ suchen',
    botonManifiesto: 'manifest.txt',
    botonSubir: '↑ Einen Affekt hochladen',

    manifiestoTitulo: 'manifest.txt',
    manifiestoCuerpo:
      'Ein Archiv digitaler Ruinen und wiederangeeigneter Affekte.\n\nGegen den Datenkolonialismus lebt dieser Altar auf einem Laptop. Hier existieren die kaputten, alten und geliebten Dinge auf einer Ebene jenseits des Physischen.',
    manifiestoContinuar: '▸ schließe dieses Fenster, um fortzufahren',

    tutorialTitulo: 'navigation.txt',
    tutorialFilas: [
      ['ziehen', 'um den Altar kreisen'],
      ['Rechtsklick + ziehen', 'seitwärts bewegen'],
      ['Mausrad', 'heran- / herauszoomen'],
      ['W A S D oder Pfeile', 'durch den Himmel fliegen'],
      ['Q / E', 'aufsteigen / sinken'],
      ['Strg + F', 'einen Affekt suchen'],
      ['Objekt anklicken', 'seine Geschichte lesen'],
    ],
    tutorialStart: '▶ Start',

    buscadorTitulo: 'affekt_finden',
    buscadorPlaceholder: 'Name oder Schlagwort eingeben…',
    buscadorVacio: 'dieser Affekt wurde nicht gefunden…',

    detalleUbicacion: 'Ort',
    detalleHistoria: 'Geschichte',
    detalleReapropiado: '{n} von 100 Mal wiederangeeignet',
    detalleConsagrado: '★ GEWEIHT ★ Affekt der Affekte',
    detalleReapropiar: '✥ Wiederaneignen',
    detalleVolar: '➤ Hinfliegen',

    subirTitulo: 'affekt_hochladen',
    subirDrop: '↓ zieh deinen .glb-Scan hierher\n(oder klicke zum Auswählen)',
    subirDropCambiar: 'klicken zum Ändern',
    subirNota1: 'dein Objekt noch nicht gescannt?',
    subirNota2: 'hier lernst du, wie es geht',
    subirNota3: '— du kannst auch nur die Geschichte hochladen; das Objekt schwebt dann als Pastellform.',
    subirNombre: 'Name deines Affekts *',
    subirNombreEj: 'Omas angeschlagene Tasse',
    subirUbicacion: 'Ort (freier Text — kein GPS, deine Anonymität zählt)',
    subirUbicacionEj: 'Küche eines Hauses, das nicht mehr existiert',
    subirHistoria: 'Geschichte (das Warum)',
    subirHistoriaEj: 'warum dieses Objekt auf einer anderen Ebene existieren soll…',
    subirTags: 'Schlagwörter (durch Kommas getrennt)',
    subirTagsEj: 'Keramik, Familie, Frühstück',
    subirBoton: '✧ Auf den Altar stellen',
    subirSubiendo: 'lädt hoch…',
    errorArchivo: 'Diese Datei ist kein 3D-Modell — ich brauche eine .glb (aus Polycam o. ä. exportiert).',
    errorNombre: 'Dein Affekt braucht mindestens einen Namen.',
    errorSubida: 'Hochladen fehlgeschlagen. Ist der Altar (Pocketbase) eingeschaltet? Versuch es nochmal.',

    escaneoTitulo: 'scannen.txt',
    escaneoPasos: [
      'Lade Polycam auf dein Handy (Luma AI oder Kiri Engine gehen auch — alle haben einen Gratismodus).',
      'Stell dein Objekt auf einen Tisch mit gutem Licht und umkreise es langsam mit der Kamera, als würdest du es mit dem Blick streicheln. 20 bis 50 Fotos reichen.',
      'Exportiere als GLB. Wenn du die Qualität wählen kannst, nimm die NIEDRIGSTE: das Grobe und Kaputte gehört zur Ästhetik dieses Altars — und es lädt schnell.',
      'Schick die Datei an deinen Computer (E-Mail, WhatsApp, Kabel…) und zieh sie ins Formular.',
    ],
    escaneoLema: '▸ Ruinen müssen nicht perfekt aussehen',
    escaneoVolver: '← zurück zum Formular',

    confirmacionTexto: 'Dein Affekt existiert jetzt auf dieser Ebene.',
    confirmacionFlota: 'er schwebt bei',
    confirmacionIr: 'Geh mit ihm →',
    ayudaNav: 'ziehen zum Kreisen · W A S D zum Fliegen · Q / E auf und ab · Strg+F zum Suchen',
  },
}

// rellena {n}, {nombre}, etc. → f(t.detalleReapropiado, { n: 3 })
export function f(texto, variables = {}) {
  return Object.entries(variables).reduce(
    (s, [clave, valor]) => s.replaceAll(`{${clave}}`, valor),
    texto,
  )
}

export const IdiomaContext = createContext({ idioma: 'es', t: TEXTOS.es })

// hook para leer los textos desde cualquier componente
export function useTexto() {
  return useContext(IdiomaContext)
}
