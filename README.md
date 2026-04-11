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

## Seguridad aplicada

- API con `helmet` para headers HTTP defensivos.
- `x-powered-by` deshabilitado.
- CORS restringido por allowlist con `CORS_ALLOWED_ORIGINS`.
- Sesiones por cookie `HttpOnly` firmadas en backend.
- Contraseñas hash con `scrypt` en lugar de texto plano.
- Rate limiting global y reforzado para cargas e importaciones.
- Limites configurables para `JSON` y formularios.
- Variables criticas validadas al arrancar en produccion.
- `.gitignore` ampliado para evitar publicar secretos y artefactos.

## Deploy en Render

El repositorio ya incluye `render.yaml` para desplegar:

- `copmec-api`: servicio web Node/Express.
- `copmec-web`: sitio estatico de Vite.
- `copmec-db`: base de datos PostgreSQL administrada por Render.

Pasos recomendados:

1. Crea el blueprint desde este repositorio en Render.
2. Configura en `copmec-api` las variables sensibles:
  - `CORS_ALLOWED_ORIGINS`
  - `MASTER_PASSWORD`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` o `CLOUDINARY_URL`
3. `DATABASE_URL` queda conectado automaticamente desde `copmec-db` dentro del blueprint.
4. `SESSION_SECRET` se genera automaticamente en Render por el blueprint.
5. Configura en `copmec-web` la variable `VITE_API_BASE_URL` o `VITE_API_URL` con la URL publica real del backend.
6. Despliega primero el backend y luego el frontend.

Variables adicionales disponibles:

- `JSON_BODY_LIMIT`
- `URLENCODED_BODY_LIMIT`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_UPLOAD_MAX_REQUESTS`
- `SESSION_COOKIE_NAME`
- `SESSION_TTL_SECONDS`
- `MASTER_USERNAME`
- `MASTER_PASSWORD`

## Render y SPA

El frontend incluye `_redirects` para que las rutas del cliente React funcionen correctamente en Render Static Sites.

## Variables de frontend

- Usa [frontend/.env.example](frontend/.env.example) como base local para `VITE_API_URL`.

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
