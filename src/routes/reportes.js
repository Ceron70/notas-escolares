const express = require("express");
const router = express.Router();
const db = require("../db/database");

router.get("/rendimiento-asignaturas", async (req, res) => {
  const sql = `
    SELECT
      a.id AS asignatura_id,
      a.nombre AS asignatura,
      COUNT(n.id) AS cantidad_notas,
      COALESCE(ROUND(AVG(n.valor)::numeric, 2), 0) AS promedio,
      COALESCE(MIN(n.valor), 0) AS nota_minima,
      COALESCE(MAX(n.valor), 0) AS nota_maxima,
      SUM(CASE WHEN n.valor >= 4.0 THEN 1 ELSE 0 END) AS aprobados,
      SUM(CASE WHEN n.valor < 4.0 THEN 1 ELSE 0 END) AS reprobados,
      COALESCE(
        ROUND(
          (
            SUM(CASE WHEN n.valor >= 4.0 THEN 1 ELSE 0 END) * 100.0
            / NULLIF(COUNT(n.id), 0)
          )::numeric,
          2
        ),
        0
      ) AS porcentaje_aprobacion,
      COALESCE(
        ROUND(
          (
            SUM(CASE WHEN n.valor < 4.0 THEN 1 ELSE 0 END) * 100.0
            / NULLIF(COUNT(n.id), 0)
          )::numeric,
          2
        ),
        0
      ) AS porcentaje_reprobacion
    FROM public.notas n
    INNER JOIN public.asignaturas a
      ON n.asig_id = a.id
    GROUP BY a.id, a.nombre
    ORDER BY promedio DESC, a.nombre ASC
  `;

  try {
    const conn = await db.getDb();
    const rows = await db.query(conn, sql, []);
    res.json({ ok: true, total: rows.length, data: rows });
  } catch (error) {
    console.error("Error al obtener rendimiento por asignatura:", error);
    res.status(500).json({ ok: false, error: "Error al generar el informe de rendimiento por asignatura", detalle: error.message });
  }
});

router.get("/ranking-cursos", async (req, res) => {
  const sql = `
    SELECT
      c.id AS curso_id,
      c.nombre AS curso,
      c.nivel,
      c.anio,
      COUNT(DISTINCT al.id) AS total_alumnos,
      COUNT(n.id) AS total_notas,
      COALESCE(ROUND(AVG(n.valor)::numeric, 2), 0) AS promedio_general,
      COALESCE(MIN(n.valor), 0) AS nota_minima,
      COALESCE(MAX(n.valor), 0) AS nota_maxima,
      SUM(CASE WHEN n.valor >= 4.0 THEN 1 ELSE 0 END) AS aprobados,
      SUM(CASE WHEN n.valor < 4.0 THEN 1 ELSE 0 END) AS reprobados,
      COUNT(DISTINCT CASE WHEN al2.promedio < 4.0 THEN al2.alumno_id END) AS alumnos_criticos
    FROM public.cursos c
    LEFT JOIN public.alumnos al
      ON al.curso_id = c.id AND al.estado = 'Activo'
    LEFT JOIN public.notas n
      ON n.alumno_id = al.id
    LEFT JOIN (
      SELECT alumno_id, AVG(valor) AS promedio
      FROM public.notas
      GROUP BY alumno_id
    ) al2 ON al2.alumno_id = al.id
    GROUP BY c.id, c.nombre, c.nivel, c.anio
    ORDER BY promedio_general DESC, c.nombre ASC
  `;

  try {
    const conn = await db.getDb();
    const rows = await db.query(conn, sql, []);
    res.json({ ok: true, total: rows.length, data: rows });
  } catch (error) {
    console.error("Error al obtener ranking de cursos:", error);
    res.status(500).json({ ok: false, error: "Error al generar el ranking por curso", detalle: error.message });
  }
});

// ── NUEVOS ENDPOINTS ─────────────────────────────────────────

