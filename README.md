Catálogo de Vapes

Catálogo web con panel de administración, hecho con HTML, CSS y JavaScript y Supabase como back end.

🔗 Ver en línea: https://padawan111111-ops.github.io/catalogo-vapes/

Características
Catálogo público: los clientes pueden ver los productos, su precio y disponibilidad, buscar por nombre y filtrar solo los disponibles.
Panel de administración (admin.html) con inicio de sesión: agregar, editar y eliminar productos, subir imágenes y controlar el stock.
Stock con indicadores: disponible, últimas piezas y agotado.
Diseño responsivo: se adapta a computadora, tablet y celular.
Seguridad con RLS (Row Level Security): cualquiera puede leer el catálogo, pero solo la cuenta del administrador puede modificarlo.
Tecnologías
HTML5, CSS3 (Grid, Flexbox, media queries)
JavaScript (async / await)
Supabase: base de datos PostgreSQL, Auth y Storage
Estructura
├── index.html      → catálogo público
├── admin.html      → panel de administración
├── CSS/vapes.css   → estilos
└── JS/
    ├── conexion.js → conexión con Supabase
    ├── catalogo.js → lógica del catálogo público
    └── Botones.Js  → lógica del panel (CRUD + sesión)
Autor

Jaime Jared González García Universidad Tecnológica de Izúcar de Matamoros Tecnologías de la Información e Innovación Digital
