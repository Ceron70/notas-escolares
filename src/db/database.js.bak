// src/db/database.js — SQLite con sql.js (puro JS, sin compilación)
const initSqlJs = require('sql.js');
const path      = require('path');
const fs        = require('fs');

const dataDir  = path.join(__dirname, '../../data');
const dbPath   = path.join(dataDir, 'notas.db');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// sql.js es async — exportamos una promesa que resuelve la BD lista
let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  // Cargar BD existente o crear nueva
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Habilitar foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON');

  // ── Esquema ────────────────────────────────────────────────────────────────
  dbInstance.run(`
    CREATE TABLE IF NOT EXISTS profesores (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres      TEXT    NOT NULL,
      apellidos    TEXT    NOT NULL,
      rut          TEXT,
      email        TEXT,
      especialidad TEXT,
      estado       TEXT    NOT NULL DEFAULT 'Activo',
      creado_en    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cursos (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre    TEXT    NOT NULL,
      nivel     TEXT    NOT NULL DEFAULT 'Básico',
      anio      INTEGER NOT NULL DEFAULT 2025,
      jefe_id   INTEGER REFERENCES profesores(id) ON DELETE SET NULL,
      creado_en TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alumnos (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres   TEXT    NOT NULL,
      apellidos TEXT    NOT NULL,
      rut       TEXT,
      nac       TEXT,
      curso_id  INTEGER REFERENCES cursos(id) ON DELETE SET NULL,
      email     TEXT,
      tel       TEXT,
      estado    TEXT    NOT NULL DEFAULT 'Activo',
      creado_en TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS asignaturas (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre    TEXT    NOT NULL,
      codigo    TEXT,
      horas     INTEGER NOT NULL DEFAULT 4,
      desc      TEXT,
      creado_en TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notas (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      alumno_id INTEGER NOT NULL REFERENCES alumnos(id)     ON DELETE CASCADE,
      asig_id   INTEGER NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
      prof_id   INTEGER          REFERENCES profesores(id)  ON DELETE SET NULL,
      valor     REAL    NOT NULL CHECK (valor >= 1.0 AND valor <= 7.0),
      tipo      TEXT    NOT NULL DEFAULT 'Prueba',
      fecha     TEXT    NOT NULL DEFAULT (date('now')),
      obs       TEXT,
      creado_en TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Seed solo si está vacío ────────────────────────────────────────────────
  const count = dbInstance.exec('SELECT COUNT(*) as n FROM profesores')[0]?.values[0][0];
  if (!count || count === 0) {
    dbInstance.run(`
      INSERT INTO profesores (nombres,apellidos,rut,email,especialidad) VALUES
        ('Carlos','Vidal Rojas','12.345.678-9','c.vidal@colegio.cl','Matemáticas'),
        ('Ana','Morales Pérez','13.456.789-0','a.morales@colegio.cl','Lenguaje'),
        ('Roberto','Fuentes Silva','14.567.890-1','r.fuentes@colegio.cl','Ciencias'),
        ('Claudia','Torres Lagos','15.678.901-2','c.torres@colegio.cl','Historia');

      INSERT INTO cursos (nombre,nivel,anio,jefe_id) VALUES
        ('1°A Básico','Básico',2025,1),
        ('2°B Básico','Básico',2025,2),
        ('1°A Medio','Medio',2025,3);

      INSERT INTO alumnos (nombres,apellidos,rut,nac,curso_id,email,tel) VALUES
        ('Valentina','González Díaz','22.111.222-3','2012-03-15',1,'vgonzalez@mail.cl','+56 9 1111 2222'),
        ('Matías','Hernández Muñoz','22.333.444-5','2012-07-22',1,'mhernandez@mail.cl','+56 9 2222 3333'),
        ('Isidora','Ramírez Castro','22.555.666-7','2011-11-05',2,'iramirez@mail.cl','+56 9 3333 4444'),
        ('Diego','López Soto','22.777.888-9','2011-01-30',2,'dlopez@mail.cl','+56 9 4444 5555'),
        ('Camila','Martínez Bravo','23.000.111-2','2009-06-18',3,'cmartinez@mail.cl','+56 9 5555 6666'),
        ('Sebastián','Rojas Lara','23.222.333-4','2009-09-11',3,'srojas@mail.cl','+56 9 6666 7777');

      INSERT INTO asignaturas (nombre,codigo,horas,desc) VALUES
        ('Matemáticas','MAT-01',6,'Álgebra y geometría'),
        ('Lenguaje','LEN-01',6,'Comunicación y literatura'),
        ('Ciencias','CIE-01',4,'Ciencias naturales'),
        ('Historia','HIS-01',4,'Historia de Chile'),
        ('Inglés','ING-01',3,'Idioma inglés');

      INSERT INTO notas (alumno_id,asig_id,prof_id,valor,tipo,fecha) VALUES
        (1,1,1,6.5,'Prueba','2025-03-20'),
        (1,2,2,5.8,'Control','2025-03-22'),
        (2,1,1,4.2,'Prueba','2025-03-20'),
        (2,3,3,6.0,'Tarea','2025-04-01'),
        (3,2,2,7.0,'Prueba','2025-03-25'),
        (3,4,4,5.5,'Trabajo','2025-04-03'),
        (4,1,1,3.8,'Prueba','2025-03-20'),
        (5,5,2,6.2,'Examen','2025-04-10'),
        (6,3,3,5.0,'Control','2025-04-05'),
        (1,3,3,6.8,'Tarea','2025-04-12');
    `);
    save(dbInstance);
  }

  return dbInstance;
}

// Persistir la BD en disco después de cada escritura
function save(db) {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// ── Helpers síncronos sobre sql.js ────────────────────────────────────────────
// sql.js no tiene .prepare().get() como better-sqlite3,
// lo envolvemos en funciones cómodas para el mismo API surface.
function query(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push(row);
  }
  stmt.free();
  return rows;
}

function run(db, sql, params = []) {
  db.run(sql, params);
  save(db);
  // Obtener lastInsertRowid
  const r = query(db, 'SELECT last_insert_rowid() as id');
  return { lastInsertRowid: r[0]?.id, changes: db.getRowsModified() };
}

module.exports = { getDb, query, run };