router.get("/top-alumnos", async (req, res) => {
  const limite = parseInt(req.query.limite) || 10;
  const sql = `
    SELECT
      al.id AS alumno_id,
      al.nombres || ' ' || al.apellidos AS alumno,
      al.rut,
      c.nombre AS curso,
      COUNT(n.id) AS total_evaluaciones,
      ROUND(AVG(n.valor)::numeric, 2) AS promedio,
      MIN(n.valor) AS nota_minima,
      MAX(n.valor) AS nota_maxima,
      SUM(CASE WHEN n.valor >= 4.0 THEN 1 ELSE 0 END) AS aprobadas,
      SUM(CASE WHEN n.valor < 4.0 THEN 1 ELSE 0 END) AS reprobadas
    FROM public.alumnos al
    JOIN public.cursos c ON al.curso_id = c.id
    JOIN public.notas n ON n.alumno_id = al.id
    WHERE al.estado = 'Activo'
    GROUP BY al.id, al.nombres, al.apellidos, al.rut, c.nombre
    HAVING COUNT(n.id) > 0
    ORDER BY promedio DESC, total_evaluaciones DESC
    LIMIT $1
  `;

  try {
    const conn = await db.getDb();
    const rows = await db.query(conn, sql, [limite]);
    res.json({ ok: true, total: rows.length, data: rows });
  } catch (error) {
    console.error("Error al obtener top alumnos:", error);
    res.status(500).json({ ok: false, error: "Error al generar top alumnos", detalle: error.message });
  }
});

router.get("/historial/:alumno_id", async (req, res) => {
  const sql = `
    SELECT
      n.id,
      n.valor,
      n.tipo,
      n.fecha,
      n.obs,
      s.nombre AS asignatura,
      p.nombres || ' ' || p.apellidos AS profesor,
      al.nombres || ' ' || al.apellidos AS alumno,
      al.rut,
      c.nombre AS curso
    FROM public.notas n
    JOIN public.asignaturas s ON n.asig_id = s.id
    JOIN public.alumnos al ON n.alumno_id = al.id
    JOIN public.cursos c ON al.curso_id = c.id
    LEFT JOIN public.profesores p ON n.prof_id = p.id
    WHERE n.alumno_id = $1
    ORDER BY n.fecha DESC, n.id DESC
  `;

  try {
    const conn = await db.getDb();
    const rows = await db.query(conn, sql, [req.params.alumno_id]);
    if (!rows.length) return res.json({ ok: true, total: 0, alumno: null, data: [] });

    const { alumno, rut, curso } = rows[0];
    res.json({ ok: true, total: rows.length, alumno, rut, curso, data: rows });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ ok: false, error: "Error al obtener historial del alumno", detalle: error.message });
  }
});

router.get("/profesores-activos", async (req, res) => {
  const sql = `
    SELECT
      p.id AS profesor_id,
      p.nombres || ' ' || p.apellidos AS profesor,
      p.email,
      COUNT(n.id) AS total_evaluaciones,
      COUNT(DISTINCT n.alumno_id) AS alumnos_evaluados,
      COUNT(DISTINCT n.asig_id) AS asignaturas,
      ROUND(AVG(n.valor)::numeric, 2) AS promedio_notas,
      MAX(n.fecha) AS ultima_evaluacion
    FROM public.profesores p
    JOIN public.notas n ON n.prof_id = p.id
    GROUP BY p.id, p.nombres, p.apellidos, p.email
    ORDER BY total_evaluaciones DESC, profesor ASC
  `;

  try {
    const conn = await db.getDb();
    const rows = await db.query(conn, sql, []);
    res.json({ ok: true, total: rows.length, data: rows });
  } catch (error) {
    console.error("Error al obtener profesores activos:", error);
    res.status(500).json({ ok: false, error: "Error al generar reporte de profesores", detalle: error.message });
  }
});

module.exports = router;