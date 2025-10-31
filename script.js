// script.js (versión robusta y con búsqueda que funciona aunque las columnas tengan espacios/mayúsculas)
const API_URL = "https://script.google.com/macros/s/AKfycbwScqdIrqYxmcZMLcw5CyulNxeMCV90gPfqdhJqNnj9udL8il10H20SyLbWcgysPYJR/exec";
const NUMERO_WHATSAPP = "5213318192003";

let productos = [];
let categorias = [];

/**
 * Normaliza un objeto · quita espacios en claves y crea claves esperadas
 * Devuelve objeto con al menos: Nombre, Descripción, Precio, Imagen_URL, Categoría
 */
function normalizeItem(raw) {
  const norm = {};
  Object.keys(raw).forEach(k => {
    const key = String(k).trim();               // header original
    const val = raw[k];
    norm[key] = val;
  });

  // Asegurar claves comunes con fallback
  const nombre = norm["Nombre"] ?? norm["nombre"] ?? norm["Name"] ?? norm["name"] ?? "";
  const descripcion = norm["Descripción"] ?? norm["Descripcion"] ?? norm["descripcion"] ?? norm["Description"] ?? norm["description"] ?? "";
  const precio = (norm["Precio"] ?? norm["precio"] ?? norm["Price"] ?? norm["price"] ?? "") ;
  const imagen = norm["Imagen_URL"] ?? norm["Imagen"] ?? norm["Image"] ?? norm["image"] ?? "";
  const categoria = norm["Categoría"] ?? norm["Categoria"] ?? norm["categoria"] ?? norm["Category"] ?? norm["category"] ?? "Sin categoría";

  return {
    ...norm,
    Nombre: String(nombre),
    Descripción: String(descripcion),
    Precio: String(precio),
    Imagen_URL: String(imagen),
    Categoría: String(categoria)
  };
}

/** carga inicial */
async function init() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // data puede ser array de objetos o un wrapper; manejamos ambos
    let rawList = [];
    if (Array.isArray(data)) rawList = data;
    else if (data.productos && Array.isArray(data.productos)) rawList = data.productos;
    else if (data.length) rawList = data;
    else rawList = [];

    productos = rawList.map(item => normalizeItem(item));
    mostrarCategorias();
    mostrarProductos(productos);
  } catch (err) {
    console.error("Error al cargar productos:", err);
    document.getElementById("productos").innerHTML = "<p style='text-align:center;color:#666;padding:20px;'>Error al cargar los productos. Revisa la consola.</p>";
  }
}

/** muestra categorías detectadas */
function mostrarCategorias() {
  const cont = document.getElementById("categorias");
  categorias = Array.from(new Set(productos.map(p => p.Categoría || "Sin categoría")));
  if (!cont) return;
  if (categorias.length === 0) {
    cont.innerHTML = "";
    return;
  }
  cont.innerHTML = `<span class="categoria" onclick="mostrarTodos()">Todos</span>` + categorias
    .map(c => `<span class="categoria" onclick="filtrar('${escapeHtml(c)}')">${escapeHtml(c)}</span>`)
    .join('');
}

/** muestra todos */
function mostrarTodos() {
  mostrarProductos(productos);
}

/** render productos en grid */
function mostrarProductos(lista) {
  const cont = document.getElementById("productos");
  if (!cont) return;
  if (!Array.isArray(lista) || lista.length === 0) {
    cont.innerHTML = `<p style="text-align:center;color:#666;padding:30px;">No se encontraron productos.</p>`;
    return;
  }

  cont.innerHTML = lista.map(p => `
    <div class="card">
      <img src="${sanitizeUrl(p.Imagen_URL)}" alt="${escapeHtml(p.Nombre)}" onerror="this.src='https://via.placeholder.com/400x300?text=Sin+imagen'"/>
      <h3>${escapeHtml(p.Nombre)}</h3>
      <p>${escapeHtml(p.Descripción)}</p>
      <strong>$${escapeHtml(p.Precio)}</strong>
      <br>
      <button onclick="consultar('${encodeURIComponent(p.Nombre)}')">Consultar</button>
    </div>
  `).join('');
}

/** filtrar por categoría */
function filtrar(cat) {
  const filtrados = productos.filter(p => String(p.Categoría) === String(cat));
  mostrarProductos(filtrados);
}

/** buscar por nombre y descripción (case-insensitive) */
function buscar(term) {
  if (!term) return mostrarProductos(productos);
  const q = term.trim().toLowerCase();
  const filtrados = productos.filter(p => {
    const n = (p.Nombre || "").toString().toLowerCase();
    const d = (p.Descripción || "").toString().toLowerCase();
    return n.includes(q) || d.includes(q);
  });
  mostrarProductos(filtrados);
}

/** abrir WhatsApp con mensaje completo */
function consultar(nombreEncoded) {
  const nombre = decodeURIComponent(nombreEncoded);
  const mensaje = `Hola, quiero consultar la disponibilidad del artículo: ${nombre}`;
  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

/** util: proteger texto en HTML */
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** util: asegurar urls (evitar mapas de datos extraños) */
function sanitizeUrl(u){
  if(!u) return "";
  const s = String(u).trim();
  // si no empieza con http, devolver vacío (asume que no hay imagen pública)
  if(!/^https?:\/\//i.test(s)) return s; 
  return s;
}

/** listener del buscador (asegurar que exista DOM) */
document.addEventListener("DOMContentLoaded", () => {
  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", e => buscar(e.target.value));
  }
  // iniciar carga
  init();
});
