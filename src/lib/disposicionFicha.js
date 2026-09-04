// Fuente única de verdad para el "hueco" que ocupa la ficha anclada
// (VistaDetalle) a la derecha del objeto — antes este número vivía por
// duplicado (uno en global.css, otro aproximado a mano en
// ControlesCamara.jsx) y se desincronizaban apenas se tocaba uno solo.
// Ahora ambos importan de acá: VistaDetalle.jsx lo usa para su ancho y
// posición reales en pantalla; ControlesCamara.jsx lo usa para calcular
// cuánto correr la cámara y dejarle ese mismo espacio.
export const ANCHO_FICHA_PX = 280 // debe calzar con el ancho real de la ficha
export const GAP_FICHA_PX = 250 // separación entre el objeto y el borde de la ficha

// el cálculo de ControlesCamara.jsx trata al objeto como un punto sin
// ancho — pero el objeto sí ocupa espacio real en pantalla, así que sin
// esto la composición queda corrida de más hacia la izquierda (el objeto
// se corre para dejarle sitio a la ficha, pero "de más", porque su propio
// ancho nunca se restaba). Este número no se calcula solo porque el
// ancho aparente de cada objeto varía según su forma y la distancia —
// es un valor a ojo para ajustar si la composición se sigue viendo
// corrida hacia un lado: subirlo la mueve hacia la derecha, bajarlo
// hacia la izquierda.
export const CORRECCION_PX = 60
