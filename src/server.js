// src/server.js — Punto de entrada del servidor
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── Rutas API ─────────────────────────────────────────────────────────────────
app.use('/api/profesores',  require('./routes/profesores'));
app.use('/api/cursos',      require('./routes/cursos'));
app.use('/api/alumnos',     require('./routes/alumnos'));
app.use('/api/asignaturas', require('./routes/asignaturas'));
app.use('/api/notas',       require('./routes/notas'));
app.use('/api/boletin',     require('./routes/boletin'));
app.use('/api/exportar',    require('./routes/exportar'));   // ← nueva ruta

// ── SPA fallback: sirve index.html para cualquier ruta no-API ─────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Iniciar ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`  API disponible en http://localhost:${PORT}/api`);
});
