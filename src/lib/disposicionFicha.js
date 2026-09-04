// Fuente única de verdad para el "hueco" que ocupa la ficha anclada
// (VistaDetalle) a la derecha del objeto — antes este número vivía por
// duplicado (uno en global.css, otro aproximado a mano en
// ControlesCamara.jsx) y se desincronizaban apenas se tocaba uno solo.
// Ahora ambos importan de acá: VistaDetalle.jsx lo usa para su ancho y
// posición reales en pantalla; ControlesCamara.jsx lo usa para calcular
// cuánto correr la cámara y dejarle ese mismo espacio.
export const ANCHO_FICHA_PX = 280 // debe calzar con el ancho real de la ficha
export const GAP_FICHA_PX = 250 // separación entre el objeto y el borde de la ficha
