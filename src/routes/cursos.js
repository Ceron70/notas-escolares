const router  = require('express').Router();
const { getDb, query, run } = require('../db/database');

router.get('/', async (req, res) => {
  const db = await getDb();
  res.json(query(db, `SELECT c.*, p.nombres || ' ' || p.apellidos AS jefe_nombre
    FROM cursos c LEFT JOIN profesores p ON c.jefe_id = p.id ORDER BY c.anio DESC, c.nombre`));
});
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = query(db, 'SELECT * FROM cursos WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});
router.post('/', async (req, res) => {
  const { nombre, nivel = 'Básico', anio = 2025, jefe_id } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
  const db = await getDb();
  const info = run(db, 'INSERT INTO cursos (nombre,nivel,anio,jefe_id) VALUES (?,?,?,?)',
    [nombre, nivel, anio, jefe_id || null]);
  res.status(201).json({ id: info.lastInsertRowid });
});
router.put('/:id', async (req, res) => {
  const { nombre, nivel, anio, jefe_id } = req.body;
  const db = await getDb();
  run(db, 'UPDATE cursos SET nombre=?,nivel=?,anio=?,jefe_id=? WHERE id=?',
    [nombre, nivel, anio, jefe_id || null, req.params.id]);
  res.json({ ok: true });
});
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  run(db, 'DELETE FROM cursos WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});
module.exports = router;
