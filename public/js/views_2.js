// public/js/views.js — Renderizado de módulos
// Requiere: utils.js (fmtNota, fmtFecha, notaColor, initials), api.js, state.js

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────────────────────────────────────

const paginaAlumnos = { page: 1, limit: 10, total: 0, totalPages: 1 };

// Cache del mapa de promedios para no recalcular en cada render
let _promMapCache  = null;
let _promMapStamp  = null; // marca para invalidar si cambian las notas

function buildPromMap(notas) {
  const map = {};
  notas.forEach(n => {
    if (!map[n.alumno_id]) map[n.alumno_id] = [];
    map[n.alumno_id].push(n.valor);
  });
  return map;
}

function getPromMap(notas) {
  const stamp = notas.length + '_' + (notas[0]?.id ?? '');
  if (_promMapCache && _promMapStamp === stamp) return _promMapCache;
  _promMapCache = buildPromMap(notas);
  _promMapStamp = stamp;
  return _promMapCache;
}

function avgArr(arr) {
  return arr?.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE PLANTILLA  (piezas reutilizables de HTML)
// ─────────────────────────────────────────────────────────────────────────────

function avatarCell(nombres, apellidos, extra = '') {
  return `
    <div style="display:flex;align-items:center;gap:8px">
      <div class="avatar">${initials(nombres, apellidos)}</div>
      ${nombres} ${apellidos}${extra}
    </div>`;
}

function emptyState({ icon, title, message, action = '' }) {
  return `
    <div class="empty-state" style="padding:var(--space-10)">
      <div class="empty-icon"><i data-lucide="${icon}" size="40"></i></div>
      <h3>${title}</h3>
      <p>${message}</p>
      ${action}
    </div>`;
}

function errorState(msg) {
  return `
    <div class="empty-state" style="padding:var(--space-10)">
      <div class="empty-icon"><i data-lucide="alert-circle" size="40"></i></div>
      <h3>Error al cargar</h3>
      <p>${msg}</p>
    </div>`;
}

function actionsCell(editFn, deleteFn) {
  return `
    <div class="actions-cell">
      <button class="btn btn-ghost btn-sm" onclick="${editFn}">
        <i data-lucide="pencil" size="12"></i>
      </button>
      <button class="btn btn-danger btn-sm" onclick="${deleteFn}">
        <i data-lucide="trash-2" size="12"></i>
      </button>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDERER GENÉRICO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renderiza una tabla genérica.
 * @param {object} opts
 * @param {string}   opts.bodyId    – id del <tbody>
 * @param {Function} opts.fetchFn   – función async que devuelve el array de items
 * @param {Function} opts.rowFn     – (item) => string HTML de <tr>
 * @param {number}   opts.cols      – número de columnas (para el colspan del empty state)
 * @param {object}   opts.empty     – { icon, title, message, action }
 * @param {Function} [opts.filterFn] – (item) => boolean, filtro opcional en cliente
 */
async function renderTabla({ bodyId, fetchFn, rowFn, cols, empty, filterFn }) {
  showLoader(bodyId, cols);
  try {
    const items    = await fetchFn();
    const filtered = filterFn ? items.filter(filterFn) : items;
    $(bodyId).innerHTML = filtered.length
      ? filtered.map(rowFn).join('')
      : `<tr><td colspan="${cols}">${emptyState(empty)}</td></tr>`;
  } catch (err) {
    console.error(`[renderTabla] ${bodyId}:`, err);
    $(bodyId).innerHTML = `<tr><td colspan="${cols}">${errorState('Intenta recargar la página.')}</td></tr>`;
  } finally {
    lucide.createIcons();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTROS  (selectores compartidos entre vistas)
// ─────────────────────────────────────────────────────────────────────────────

async function populateFilters() {
  try {
    const [cursos, asigs] = await Promise.all([api.getCursos(), api.getAsignaturas()]);
    state.cursos      = cursos;
    state.asignaturas = asigs;

    const cursosOpts = cursos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    const asigsOpts  = asigs.map(a  => `<option value="${a.id}">${a.nombre}</option>`).join('');

    [
      ['filter-curso',         'Todos los cursos'],
      ['filter-curso-alumnos', 'Todos los cursos'],
    ].forEach(([id, label]) => {
      const el = $(id);
      if (!el) return;
      const prev = el.value;
      el.innerHTML = `<option value="">${label}</option>${cursosOpts}`;
      el.value = prev;
    });

    const fa = $('filter-asig');
    if (fa) {
      const prev = fa.value;
      fa.innerHTML = `<option value="">Todas las asignaturas</option>${asigsOpts}`;
      fa.value = prev;
    }
  } catch (err) {
    console.error('[populateFilters]', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FILAS DE TABLA  (funciones puras → fáciles de testear)
// ─────────────────────────────────────────────────────────────────────────────

function rowNota(n) {
  return `
    <tr>
      <td>${avatarCell(...n.alumno_nombre.split(' '))}</td>
      <td><span class="chip">${n.curso_nombre || '–'}</span></td>
      <td>${n.asig_nombre}</td>
      <td><span class="chip">${n.tipo}</span></td>
      <td><span class="nota-badge ${notaColor(n.valor)}">${fmtNota(n.valor)}</span></td>
      <td>${fmtFecha(n.fecha)}</td>
      <td>${n.prof_nombre || '–'}</td>
      <td>${actionsCell(`editNota(${n.id})`, `deleteItem('notas',${n.id})`)}</td>
    </tr>`;
}

function rowAlumno(a, promedio) {
  return `
    <tr>
      <td>${avatarCell(a.nombres, a.apellidos)}</td>
      <td style="color:var(--color-text-muted)">${a.rut || '–'}</td>
      <td><span class="chip">${a.curso_nombre || '–'}</span></td>
      <td style="color:var(--color-text-muted)">${a.email || '–'}</td>
      <td>
        <span class="pill-status ${a.estado === 'Activo' ? 'status-activo' : 'status-inactivo'}">
          ${a.estado}
        </span>
      </td>
      <td>
        <span class="nota-badge ${promedio ? notaColor(promedio) : 'badge-gray'}">
          ${fmtNota(promedio)}
        </span>
      </td>
      <td>${actionsCell(`editAlumno(${a.id})`, `deleteItem('alumnos',${a.id})`)}</td>
    </tr>`;
}

function rowAsignatura(a) {
  return `
    <tr>
      <td><strong>${a.nombre}</strong></td>
      <td><span class="chip">${a.codigo || '–'}</span></td>
      <td>${a.horas}h</td>
      <td style="color:var(--color-text-muted)">${a.desc || '–'}</td>
      <td>${actionsCell(`editAsignatura(${a.id})`, `deleteItem('asignaturas',${a.id})`)}</td>
    </tr>`;
}

function rowCurso(c, totalAlumnos) {
  return `
    <tr>
      <td><strong>${c.nombre}</strong></td>
      <td><span class="chip">${c.nivel}</span></td>
      <td>${c.jefe_nombre || '–'}</td>
      <td>
        <span class="nota-badge" style="background:var(--color-blue-highlight);color:var(--color-blue)">
          ${totalAlumnos}
        </span>
      </td>
      <td>${c.anio}</td>
      <td>${actionsCell(`editCurso(${c.id})`, `deleteItem('cursos',${c.id})`)}</td>
    </tr>`;
}

function rowProfesor(p) {
  return `
    <tr>
      <td>${avatarCell(p.nombres, p.apellidos)}</td>
      <td style="color:var(--color-text-muted)">${p.rut || '–'}</td>
      <td style="color:var(--color-text-muted)">${p.email || '–'}</td>
      <td><span class="chip">${p.especialidad || '–'}</span></td>
      <td>
        <span class="pill-status ${p.estado === 'Activo' ? 'status-activo' : 'status-inactivo'}">
          ${p.estado}
        </span>
      </td>
      <td>${actionsCell(`editProfesor(${p.id})`, `deleteItem('profesores',${p.id})`)}</td>
    </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

async function renderDashboard() {
  try {
    // Un único Promise.all — sin awaits sueltos dentro de templates
    const [stats, alumnosResp, notas, asigs, cursos] = await Promise.all([
      api.getNotasStats(),
      api.getAlumnos(),
      api.getNotas(),
      api.getAsignaturas(),
      api.getCursos(),
    ]);

    const alumnos = Array.isArray(alumnosResp) ? alumnosResp : alumnosResp.data;
    const tasa    = alumnos.length
      ? Math.round(stats.aprobados / alumnos.length * 100)
      : 0;

    $('kpi-grid').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">Alumnos</div>
        <div class="kpi-value">${alumnos.length}</div>
        <div class="kpi-sub">${cursos.length} cursos activos</div>
        <span class="kpi-badge badge-blue">
          <i data-lucide="users" size="11"></i> Total inscritos
        </span>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Notas registradas</div>
        <div class="kpi-value">${stats.total}</div>
        <div class="kpi-sub">${asigs.length} asignaturas</div>
        <span class="kpi-badge badge-gold">
          <i data-lucide="clipboard-list" size="11"></i> Evaluaciones
        </span>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Promedio general</div>
        <div class="kpi-value">${fmtNota(stats.promedio)}</div>
        <div class="kpi-sub">Escala 1.0 – 7.0</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${stats.promedio ? stats.promedio / 7 * 100 : 0}%"></div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">Tasa de aprobación</div>
        <div class="kpi-value">${tasa}%</div>
        <div class="kpi-sub">${stats.aprobados} de ${alumnos.length} alumnos ≥ 4.0</div>
        <span class="kpi-badge ${tasa >= 80 ? 'badge-green' : 'badge-orange'}">
          ${tasa >= 80 ? '✓ Buena' : '⚠ Revisar'}
        </span>
      </div>`;

    $('recent-notas-body').innerHTML = notas.slice(0, 6).map(n => `
      <tr>
        <td>${avatarCell(...n.alumno_nombre.split(' '))}</td>
        <td>${n.asig_nombre}</td>
        <td><span class="nota-badge ${notaColor(n.valor)}">${fmtNota(n.valor)}</span></td>
        <td>${fmtFecha(n.fecha)}</td>
      </tr>`).join('');

    $('prom-asig-body').innerHTML = stats.por_asig.map(a => `
      <tr>
        <td>${a.nombre}</td>
        <td><span class="nota-badge ${notaColor(a.promedio)}">${fmtNota(a.promedio)}</span></td>
        <td>
          <div class="progress-bar" style="min-width:80px">
            <div class="progress-fill" style="width:${a.promedio ? a.promedio / 7 * 100 : 0}%"></div>
          </div>
        </td>
      </tr>`).join('');

  } catch (err) {
    console.error('[renderDashboard]', err);
    $('kpi-grid').innerHTML = `<p style="color:var(--color-danger)">Error al cargar el dashboard.</p>`;
  } finally {
    lucide.createIcons();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTAS
// ─────────────────────────────────────────────────────────────────────────────

async function renderNotas() {
  await populateFilters();

  const q  = ($('search-notas')  || {}).value?.trim();
  const fc = ($('filter-curso')  || {}).value;
  const fa = ($('filter-asig')   || {}).value;

  const params = {};
  if (fc) params.curso_id = fc;
  if (fa) params.asig_id  = fa;

  await renderTabla({
    bodyId:   'notas-body',
    cols:     8,
    fetchFn:  () => api.getNotas(params),
    rowFn:    rowNota,
    filterFn: q
      ? n => n.alumno_nombre.toLowerCase().includes(q.toLowerCase())
           || n.asig_nombre.toLowerCase().includes(q.toLowerCase())
      : null,
    empty: {
      icon:    'clipboard-list',
      title:   'Sin notas',
      message: 'Registra la primera evaluación.',
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ALUMNOS  (con paginación)
// ─────────────────────────────────────────────────────────────────────────────

async function renderAlumnos() {
  await populateFilters();

  const q  = ($('search-alumnos')       || {}).value?.trim();
  const fc = ($('filter-curso-alumnos') || {}).value;

  const params = { page: paginaAlumnos.page, limit: paginaAlumnos.limit };
  if (fc) params.curso_id = fc;
  if (q)  params.q        = q;

  showLoader('alumnos-body', 7);

  try {
    const [resp, notas] = await Promise.all([api.getAlumnos(params), api.getNotas()]);

    const alumnos = Array.isArray(resp) ? resp : resp.data;
    if (!Array.isArray(resp)) {
      paginaAlumnos.total      = resp.total;
      paginaAlumnos.totalPages = resp.totalPages;
    }

    const promMap = getPromMap(notas);

    $('alumnos-body').innerHTML = alumnos.length
      ? alumnos.map(a => rowAlumno(a, avgArr(promMap[a.id]))).join('')
      : `<tr><td colspan="7">${emptyState({
          icon:    'users',
          title:   'Sin alumnos',
          message: 'Agrega el primer alumno.',
          action:  '<button class="btn btn-primary" onclick="openAddModal()">Nuevo alumno</button>',
        })}</td></tr>`;

    renderPaginacion();

  } catch (err) {
    console.error('[renderAlumnos]', err);
    $('alumnos-body').innerHTML =
      `<tr><td colspan="7">${errorState('No se pudieron cargar los alumnos.')}</td></tr>`;
  } finally {
    lucide.createIcons();
  }
}

function renderPaginacion() {
  let el = $('alumnos-pagination');
  if (!el) {
    const tabla =
      document.querySelector('#page-alumnos .table-wrapper') ||
      document.querySelector('#page-alumnos table')?.parentElement;
    if (!tabla) return;
    el    = document.createElement('div');
    el.id = 'alumnos-pagination';
    tabla.after(el);
  }

  const { page, totalPages, total, limit } = paginaAlumnos;
  const desde = (page - 1) * limit + 1;
  const hasta  = Math.min(page * limit, total);

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;
                padding:var(--space-4) var(--space-2);
                color:var(--color-text-muted);font-size:var(--text-sm)">
      <span>Mostrando ${desde}–${hasta} de ${total} alumnos</span>
      <div style="display:flex;gap:var(--space-2);align-items:center">
        <button class="btn btn-ghost btn-sm"
                ${page <= 1 ? 'disabled' : ''}
                onclick="cambiarPagina(${page - 1})">
          <i data-lucide="chevron-left" size="14"></i> Anterior
        </button>
        <span style="padding:0 var(--space-2)">Página ${page} de ${totalPages}</span>
        <button class="btn btn-ghost btn-sm"
                ${page >= totalPages ? 'disabled' : ''}
                onclick="cambiarPagina(${page + 1})">
          Siguiente <i data-lucide="chevron-right" size="14"></i>
        </button>
      </div>
    </div>`;

  lucide.createIcons();
}

function cambiarPagina(nuevaPagina) {
  paginaAlumnos.page = nuevaPagina;
  renderAlumnos();
}

// ─────────────────────────────────────────────────────────────────────────────
// ASIGNATURAS
// ─────────────────────────────────────────────────────────────────────────────

async function renderAsignaturas() {
  const q = ($('search-asig') || {}).value?.toLowerCase();

  await renderTabla({
    bodyId:   'asig-body',
    cols:     5,
    fetchFn:  api.getAsignaturas,
    rowFn:    rowAsignatura,
    filterFn: q ? a => a.nombre.toLowerCase().includes(q) : null,
    empty: {
      icon:    'book-open',
      title:   'Sin asignaturas',
      message: 'Agrega la primera asignatura.',
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────────────────────────────────────────

async function renderCursos() {
  showLoader('cursos-body', 6);
  try {
    const [cursos, alumnosResp] = await Promise.all([api.getCursos(), api.getAlumnos()]);
    const alumnos = Array.isArray(alumnosResp) ? alumnosResp : alumnosResp.data;

    // Índice: curso_id → cantidad de alumnos
    const alumnosPorCurso = alumnos.reduce((acc, a) => {
      acc[a.curso_id] = (acc[a.curso_id] || 0) + 1;
      return acc;
    }, {});

    $('cursos-body').innerHTML = cursos.length
      ? cursos.map(c => rowCurso(c, alumnosPorCurso[c.id] || 0)).join('')
      : `<tr><td colspan="6">${emptyState({
          icon:    'layers',
          title:   'Sin cursos',
          message: 'Crea el primer curso.',
        })}</td></tr>`;

  } catch (err) {
    console.error('[renderCursos]', err);
    $('cursos-body').innerHTML =
      `<tr><td colspan="6">${errorState('No se pudieron cargar los cursos.')}</td></tr>`;
  } finally {
    lucide.createIcons();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFESORES
// ─────────────────────────────────────────────────────────────────────────────

async function renderProfesores() {
  const q = ($('search-prof') || {}).value?.toLowerCase();

  await renderTabla({
    bodyId:   'prof-body',
    cols:     6,
    fetchFn:  api.getProfesores,
    rowFn:    rowProfesor,
    filterFn: q
      ? p => `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q)
      : null,
    empty: {
      icon:    'user-check',
      title:   'Sin profesores',
      message: 'Agrega el primer profesor.',
    },
  });
}