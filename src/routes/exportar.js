// src/routes/exportar.js — Exportación de notas a CSV
const router = require('express').Router();
const { getDb, query } = require('../db/database');

// GET /api/exportar/notas.csv?curso_id=&asig_id=
router.get('/notas.csv', async (req, res) => {
  const db = await getDb();
  let sql = `
    SELECT
      a.apellidos || ', ' || a.nombres   AS alumno,
      a.rut                              AS rut,
      c.nombre                           AS curso,
      s.nombre                           AS asignatura,
      n.tipo,
      n.valor                            AS nota,
      n.fecha,
      p.nombres || ' ' || p.apellidos   AS profesor,
      n.obs                              AS observacion
    FROM notas n
    JOIN alumnos     a ON n.alumno_id = a.id
    JOIN cursos      c ON a.curso_id  = c.id
    JOIN asignaturas s ON n.asig_id   = s.id
    LEFT JOIN profesores p ON n.prof_id = p.id
    WHERE 1=1`;

  const params = [];
  if (req.query.curso_id) { sql += ' AND a.curso_id = ?';  params.push(req.query.curso_id); }
  if (req.query.asig_id)  { sql += ' AND n.asig_id  = ?';  params.push(req.query.asig_id);  }
  sql += ' ORDER BY c.nombre, a.apellidos, s.nombre, n.fecha';

  const rows = query(db, sql, params);

  // Construir CSV
  const headers = ['Alumno','RUT','Curso','Asignatura','Tipo','Nota','Fecha','Profesor','Observación'];
  const csvRows = [headers.join(',')];

  for (const r of rows) {
    const row = [
      `"${r.alumno  || ''}"`,
      `"${r.rut     || ''}"`,
      `"${r.curso   || ''}"`,
      `"${r.asignatura || ''}"`,
      `"${r.tipo    || ''}"`,
      r.nota,
      `"${r.fecha   || ''}"`,
      `"${r.profesor || ''}"`,
      `"${(r.observacion || '').replace(/"/g,'""')}"`,
    ];
    csvRows.push(row.join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="notas.csv"');
  res.send('\uFEFF' + csvRows.join('\r\n'));  // BOM para Excel en Windows
});

// GET /api/exportar/promedios.csv
router.get('/promedios.csv', async (req, res) => {
  const db = await getDb();
  const rows = query(db, `
    SELECT
      a.apellidos || ', ' || a.nombres AS alumno,
      a.rut,
      c.nombre AS curso,
      s.nombre AS asignatura,
      ROUND(AVG(n.valor), 2)   AS promedio,
      COUNT(n.id)              AS cantidad_notas,
      CASE WHEN AVG(n.valor) >= 4.0 THEN 'Aprobado' ELSE 'Reprobado' END AS estado
    FROM notas n
    JOIN alumnos     a ON n.alumno_id = a.id
    JOIN cursos      c ON a.curso_id  = c.id
    JOIN asignaturas s ON n.asig_id   = s.id
    GROUP BY a.id, s.id
    ORDER BY c.nombre, a.apellidos, s.nombre`);

  const headers = ['Alumno','RUT','Curso','Asignatura','Promedio','Cantidad Notas','Estado'];
  const csvRows = [headers.join(',')];
  for (const r of rows) {
    csvRows.push([
      `"${r.alumno}"`, `"${r.rut||''}"`, `"${r.curso}"`,
      `"${r.asignatura}"`, r.promedio, r.cantidad_notas, `"${r.estado}"`
    ].join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="promedios.csv"');
  res.send('\uFEFF' + csvRows.join('\r\n'));
});

module.exports = router;
