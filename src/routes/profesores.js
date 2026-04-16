const router = require('express').Router();
const { getDb, query, run } = require('../db/database');

router.get('/', async (req, res) => {
  const db = await getDb();
  res.json(await query(db, 'SELECT * FROM profesores ORDER BY apellidos'));
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = await query(db, 'SELECT * FROM profesores WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { nombres, apellidos, rut, email, especialidad, estado = 'Activo' } = req.body;
  if (!nombres || !apellidos) {
    return res.status(400).json({ error: 'nombres y apellidos son obligatorios' });
  }

  const db = await getDb();
  const info = await run(
    db,
    'INSERT INTO profesores (nombres, apellidos, rut, email, especialidad, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [nombres, apellidos, rut, email, especialidad, estado]
  );

  res.status(201).json({ id: info.rows[0].id });
});

router.put('/:id', async (req, res) => {
  const { nombres, apellidos, rut, email, especialidad, estado } = req.body;
  const db = await getDb();

  await run(
    db,
    'UPDATE profesores SET nombres = $1, apellidos = $2, rut = $3, email = $4, especialidad = $5, estado = $6 WHERE id = $7',
    [nombres, apellidos, rut, email, especialidad, estado, req.params.id]
  );

  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await run(db, 'DELETE FROM profesores WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;