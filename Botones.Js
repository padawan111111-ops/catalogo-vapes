// =====================================================================
//  PANEL DE ADMINISTRACIÓN (admin.html)
//  Solo funciona con sesión iniciada. Además, las políticas RLS de
//  Supabase solo aceptan cambios del correo del administrador.
// =====================================================================

// ---------- Elementos del DOM ----------
const vistaLogin = document.getElementById("vistaLogin");
const vistaPanel = document.getElementById("vistaPanel");
const formLogin = document.getElementById("formLogin");
const mensajeLogin = document.getElementById("mensajeLogin");
const correoAdmin = document.getElementById("correoAdmin");
const btnSalir = document.getElementById("btnSalir");

const form = document.getElementById("formVapes");
const tituloForm = document.getElementById("tituloForm");
const idVape = document.getElementById("idVape");
const nombre = document.getElementById("nombre");
const descripcion = document.getElementById("descripcion");
const costo = document.getElementById("costo");
const stock = document.getElementById("stock");
const imagen = document.getElementById("imagen");
const preview = document.getElementById("preview");
const buscador = document.getElementById("buscador");
const lista = document.getElementById("listaVapes");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");

// Variable para almacenar todos los vapes
let todosLosVapes = [];

// URL de la imagen del vape que se está editando
let imagenActual = null;

// ---------- Eventos ----------
document.addEventListener("DOMContentLoaded", verificarSesion);
formLogin.addEventListener("submit", iniciarSesion);
btnSalir.addEventListener("click", cerrarSesion);
buscador.addEventListener("input", filtrarVapes);
form.addEventListener("submit", guardarVape);
btnCancelar.addEventListener("click", cancelarEdicion);
imagen.addEventListener("change", mostrarPreview);

// =====================================================================
//  MANEJO DE SESIÓN
// =====================================================================

// Revisa si ya había una sesión guardada (localStorage) para no pedir
// contraseña otra vez. Si no hay sesión, muestra el login.
async function verificarSesion() {
    const { data } = await clienteDB.auth.getSession();

    if (data.session) {
        mostrarPanel(data.session.user);
    } else {
        vistaPanel.style.display = "none";
        vistaLogin.style.display = "block";
    }
}

async function iniciarSesion(e) {
    e.preventDefault();
    mensajeLogin.textContent = "";

    const { data, error } = await clienteDB.auth.signInWithPassword({
        email: document.getElementById("correo").value.trim(),
        password: document.getElementById("password").value,
    });

    if (error) {
        mensajeLogin.textContent = "Correo o contraseña incorrectos.";
        return;
    }
    formLogin.reset();
    mostrarPanel(data.user);
}

async function cerrarSesion() {
    await clienteDB.auth.signOut();
    window.location.href = "index.html";
}

function mostrarPanel(usuario) {
    correoAdmin.textContent = usuario.email;
    vistaLogin.style.display = "none";
    vistaPanel.style.display = "block";
    cargarVapes();
}

// =====================================================================
//  R - LEER
// =====================================================================
async function cargarVapes() {
    const { data, error } = await clienteDB
        .from(TABLA)
        .select("*")
        .order("nombre");

    if (error) return console.error("Error:", error);

    todosLosVapes = data;
    filtrarVapes();
}

// Mostrar los vapes en pantalla (con botones de editar y eliminar)
function mostrarVapes(vapes) {
    lista.innerHTML = "";

    if (vapes.length === 0) {
        lista.innerHTML = '<p class="mensaje-lista">No se encontraron vapes</p>';
        return;
    }

    vapes.forEach(vape => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "vape-tarjeta" + (vape.stock > 0 ? "" : " agotado");
        tarjeta.innerHTML = `
            <div class="vape-imagen-contenedor">
                <img src="${vape.imagen || IMAGEN_DEFAULT}" alt="${escaparHTML(vape.nombre)}"
                     class="vape-imagen" loading="lazy">
            </div>
            <div class="vape-info">
                <div class="vape-nombre">${escaparHTML(vape.nombre)}</div>
                <div class="vape-precio">$${parseFloat(vape.costo).toFixed(2)}</div>
                ${etiquetaStock(vape.stock)}
                <p>${escaparHTML(vape.descripcion) || "Sin descripción"}</p>
                <div class="vape-acciones">
                    <button class="btn-editar" data-id="${vape.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${vape.id}">Eliminar</button>
                </div>
            </div>
        `;
        lista.appendChild(tarjeta);
    });

    document.querySelectorAll(".btn-editar").forEach(b =>
        b.addEventListener("click", () => editarVape(b.dataset.id)));

    document.querySelectorAll(".btn-eliminar").forEach(b =>
        b.addEventListener("click", () => eliminarVape(b.dataset.id)));
}

