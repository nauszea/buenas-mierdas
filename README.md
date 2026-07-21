# Buenas Mierdas ✦ archivo de ruinas digitales y afectos reapropiados

Altar/archivo 3D interactivo en la web. Arte contemporáneo, diseño especulativo
y resistencia tecnopolítica: contra el colonialismo de datos, este archivo vive
en una computadora portátil.

## Cómo correrlo (para dummies)

Necesitas tener instalado [Node.js](https://nodejs.org) (versión 18 o más nueva).

```bash
# 1. entra a la carpeta del proyecto
cd buenas-mierdas

# 2. instala las dependencias (solo la primera vez, tarda un par de minutos)
npm install

# 3. enciende el servidor de desarrollo
npm run dev
```

Abre en tu navegador la dirección que aparece (normalmente `http://localhost:5173`).
Deberías ver: cielo pastel infinito con niebla, brillitos titilando, un objeto
de prueba rosado, y la ventana retro del manifiesto.

## Estructura de carpetas

```
buenas-mierdas/
├── index.html              ← la página (Vite la usa de punto de entrada)
├── package.json            ← lista de dependencias y comandos
├── vite.config.js          ← configuración de Vite
├── public/
│   ├── gifs/               ← AQUÍ van tus GIFs de GifCities
│   ├── modelos/            ← AQUÍ van tus .glb escaneados (ver su LEEME.txt)
│   └── fonts/              ← aquí irá la fuente pixelada (.woff2)
└── src/
    ├── main.jsx            ← arranca React
    ├── App.jsx             ← el lienzo 3D + la UI 2D + el flujo de pantallas
    ├── data/
    │   └── afectos.js      ← catálogo de objetos del altar (editable a mano)
    ├── styles/
    │   └── global.css      ← estética Windows 95 / web vernácula
    ├── scene/              ← todo lo que vive DENTRO del 3D
    │   ├── Cielo.jsx       ← esfera-cielo con degradé pastel (shader)
    │   ├── ConstelacionGifs.jsx  ← reparte billboards por el cielo
    │   ├── GifBillboard.jsx      ← GIF animado como sprite 3D
    │   ├── EstrellaPixel.jsx     ← estrellita procedural de relleno
    │   ├── Afecto.jsx            ← objeto del altar (.glb o forma, hover, destello)
    │   └── ControlesCamara.jsx   ← orbitar + pan + volar con teclado + vuelo automático
    └── ui/                 ← componentes HTML que flotan sobre el canvas
        ├── VentanaRetro.jsx      ← ventana estilo Win95 reutilizable
        ├── Tutorial.jsx          ← guía de controles + botón Start
        ├── Buscador.jsx          ← Ctrl+F: índice con filtro y vuelo de cámara
        └── VistaDetalle.jsx      ← ficha del afecto + botón Reapropiar
```

## Controles

| Acción | Cómo |
|---|---|
| Girar alrededor | arrastrar con clic izquierdo |
| Desplazarse de lado | arrastrar con clic derecho |
| Acercarse / alejarse | rueda del mouse |
| Volar | `W` `A` `S` `D` o flechas |
| Subir / bajar | `Q` / `E` |
| Buscar un afecto | `Ctrl + F` (la cámara vuela sola al elegido) |
| Ver la historia de un objeto | clic sobre él |

## Fases del proyecto

- [x] **Fase 1** — Cielo infinito: fog, degradé pastel, brillitos, billboards de GIFs, UI retro base
- [x] **Fase 2** — Navegación 3D completa (volar con teclado + pan), tutorial de controles,
      buscador Ctrl+F con vuelo de cámara, afectos con vista de detalle, contador de
      reapropiaciones + destello, soporte `.glb` con carga perezosa por distancia
- [x] **Fase 3** — Formulario "Subir un afecto" (drag & drop + campos + validación),
      instrucciones de escaneo, confirmación con vuelo a la coordenada nueva, y backend
      Pocketbase (ver `backend/README.md`) con modo ensayo automático si está apagado.
      Además: cielo gaseoso (ruido fbm + grano + glitter en shader), velos de vapor
      translúcidos, y rediseño UI a Mac OS clásico en pasteles.
- [ ] Fase 4 — Reapropiación visual acumulada (grietas/mugre) y consagración persistente
- [ ] Fase 5 — Pantallas de carga e idioma, música 8-bits
- [ ] Fase 6 — Cloudflare Tunnel + moderación de textos

## Stack

Vite · React · React Three Fiber · Drei · gifuct-js · (próximamente) Pocketbase
