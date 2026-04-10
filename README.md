# Notas Escolares — Node.js + SQLite (sql.js)

Sistema de gestión de notas. **Sin compilación nativa** — funciona en Windows sin Visual Studio.

## Instalación

```bash
npm install
npm run dev      # desarrollo con recarga automática
npm start        # producción
```

Luego abre: **http://localhost:3000**

## Estructura

```
notas-node/
├── src/
│   ├── server.js
│   ├── db/database.js       ← SQLite con sql.js (puro JS)
│   └── routes/
│       ├── profesores.js
│       ├── cursos.js
│       ├── alumnos.js
│       ├── asignaturas.js
│       └── notas.js
├── public/
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── views.js
│   │   └── modals.js
│   └── assets/logo.svg
├── data/
│   └── notas.db             ← Se crea automáticamente
└── package.json
```

## Por qué sql.js en vez de better-sqlite3

`better-sqlite3` requiere compilar código C++ (node-gyp + Visual Studio en Windows).
`sql.js` es SQLite compilado a WebAssembly — funciona sin herramientas de compilación.
La BD se guarda igualmente en un archivo `.db` en disco.

## API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | /api/notas/stats       | KPIs del dashboard |
| GET    | /api/notas?curso_id=   | Listar notas con filtros |
| POST   | /api/notas             | Crear nota |
| PUT    | /api/notas/:id         | Editar nota |
| DELETE | /api/notas/:id         | Eliminar nota |
| GET/POST/PUT/DELETE | /api/alumnos | CRUD alumnos |
| GET    | /api/alumnos/:id/promedio | Promedio personal |
| GET/POST/PUT/DELETE | /api/cursos | CRUD cursos |
| GET/POST/PUT/DELETE | /api/profesores | CRUD profesores |
| GET/POST/PUT/DELETE | /api/asignaturas | CRUD asignaturas |

## Ver la BD

Usa [DB Browser for SQLite](https://sqlitebrowser.org) para abrir `data/notas.db`.
