const router = require('express').Router();
const { getDb, query, run } = require('../db/database');

router.get('/', async (req, res) => {
  const db = await getDb();
  res.json(await query(
    db,
    `SELECT c.*, p.nombres || ' ' || p.apellidos AS jefe_nombre
     FROM cursos c
     LEFT JOIN profesores p ON c.jefe_id = p.id
     ORDER BY c.anio DESC, c.nombre`
  ));
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = await query(db, 'SELECT * FROM cursos WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { nombre, nivel = 'Básico', anio = 2025, jefe_id } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });

  const db = await getDb();
  const info = await run(
    db,
    'INSERT INTO cursos (nombre, nivel, anio, jefe_id) VALUES ($1, $2, $3, $4) RETURNING id',
    [nombre, nivel, anio, jefe_id || null]
  );

  res.status(201).json({ id: info.rows[0].id });
});

router.put('/:id', async (req, res) => {
  const { nombre, nivel, anio, jefe_id } = req.body;
  const db = await getDb();

  await run(
    db,
    'UPDATE cursos SET nombre = $1, nivel = $2, anio = $3, jefe_id = $4 WHERE id = $5',
    [nombre, nivel, anio, jefe_id || null, req.params.id]
  );

  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await run(db, 'DELETE FROM cursos WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;