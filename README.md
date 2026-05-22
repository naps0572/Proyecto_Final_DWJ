# Sistema de Gestión de Tickets de Soporte

Aplicación full stack para gestionar tickets de mesa de ayuda. Incluye autenticación con JWT, roles operativos, seguimiento de estados, prioridades, SLA, comentarios y administración básica de usuarios.

## Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM
- SQLite para desarrollo
- React + Vite
- npm workspaces

## Estructura

```text
.
├── backend/          API REST, Prisma y lógica de negocio
├── frontend/         Aplicación React + Vite
├── package.json      Scripts raíz y workspaces
├── package-lock.json Versiones bloqueadas de dependencias
└── README.md
```

## Funcionalidades

- Registro e inicio de sesión con JWT.
- Roles `USER` y `TECHNICIAN`.
- Creación, listado y detalle de tickets.
- Cambio de estado, prioridad, impacto y urgencia para técnicos.
- Cálculo básico de prioridad y fechas SLA.
- Comentarios por ticket.
- Bitácora de eventos del ticket.
- Gestión de categorías.
- Administración de usuarios para técnicos.
- Tema claro/oscuro/sistema.

## Requisitos

- Node.js 20 o superior recomendado.
- npm 10 o superior recomendado.

## Configuración Local

Instala las dependencias desde la raíz del proyecto:

```bash
npm install
```

Crea los archivos de entorno:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

En Windows PowerShell, si `cp` no está disponible:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Genera Prisma, sincroniza la base de datos y carga datos de prueba:

```bash
npm run prisma:generate --workspace backend
npm run prisma:push --workspace backend
npm run prisma:seed --workspace backend
```

Levanta backend y frontend:

```bash
npm run dev
```

URLs locales:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Healthcheck: `http://localhost:4000/api/health`

## Credenciales de Prueba

Después de ejecutar el seed:

Técnico:

```text
Email: tech@demo.com
Password: 123456
```

Usuario:

```text
Email: user@demo.com
Password: 123456
```

## Scripts

Desde la raíz:

```bash
npm run dev
npm run build
npm start
```

Backend:

```bash
npm run dev --workspace backend
npm run build --workspace backend
npm run start --workspace backend
npm run prisma:generate --workspace backend
npm run prisma:push --workspace backend
npm run prisma:seed --workspace backend
```

Frontend:

```bash
npm run dev --workspace frontend
npm run build --workspace frontend
npm run preview --workspace frontend
```

## Variables de Entorno

Backend (`backend/.env`):

```bash
NODE_ENV=development
DATABASE_URL="file:./dev.db"
PORT=4000
JWT_SECRET="replace_with_a_secret_of_at_least_32_characters"
FRONTEND_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173"
JSON_BODY_LIMIT="100kb"
TRUST_PROXY=false
```

Frontend (`frontend/.env`):

```bash
VITE_API_URL="http://localhost:4000/api"
```

Para producción, cambia `NODE_ENV`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ORIGINS` y `VITE_API_URL` según tu dominio real. No uses valores de `localhost` en producción.

## Build de Producción

```bash
npm install
npm run prisma:generate --workspace backend
npm run prisma:push --workspace backend
npm run build
npm start
```

El backend compilado queda en:

```text
backend/dist/
```

El frontend compilado queda en:

```text
frontend/dist/
```

Puedes desplegar `frontend/dist` en un hosting estático y ejecutar el backend como API Node.js.

## Recomendaciones Para Producción

- Usa un `JWT_SECRET` largo, privado y distinto al del ejemplo.
- Configura `CORS_ORIGINS` únicamente con los dominios permitidos.
- Usa HTTPS.
- Si despliegas detrás de proxy/load balancer, usa `TRUST_PROXY=true`.
- Para datos persistentes reales, migra Prisma a PostgreSQL u otra base gestionada.
- No ejecutes el seed con credenciales de demo en producción.

## Endpoints Principales

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Categorías

- `GET /api/categories`
- `POST /api/categories` solo `TECHNICIAN`

### Tickets

- `GET /api/tickets`
- `GET /api/tickets/:id`
- `POST /api/tickets`
- `PATCH /api/tickets/:id` solo `TECHNICIAN`
- `POST /api/tickets/:id/comments`

### Usuarios

- `GET /api/users` solo `TECHNICIAN`
- `POST /api/users` solo `TECHNICIAN`
- `PATCH /api/users/:id` solo `TECHNICIAN`

## Antes de Subir al Repositorio

Verifica que estos archivos y carpetas no se suban:

```text
node_modules/
backend/node_modules/
frontend/node_modules/
backend/.env
frontend/.env
backend/prisma/dev.db
backend/prisma/dev.db-*
*.log
*.tsbuildinfo
```

La configuración actual de `.gitignore` ya cubre estos casos. Sube los `.env.example`, no los `.env` reales.

Checklist recomendado:

```bash
npm run build
```

Luego revisa que el repositorio incluya principalmente:

```text
backend/
frontend/
package.json
package-lock.json
.gitignore
README.md
```

## Entrega Final

- Proyecto desplegado: https://soporte-desk-nestor.netlify.app
- Repositorio publico indicado en el documento: https://github.com/naps0572/DW_J_Corte_02
- Documento PDF: `Documento_Entrega_SoporteDesk.pdf`
- Comando de verificacion: `npm run build`

El despliegue en Netlify usa `frontend/dist` y esta configurado en `netlify.toml`.
Cuando `VITE_API_URL` no esta definida, el frontend activa un modo demo con `localStorage`
para que la evaluacion externa pueda probar login, tickets, comentarios y gestion tecnica
desde la URL publicada. Para ejecucion full stack local se debe usar el backend Express con
Prisma siguiendo la configuracion de entorno descrita arriba.
