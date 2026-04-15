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

- `npm run dev`: levanta frontend y backend con verificacion de puertos fijos (`5173` y `4000`) y reutiliza servicios ya encendidos
- `npm run dev:raw`: levanta frontend y backend en paralelo sin verificaciones extra
- `npm run preview --prefix frontend`: usa tambien el puerto fijo `5173`; si ese puerto esta ocupado, Vite falla en vez de saltar a otro
- `npm run status`: muestra el estado sincronizado de frontend (`5173`), backend (`4000`) y PostgreSQL local (`5432`)
- `npm run stop`: detiene frontend y backend; deja PostgreSQL local intacto porque es una dependencia externa del entorno local
- `npm run stop:all`: intenta detener frontend, backend y PostgreSQL local; detener PostgreSQL puede requerir una terminal con permisos de administrador
- `npm run build`: construye frontend
- `npm run start`: ejecuta backend en modo produccion

## Arranque local

- `iniciar_copmec.bat`: inicia COPMEC desde Windows con el mismo flujo estable de `npm run dev`
- Frontend local: `http://localhost:5173/`
- Backend local: `http://localhost:4000/api/health`
- En desarrollo local solo deben existir esos dos puertos de app: `5173` para frontend y `4000` para backend
- PostgreSQL local: `5432` como servicio de Windows separado del runner de desarrollo

## Render

- Render no usa estos scripts locales de orquestacion.
- `copmec-api` se despliega desde `backend/` con `npm start` segun [render.yaml](C:\Users\alexx\Desktop\COPMEC\render.yaml) y durante el build tambien compila el frontend de `frontend/`.
- El frontend queda servido por Express desde la misma URL publica del backend.
- El disco persistente debe montarse en `/var/data` para conservar `warehouse-state.json` y `security-events.log` entre deploys.
- La base en Render es `copmec-db`, administrada por Render y separada del PostgreSQL local en `5432`.

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

- `copmec-api`: servicio web Node/Express que tambien sirve el frontend compilado.
- `copmec-db`: base de datos PostgreSQL administrada por Render.

Pasos recomendados:

1. Crea el blueprint desde este repositorio en Render.
2. Configura en `copmec-api` las variables sensibles:
  - `CORS_ALLOWED_ORIGINS`
  - `MASTER_PASSWORD`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` o `CLOUDINARY_URL`
3. `DATABASE_URL` queda conectado automaticamente desde `copmec-db` dentro del blueprint.
4. `SESSION_SECRET` se genera automaticamente en Render por el blueprint.
5. Agrega un disco persistente al servicio web y montalo en `/var/data`.
6. Despliega el servicio web; el frontend quedara disponible en la raiz `/` y la API en `/api`.

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

## Variables de frontend

- En local puedes definir `VITE_API_URL` o `VITE_API_BASE_URL` en tu archivo `.env` dentro de `frontend/` si quieres apuntar a otra API distinta de `localhost:4000`.

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
