require('dotenv').config();



const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initPg } = require('./db/database');

const app  = express();
const PORT = process.env.PORT || 3000;

const reportesRoutes = require("./routes/reportes");
app.use("/api/reportes", reportesRoutes);



app.use("/api/reportes", reportesRoutes);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/profesores',  require('./routes/profesores'));
app.use('/api/cursos',      require('./routes/cursos'));
app.use('/api/alumnos',     require('./routes/alumnos'));
app.use('/api/asignaturas', require('./routes/asignaturas'));
app.use('/api/notas',       require('./routes/notas'));
app.use('/api/boletin',     require('./routes/boletin'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

async function start() {
  try {
    await initPg();
    console.log('✓ Base de datos lista');
  } catch (err) {
    console.error('✗ Error iniciando base de datos:', err.message);
    process.exit(1); // ← si falla, el servidor no arranca
  }

  app.listen(PORT, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`  API disponible en http://localhost:${PORT}/api`);
  });
}

start();