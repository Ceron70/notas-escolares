const router  = require('express').Router();
const { getDb, query, run } = require('../db/database');

router.get('/', async (req, res) => {
  const db = await getDb();
  res.json(query(db, 'SELECT * FROM profesores ORDER BY apellidos'));
});
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = query(db, 'SELECT * FROM profesores WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});
router.post('/', async (req, res) => {
  const { nombres, apellidos, rut, email, especialidad, estado = 'Activo' } = req.body;
  if (!nombres || !apellidos) return res.status(400).json({ error: 'nombres y apellidos son obligatorios' });
  const db = await getDb();
  const info = run(db, 'INSERT INTO profesores (nombres,apellidos,rut,email,especialidad,estado) VALUES (?,?,?,?,?,?)',
    [nombres, apellidos, rut, email, especialidad, estado]);
  res.status(201).json({ id: info.lastInsertRowid });
});
router.put('/:id', async (req, res) => {
  const { nombres, apellidos, rut, email, especialidad, estado } = req.body;
  const db = await getDb();
  run(db, 'UPDATE profesores SET nombres=?,apellidos=?,rut=?,email=?,especialidad=?,estado=? WHERE id=?',
    [nombres, apellidos, rut, email, especialidad, estado, req.params.id]);
  res.json({ ok: true });
});
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  run(db, 'DELETE FROM profesores WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});
module.exports = router;
