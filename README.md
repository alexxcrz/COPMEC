# COPMEC

Plataforma de gestion de datos relacionales y multimedia para reemplazar multiples archivos Excel por tableros inteligentes conectados.

## Stack

- Frontend: React (Vite) + Tailwind CSS + Lucide React
- Backend: Node.js + Express
- ORM/DB: Prisma + PostgreSQL
- Archivos: Cloudinary (proxima fase)
- Despliegue: Render-ready (scripts base incluidos)

## Estructura

- `frontend/`: aplicacion cliente React
- `backend/`: API Express + Prisma schema
- `.github/copilot-instructions.md`: lineamientos del workspace

## Convencion de archivos

- Frontend modular: cada vista/componente en su propio archivo JSX.
- CSS por componente/pagina: cada JSX tiene su archivo CSS dedicado.
- Excepcion modal: estilos compartidos en un CSS global de modales.
- Backend por capas: rutas, controladores, servicios, middleware y config en archivos separados.

## Scripts raiz

- `npm run dev`: levanta frontend y backend en paralelo
- `npm run build`: construye frontend
- `npm run start`: ejecuta backend en modo produccion

## Estado por fases

- Fase 1: completada
  - Monorepo inicializado
  - Prisma schema dinamico definido (Boards, Columns, Rows, Cells)
  - Estructura de carpetas frontend/backend preparada
- Fase 2: completada
  - Cloudinary routes + upload flow
- Fase 3: completada
  - Smart Grid React modular con celdas separadas por tipo
  - Edicion inline con autoguardado optimista
  - Preview modal para imagenes y PDF
  - Footer con suma, resta y promedio para columnas numericas
  - Fila resaltada cuando checkbox esta activo
  - Filas infinitas (auto y boton manual)
- Fase 4: pendiente
  - completada
  - Importador xlsx/csv con creacion automatica de tablero
  - Persistencia real en PostgreSQL via Prisma
  - Creacion de filas persistida para grid infinito
  - Carga de tablero importado en la pestaña Tablero
  - Buscador global en tiempo real por cualquier valor del tablero actual
