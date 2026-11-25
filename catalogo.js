// =====================================================================
//  CATÁLOGO PÚBLICO (index.html)
//  Solo LEE de la base de datos. No tiene botones de editar ni eliminar,
//  y aunque alguien lo intentara desde la consola, las políticas RLS
//  de Supabase lo bloquean.
// =====================================================================

const buscador = document.getElementById("buscador");
const soloDisponibles = document.getElementById("soloDisponibles");
const lista = document.getElementById("listaVapes");

let todosLosVapes = [];

document.addEventListener("DOMContentLoaded", cargarVapes);
buscador.addEventListener("input", filtrarVapes);
soloDisponibles.addEventListener("change", filtrarVapes);

// Petición a la BD: traer todos los vapes ordenados por nombre
async function cargarVapes() {
    try {
        const { data, error } = await clienteDB
            .from(TABLA)
            .select("*")
            .order("nombre");

        if (error) throw error;

        todosLosVapes = data;
        filtrarVapes();
    } catch (error) {
        console.error("Error:", error);
        lista.innerHTML = '<p class="mensaje-lista">No se pudo cargar el catálogo. Intenta más tarde.</p>';
    }
}

// Buscador + filtro de disponibles
function filtrarVapes() {
    const texto = buscador.value.toLowerCase();

    const filtrados = todosLosVapes.filter(v => {
        const coincide =
            v.nombre.toLowerCase().includes(texto) ||
            (v.descripcion && v.descripcion.toLowerCase().includes(texto));
        const disponible = !soloDisponibles.checked || v.stock > 0;
        return coincide && disponible;
    });

    mostrarVapes(filtrados);
}

// Dibuja las tarjetas (sin botones de edición)
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
            </div>
        `;
        lista.appendChild(tarjeta);
    });
}
