const router = require('express').Router();
const { getDb, query, run } = require('../db/database');

router.get('/', async (req, res) => {
  const db     = await getDb();
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  let where    = 'WHERE 1=1';
  const params = [];
  if (req.query.curso_id) { where += ' AND a.curso_id = $' + (params.length + 1); params.push(req.query.curso_id); }
  if (req.query.q)        { where += ' AND (a.nombres || \' \' || a.apellidos) ILIKE $' + (params.length + 1); params.push(`%${req.query.q}%`); }
  const countResult = await query(db, `SELECT COUNT(*) AS total FROM alumnos a ${where}`, params);
  const total = parseInt(countResult[0].total);
  const data = await query(db, `SELECT a.*, c.nombre AS curso_nombre FROM alumnos a LEFT JOIN cursos c ON a.curso_id = c.id ${where} ORDER BY a.apellidos LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]);
  res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// ⚠️ RUTA ESTÁTICA ANTES DE /:id
router.get('/riesgo', async (req, res) => {
  try {
    const db = await getDb();
    const params = [];
    let where = 'WHERE 1=1';

    if (req.query.curso_id) {
      params.push(Number(req.query.curso_id));
      where += ` AND a.curso_id = $${params.length}`;
    }

    const alumnosRiesgo = await query(db, `
      SELECT 
        a.id, a.nombres, a.apellidos, a.rut, a.email, a.estado,
        c.nombre AS curso_nombre,
        COALESCE(AVG(n.valor), 0) AS promedio,
        COUNT(n.id) AS total_notas,
        COALESCE(MAX(n.valor), 0) AS ultima_nota
      FROM alumnos a 
      LEFT JOIN cursos c ON a.curso_id = c.id
      LEFT JOIN notas n ON a.id = n.alumno_id
      ${where}
      GROUP BY a.id, a.nombres, a.apellidos, a.rut, a.email, a.estado, c.nombre
      HAVING COALESCE(AVG(n.valor), 0) < 4.0 OR COUNT(n.id) < 3
      ORDER BY COALESCE(AVG(n.valor), 0) ASC, COUNT(n.id) ASC
      LIMIT 50
    `, params);

    res.json(alumnosRiesgo);
  } catch (error) {
    console.error('Error alumnos riesgo:', error);
    res.status(500).json({ error: 'Error obteniendo alumnos en riesgo' });
  }
});

// ⚠️ RUTAS DINÁMICAS DESPUÉS
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = await query(db, 'SELECT * FROM alumnos WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

router.get('/:id/promedio', async (req, res) => {
  const db = await getDb();
  const rows = await query(db, 'SELECT AVG(valor) AS promedio, COUNT(*) AS total FROM notas WHERE alumno_id = $1', [req.params.id]);
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { nombres, apellidos, rut, nac, curso_id, email, tel, estado = 'Activo' } = req.body;
  if (!nombres || !apellidos) return res.status(400).json({ error: 'nombres y apellidos son obligatorios' });
  const db = await getDb();


const info = await run(
  db,
  'INSERT INTO alumnos (nombres,apellidos,rut,nac,curso_id,email,tel,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
  [nombres, apellidos, rut, nac, curso_id, email, tel, estado]
);

res.status(201).json({ id: info.rows[0].id });


});

router.put('/:id', async (req, res) => {
  const { nombres, apellidos, rut, nac, curso_id, email, tel, estado } = req.body;
  const db = await getDb();
  await run(db, 'UPDATE alumnos SET nombres=$1,apellidos=$2,rut=$3,nac=$4,curso_id=$5,email=$6,tel=$7,estado=$8 WHERE id=$9', [nombres, apellidos, rut, nac, curso_id, email, tel, estado, req.params.id]);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await run(db, 'DELETE FROM alumnos WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;