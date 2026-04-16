const router = require('express').Router();
const { getDb, query } = require('../db/database');

router.get('/:alumno_id', async (req, res) => {
  try {
    const db = await getDb();
    const { alumno_id } = req.params;

    const alumnoRows = await query(
      db,
      `
      SELECT a.*, c.nombre AS curso_nombre, c.anio
      FROM alumnos a
      LEFT JOIN cursos c ON a.curso_id = c.id
      WHERE a.id = $1
      `,
      [alumno_id]
    );

    const alumno = alumnoRows[0];
    if (!alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    const notas = await query(
      db,
      `
      SELECT
        n.valor,
        n.tipo,
        n.fecha,
        s.id AS asig_id,
        s.nombre AS asig_nombre,
        p.nombres || ' ' || p.apellidos AS prof_nombre
      FROM notas n
      JOIN asignaturas s ON n.asig_id = s.id
      LEFT JOIN profesores p ON n.prof_id = p.id
      WHERE n.alumno_id = $1
      ORDER BY s.nombre, n.fecha
      `,
      [alumno_id]
    );

    const asigMap = {};
    for (const n of notas) {
      if (!asigMap[n.asig_id]) {
        asigMap[n.asig_id] = {
          nombre: n.asig_nombre,
          profesor: n.prof_nombre || '—',
          notas: []
        };
      }

      asigMap[n.asig_id].notas.push({
        valor: parseFloat(n.valor),
        tipo: n.tipo,
        fecha: n.fecha
      });
    }

    const asignaturas = Object.values(asigMap).map(a => {
      const sum = a.notas.reduce((acc, n) => acc + n.valor, 0);
      const promedio = a.notas.length ? +(sum / a.notas.length).toFixed(1) : null;
      return { ...a, promedio };
    });

    const promedios = asignaturas
      .filter(a => a.promedio !== null)
      .map(a => a.promedio);

    const promedioGeneral = promedios.length
      ? +(promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(1)
      : null;

    res.json({ alumno, asignaturas, promedioGeneral });
  } catch (error) {
    console.error('Error generando boletín:', error);
    res.status(500).json({ error: 'Error generando boletín' });
  }
});

module.exports = router;