const router  = require('express').Router();
const { getDb, query, run } = require('../db/database');

router.get('/', async (req, res) => {
  const db = await getDb();
  res.json(await query(db, 'SELECT * FROM asignaturas ORDER BY nombre'));
});
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = await query(db, 'SELECT * FROM asignaturas WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});
router.post('/', async (req, res) => {
  const { nombre, codigo, horas = 4, desc } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
  const db = await getDb();
  const info = await run(db, 'INSERT INTO asignaturas (nombre,codigo,horas,desc) VALUES (?,?,?,?)',
    [nombre, codigo, horas, desc]);
  res.status(201).json({ id: info.lastInsertRowid });
});
router.put('/:id', async (req, res) => {
  const { nombre, codigo, horas, desc } = req.body;
  const db = await getDb();
  await run(db, 'UPDATE asignaturas SET nombre=?,codigo=?,horas=?,desc=? WHERE id=?',
    [nombre, codigo, horas, desc, req.params.id]);
  res.json({ ok: true });
});
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await run(db, 'DELETE FROM asignaturas WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});
module.exports = router;