// Filtrar con el buscador
function filtrarVapes() {
    const texto = buscador.value.toLowerCase();
    const filtrados = todosLosVapes.filter(v =>
        v.nombre.toLowerCase().includes(texto) ||
        (v.descripcion && v.descripcion.toLowerCase().includes(texto))
    );
    mostrarVapes(filtrados);
}

// =====================================================================
//  ALMACENAMIENTO (imágenes)
// =====================================================================

// Sube la imagen al bucket y regresa su URL pública
async function subirImagen(archivo) {
    // Quitamos espacios y caracteres raros del nombre del archivo
    const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const nombreArchivo = Date.now() + "-" + nombreLimpio;

    const { error } = await clienteDB.storage
        .from(BUCKET)
        .upload(nombreArchivo, archivo);

    if (error) throw error;

    const { data } = clienteDB.storage
        .from(BUCKET)
        .getPublicUrl(nombreArchivo);

    return data.publicUrl;
}

// Borra una imagen del bucket a partir de su URL pública
async function borrarImagen(url) {
    if (!url) return;
    const ruta = url.split(`/object/public/${BUCKET}/`)[1];
    if (ruta) {
        await clienteDB.storage.from(BUCKET).remove([decodeURIComponent(ruta)]);
    }
}

// Vista previa de la imagen
function mostrarPreview() {
    const archivo = imagen.files[0];

    if (archivo) {
        preview.src = URL.createObjectURL(archivo);
        preview.style.display = "block";
    } else if (imagenActual) {
        preview.src = imagenActual;
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }
}

// =====================================================================
//  C y U - GUARDAR (crear o editar)
// =====================================================================
async function guardarVape(e) {
    e.preventDefault();

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";

    try {
        // Si eligió una imagen nueva la subimos, si no dejamos la que ya tenía
        let urlImagen = imagenActual;
        const archivo = imagen.files[0];

        if (archivo) {
            urlImagen = await subirImagen(archivo);
        }

        const datos = {
            nombre: nombre.value.trim(),
            descripcion: descripcion.value.trim() || null,
            costo: parseFloat(costo.value),
            stock: parseInt(stock.value, 10),
            imagen: urlImagen,
        };

        if (idVape.value) {
            // ---- UPDATE ----
            const { error } = await clienteDB
                .from(TABLA)
                .update(datos)
                .eq("id", idVape.value);
            if (error) throw error;

            // Si se cambió la imagen, borramos la anterior del bucket
            if (archivo && imagenActual) await borrarImagen(imagenActual);
        } else {
            // ---- INSERT ----
            const { error } = await clienteDB
                .from(TABLA)
                .insert([datos]);
            if (error) throw error;
        }

        cancelarEdicion();
        cargarVapes();
    } catch (error) {
        alert("Error al guardar: " + traducirError(error));
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Guardar Vape";
    }
}

// =====================================================================
//  U - Preparar formulario para editar
// =====================================================================
async function editarVape(id) {
    const { data, error } = await clienteDB
        .from(TABLA)
        .select("*")
        .eq("id", id)
        .single();

    if (error) return alert("Error al cargar el vape: " + error.message);

    idVape.value = data.id;
    nombre.value = data.nombre;
    descripcion.value = data.descripcion || "";
    costo.value = data.costo;
    stock.value = data.stock ?? 0;
    imagenActual = data.imagen; // no se puede poner texto en un input file
    mostrarPreview();

    tituloForm.textContent = "Editando: " + data.nombre;
    btnCancelar.style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Cancelar edición / limpiar formulario
function cancelarEdicion() {
    form.reset();
    idVape.value = "";
    imagenActual = null;
    mostrarPreview();
    tituloForm.textContent = "Datos del Vape";
    btnCancelar.style.display = "none";
}

// =====================================================================
//  D - ELIMINAR
// =====================================================================
async function eliminarVape(id) {
    if (!confirm("¿Seguro que quieres eliminar este vape?")) return;

    const vape = todosLosVapes.find(v => String(v.id) === String(id));

    const { error } = await clienteDB
        .from(TABLA)
        .delete()
        .eq("id", id);

    if (error) return alert("Error al eliminar: " + traducirError(error));

    await borrarImagen(vape && vape.imagen);
    cargarVapes();
}

// Mensajes de error más claros
function traducirError(error) {
    const msg = error.message || String(error);
    if (msg.includes("row-level security") || msg.includes("Unauthorized")) {
        return "No tienes permiso para modificar el catálogo.";
    }
    if (msg.includes("stock_check")) return "El stock no puede ser negativo.";
    return msg;
}
