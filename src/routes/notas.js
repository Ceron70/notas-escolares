const router = require('express').Router();
const { getDb, query, run } = require('../db/database');

const isProd = process.env.NODE_ENV === 'production';

router.get('/stats', async (req, res) => {
  const db = await getDb();

  const total = (await query(db, 'SELECT COUNT(*) AS n FROM notas'))[0]?.n || 0;
  const promedio = (await query(db, 'SELECT ROUND(AVG(valor), 2) AS v FROM notas'))[0]?.v || 0;
  const aprobados = (await query(db, 'SELECT COUNT(DISTINCT alumno_id) AS n FROM notas WHERE valor >= 4.0'))[0]?.n || 0;

  const por_asig = await query(
    db,
    isProd
      ? `SELECT s.nombre, ROUND(AVG(n.valor)::numeric, 2) AS promedio, COUNT(*) AS total
         FROM notas n
         JOIN asignaturas s ON n.asig_id = s.id
         GROUP BY s.id, s.nombre
         ORDER BY s.nombre`
      : `SELECT s.nombre, ROUND(AVG(n.valor), 2) AS promedio, COUNT(*) AS total
         FROM notas n
         JOIN asignaturas s ON n.asig_id = s.id
         GROUP BY s.id, s.nombre
         ORDER BY s.nombre`
  );

  res.json({ total, promedio, aprobados, por_asig });
});

router.get('/', async (req, res) => {
  const db = await getDb();
  
  
  
    let sql = `
    SELECT n.*,
      a.nombres || ' ' || a.apellidos AS alumno_nombre,
      a.rut AS alumno_rut,
      a.curso_id,
      c.nombre AS curso_nombre,
      s.nombre AS asig_nombre,
      p.nombres || ' ' || p.apellidos AS prof_nombre
    FROM notas n
    JOIN alumnos a ON n.alumno_id = a.id
    JOIN cursos c ON a.curso_id = c.id
    JOIN asignaturas s ON n.asig_id = s.id
    LEFT JOIN profesores p ON n.prof_id = p.id
    WHERE 1=1
  `;
  
  
  
  
  const params = [];

  if (req.query.alumno_id) {
    sql += ` AND n.alumno_id = $${params.length + 1}`;
    params.push(req.query.alumno_id);
  }
  if (req.query.asig_id) {
    sql += ` AND n.asig_id = $${params.length + 1}`;
    params.push(req.query.asig_id);
  }
  if (req.query.curso_id) {
    sql += ` AND a.curso_id = $${params.length + 1}`;
    params.push(req.query.curso_id);
  }

  sql += ' ORDER BY n.fecha DESC, n.id DESC';
  res.json(await query(db, sql, params));
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = await query(db, 'SELECT * FROM notas WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { alumno_id, asig_id, prof_id, valor, tipo = 'Prueba', fecha, obs } = req.body;

  if (!alumno_id || !asig_id || !prof_id || valor == null) {
    return res.status(400).json({ error: 'alumno, asignatura, profesor y valor son obligatorios' });
  }
  if (valor < 1 || valor > 7) {
    return res.status(400).json({ error: 'valor debe estar entre 1.0 y 7.0' });
  }

  const db = await getDb();
  const info = await run(
    db,
    `INSERT INTO notas (alumno_id, asig_id, prof_id, valor, tipo, fecha, obs)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [alumno_id, asig_id, prof_id || null, valor, tipo, fecha || new Date().toISOString().split('T')[0], obs]
  );

  res.status(201).json({ id: info.rows[0].id });
});

router.put('/:id', async (req, res) => {
  const { alumno_id, asig_id, prof_id, valor, tipo, fecha, obs } = req.body;

  if (valor < 1 || valor > 7) {
    return res.status(400).json({ error: 'valor debe estar entre 1.0 y 7.0' });
  }

  const db = await getDb();
  await run(
    db,
    `UPDATE notas
     SET alumno_id = $1, asig_id = $2, prof_id = $3, valor = $4, tipo = $5, fecha = $6, obs = $7
     WHERE id = $8`,
    [alumno_id, asig_id, prof_id || null, valor, tipo, fecha, obs, req.params.id]
  );

  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await run(db, 'DELETE FROM notas WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;