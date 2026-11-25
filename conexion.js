// =====================================================================
//  CONEXIÓN CON SUPABASE (la usan index.html y admin.html)
//  La llave "publishable" es segura en el navegador: lo que cada quien
//  puede hacer lo controlan las políticas RLS de la base de datos.
// =====================================================================
const SUPABASE_URL = "https://hixdyclpuxemadhwhcdc.supabase.co";
const SUPABASE_CLAVE = "sb_publishable_v5FHal-3-ZeWjWPdSs_MkQ_C0dZxYcw";

const { createClient } = window.supabase;
const clienteDB = createClient(SUPABASE_URL, SUPABASE_CLAVE);

// Nombre de la tabla y del bucket de imágenes
const TABLA = "vapes";
const BUCKET = "vapes";

// Imagen por defecto cuando un vape no tiene foto (SVG dentro del código)
const IMAGEN_DEFAULT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#eef1f5"/>' +
      '<text x="50%" y="50%" font-family="Segoe UI, sans-serif" font-size="22" ' +
      'fill="#9aa5b1" text-anchor="middle" dominant-baseline="middle">Sin imagen</text>' +
      "</svg>"
  );

// Evita que texto escrito por el usuario se interprete como HTML (seguridad XSS)
function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

// Devuelve la etiqueta de stock según la cantidad de piezas
function etiquetaStock(stock) {
  const piezas = Number(stock) || 0;
  if (piezas === 0) return '<span class="stock stock-agotado">Agotado</span>';
  if (piezas <= 3) return `<span class="stock stock-bajo">¡Últimas ${piezas} piezas!</span>`;
  return `<span class="stock stock-ok">${piezas} en stock</span>`;
}
