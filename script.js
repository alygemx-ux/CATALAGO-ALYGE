const API_URL = "https://script.google.com/macros/s/AKfycbwScqdIrqYxmcZMLcw5CyulNxeMCV90gPfqdhJqNnj9udL8il10H20SyLbWcgysPYJR/exec";
const NUMERO_WHATSAPP = "5213318192003";

let productos = [];
let categorias = [];

// Normalizar datos
function normalizeItem(raw) {
  const norm = {};
  Object.keys(raw).forEach(k => {
    const key = String(k).trim();
    norm[key] = raw[k];
  });

  return {
    ...norm,
    Nombre: norm["Nombre"] ?? "",
    Descripción: norm["Descripción"] ?? "",
    Precio: norm["Precio"] ?? "",
    Imagen_URL: norm["Imagen_URL"] ?? "",
    Imagen_URL_2: norm["Imagen_URL_2"] ?? "",
    Categoría: norm["Categoría"] ?? "Sin categoría"
  };
}

async function init() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    let rawList = Array.isArray(data) ? data : (data.productos || []);
    productos = rawList.map(item => normalizeItem(item));
    mostrarCategorias();
    mostrarProductos(productos);
  } catch (err) {
    console.error("Error al cargar productos:", err);
    document.getElementById("productos").innerHTML = "<p style='text-align:center;color:#666;padding:20px;'>Error al cargar los productos.</p>";
  }
}

function mostrarCategorias() {
  const cont = document.getElementById("categorias");
  categorias = Array.from(new Set(productos.map(p => p.Categoría)));
  cont.innerHTML = `<span class="categoria" onclick="mostrarTodos()">Todos</span>` +
    categorias.map(c => `<span class="categoria" onclick="filtrar('${escapeHtml(c)}')">${escapeHtml(c)}</span>`).join('');
}

function mostrarTodos() {
  mostrarProductos(productos);
}

function mostrarProductos(lista) {
  const cont = document.getElementById("productos");
  if (!lista || lista.length === 0) {
    cont.innerHTML = `<p style="text-align:center;color:#666;padding:30px;">No se encontraron productos.</p>`;
    return;
  }

  cont.innerHTML = lista.map(p => `
    <div class="card">
      <div class="img-container">
        <img class="img1" src="${sanitizeUrl(p.Imagen_URL)}" alt="${escapeHtml(p.Nombre)}" onerror="this.src='https://via.placeholder.com/400x300?text=Sin+imagen'"/>
        ${p.Imagen_URL_2 ? `<img class="img2" src="${sanitizeUrl(p.Imagen_URL_2)}" alt="${escapeHtml(p.Nombre)}" onerror="this.style.display='none'"/>` : ""}
      </div>
      <h3>${escapeHtml(p.Nombre)}</h3>
      <p>${escapeHtml(p.Descripción)}</p>
      <strong>$${escapeHtml(p.Precio)}</strong>
      <br>
      <button onclick="consultar('${encodeURIComponent(p.Nombre)}')">Consultar</button>
    </div>
  `).join('');
}

function filtrar(cat) {
  const filtrados = productos.filter(p => p.Categoría === cat);
  mostrarProductos(filtrados);
}

function buscar(term) {
  if (!term) return mostrarProductos(productos);
  const q = term.trim().toLowerCase();
  const filtrados = productos.filter(p =>
    (p.Nombre || "").toLowerCase().includes(q) ||
    (p.Descripción || "").toLowerCase().includes(q)
  );
  mostrarProductos(filtrados);
}

function consultar(nombreEncoded) {
  const nombre = decodeURIComponent(nombreEncoded);
  const mensaje = `Hola, quiero consultar la disponibilidad del artículo: ${nombre}`;
  window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`, "_blank");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!/^https?:\/\//i.test(s)) return "";
  return s;
}

document.addEventListener("DOMContentLoaded", () => {
  const buscador = document.getElementById("buscador");
  if (buscador) buscador.addEventListener("input", e => buscar(e.target.value));
  init();
});
