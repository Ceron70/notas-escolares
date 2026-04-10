const router  = require('express').Router();
const { getDb, query, run } = require('../db/database');

router.get('/', async (req, res) => {
  const db = await getDb();
  let sql = `SELECT a.*, c.nombre AS curso_nombre
    FROM alumnos a LEFT JOIN cursos c ON a.curso_id = c.id WHERE 1=1`;
  const params = [];
  if (req.query.curso_id) { sql += ' AND a.curso_id = ?'; params.push(req.query.curso_id); }
  if (req.query.q)        { sql += ' AND (a.nombres || " " || a.apellidos) LIKE ?'; params.push(`%${req.query.q}%`); }
  sql += ' ORDER BY a.apellidos';
  res.json(query(db, sql, params));
});
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const rows = query(db, 'SELECT * FROM alumnos WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});
router.get('/:id/promedio', async (req, res) => {
  const db = await getDb();
  const rows = query(db, 'SELECT AVG(valor) AS promedio, COUNT(*) AS total FROM notas WHERE alumno_id = ?', [req.params.id]);
  res.json(rows[0]);
});
router.post('/', async (req, res) => {
  const { nombres, apellidos, rut, nac, curso_id, email, tel, estado = 'Activo' } = req.body;
  if (!nombres || !apellidos) return res.status(400).json({ error: 'nombres y apellidos son obligatorios' });
  const db = await getDb();
  const info = run(db, 'INSERT INTO alumnos (nombres,apellidos,rut,nac,curso_id,email,tel,estado) VALUES (?,?,?,?,?,?,?,?)',
    [nombres, apellidos, rut, nac, curso_id, email, tel, estado]);
  res.status(201).json({ id: info.lastInsertRowid });
});
router.put('/:id', async (req, res) => {
  const { nombres, apellidos, rut, nac, curso_id, email, tel, estado } = req.body;
  const db = await getDb();
  run(db, 'UPDATE alumnos SET nombres=?,apellidos=?,rut=?,nac=?,curso_id=?,email=?,tel=?,estado=? WHERE id=?',
    [nombres, apellidos, rut, nac, curso_id, email, tel, estado, req.params.id]);
  res.json({ ok: true });
});
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  run(db, 'DELETE FROM alumnos WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});
module.exports = router;
