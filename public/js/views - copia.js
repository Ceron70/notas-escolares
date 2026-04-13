// public/js/views.js — Renderizado de cada módulo

// ── Estado paginación alumnos ─────────────────────────────────────────────────
const paginaAlumnos = { page: 1, limit: 10, total: 0, totalPages: 1 };

async function populateFilters() {
  const [cursos, asigs] = await Promise.all([api.getCursos(), api.getAsignaturas()]);
  state.cursos = cursos; state.asignaturas = asigs;
  [['filter-curso','Todos los cursos'], ['filter-curso-alumnos','Todos los cursos']].forEach(([id, label]) => {
    const el = $(id); if (!el) return;
    const v = el.value;
    el.innerHTML = `<option value="">${label}</option>` + cursos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    el.value = v;
  });
  const fa = $('filter-asig'); if (fa) {
    const v = fa.value;
    fa.innerHTML = '<option value="">Todas las asignaturas</option>' + asigs.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
    fa.value = v;
  }
}

async function renderDashboard() {
  const [stats, alumnos, notas, asigs] = await Promise.all([
    api.getNotasStats(), api.getAlumnos(), api.getNotas(), api.getAsignaturas()
  ]);
  // getAlumnos ahora puede devolver {data, total} o array directo
  const alumnosArr = Array.isArray(alumnos) ? alumnos : alumnos.data;
  const tasa = alumnosArr.length ? Math.round(stats.aprobados / alumnosArr.length * 100) : 0;
  $('kpi-grid').innerHTML = `
    <div class="kpi-card"><div class="kpi-label">Alumnos</div><div class="kpi-value">${alumnosArr.length}</div><div class="kpi-sub">${(await api.getCursos()).length} cursos activos</div><span class="kpi-badge badge-blue"><i data-lucide="users" size="11"></i> Total inscritos</span></div>
    <div class="kpi-card"><div class="kpi-label">Notas registradas</div><div class="kpi-value">${stats.total}</div><div class="kpi-sub">${asigs.length} asignaturas</div><span class="kpi-badge badge-gold"><i data-lucide="clipboard-list" size="11"></i> Evaluaciones</span></div>
    <div class="kpi-card"><div class="kpi-label">Promedio general</div><div class="kpi-value">${fmtNota(stats.promedio)}</div><div class="kpi-sub">Escala 1.0 – 7.0</div><div class="progress-bar"><div class="progress-fill" style="width:${stats.promedio?(stats.promedio/7*100):0}%"></div></div></div>
    <div class="kpi-card"><div class="kpi-label">Tasa de aprobación</div><div class="kpi-value">${tasa}%</div><div class="kpi-sub">${stats.aprobados} de ${alumnosArr.length} alumnos ≥ 4.0</div><span class="kpi-badge ${tasa>=80?'badge-green':'badge-orange'}">${tasa>=80?'✓ Buena':'⚠ Revisar'}</span></div>`;
  $('recent-notas-body').innerHTML = notas.slice(0,6).map(n => `<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${initials(...n.alumno_nombre.split(' '))}</div>${n.alumno_nombre}</div></td><td>${n.asig_nombre}</td><td><span class="nota-badge ${notaColor(n.valor)}">${fmtNota(n.valor)}</span></td><td>${fmtFecha(n.fecha)}</td></tr>`).join('');
  $('prom-asig-body').innerHTML = stats.por_asig.map(a => `<tr><td>${a.nombre}</td><td><span class="nota-badge ${notaColor(a.promedio)}">${fmtNota(a.promedio)}</span></td><td><div class="progress-bar" style="min-width:80px"><div class="progress-fill" style="width:${a.promedio?(a.promedio/7*100):0}%"></div></div></td></tr>`).join('');
  lucide.createIcons();
}

async function renderNotas() {
  await populateFilters();
  const params = {};
  const q = ($('search-notas')||{}).value;
  const fc = ($('filter-curso')||{}).value;
  const fa = ($('filter-asig')||{}).value;
  if (fc) params.curso_id = fc;
  if (fa) params.asig_id  = fa;
  showLoader('notas-body', 8);
  const notas = await api.getNotas(params);
  const filt  = q ? notas.filter(n => n.alumno_nombre.toLowerCase().includes(q.toLowerCase()) || n.asig_nombre.toLowerCase().includes(q.toLowerCase())) : notas;
  $('notas-body').innerHTML = filt.length ? filt.map(n => `<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${initials(...n.alumno_nombre.split(' '))}</div>${n.alumno_nombre}</div></td><td><span class="chip">${n.curso_nombre||'–'}</span></td><td>${n.asig_nombre}</td><td><span class="chip">${n.tipo}</span></td><td><span class="nota-badge ${notaColor(n.valor)}">${fmtNota(n.valor)}</span></td><td>${fmtFecha(n.fecha)}</td><td>${n.prof_nombre||'–'}</td><td><div class="actions-cell"><button class="btn btn-ghost btn-sm" onclick="editNota(${n.id})"><i data-lucide="pencil" size="12"></i></button><button class="btn btn-danger btn-sm" onclick="deleteItem('notas',${n.id})"><i data-lucide="trash-2" size="12"></i></button></div></td></tr>`).join('') : `<tr><td colspan="8"><div class="empty-state" style="padding:var(--space-10)"><div class="empty-icon"><i data-lucide="clipboard-list" size="40"></i></div><h3>Sin notas</h3><p>Registra la primera evaluación.</p></div></td></tr>`;
  lucide.createIcons();
}

async function renderAlumnos() {
  await populateFilters();
  const q  = ($('search-alumnos')||{}).value;
  const fc = ($('filter-curso-alumnos')||{}).value;
  const params = { page: paginaAlumnos.page, limit: paginaAlumnos.limit };
  if (fc) params.curso_id = fc;
  if (q)  params.q = q;

  showLoader('alumnos-body', 7);
  const [resp, notas] = await Promise.all([api.getAlumnos(params), api.getNotas()]);

  // Soporte respuesta paginada {data,total,totalPages} o array directo
  const alumnos = Array.isArray(resp) ? resp : resp.data;
  if (!Array.isArray(resp)) {
    paginaAlumnos.total      = resp.total;
    paginaAlumnos.totalPages = resp.totalPages;
  }

  const promMap = {};
  notas.forEach(n => { if (!promMap[n.alumno_id]) promMap[n.alumno_id]=[]; promMap[n.alumno_id].push(n.valor); });
  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

  $('alumnos-body').innerHTML = alumnos.length
    ? alumnos.map(a => {
        const p = avg(promMap[a.id]||[]);
        return `<tr>
          <td><div style="display:flex;align-items:center;gap:8px">
            <div class="avatar">${initials(a.nombres,a.apellidos)}</div>
            ${a.nombres} ${a.apellidos}</div></td>
          <td style="color:var(--color-text-muted)">${a.rut||'–'}</td>
          <td><span class="chip">${a.curso_nombre||'–'}</span></td>
          <td style="color:var(--color-text-muted)">${a.email||'–'}</td>
          <td><span class="pill-status ${a.estado==='Activo'?'status-activo':'status-inactivo'}">${a.estado}</span></td>
          <td><span class="nota-badge ${p?notaColor(p):'badge-gray'}">${fmtNota(p)}</span></td>
          <td><div class="actions-cell">
            <button class="btn btn-ghost btn-sm" onclick="editAlumno(${a.id})"><i data-lucide="pencil" size="12"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteItem('alumnos',${a.id})"><i data-lucide="trash-2" size="12"></i></button>
          </div></td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="7"><div class="empty-state" style="padding:var(--space-10)">
        <div class="empty-icon"><i data-lucide="users" size="40"></i></div>
        <h3>Sin alumnos</h3><p>Agrega el primer alumno.</p>
        <button class="btn btn-primary" onclick="openAddModal()">Nuevo alumno</button>
      </div></td></tr>`;

  renderPaginacion();
  lucide.createIcons();
}

function renderPaginacion() {
  let el = $('alumnos-pagination');
  if (!el) {
    const tabla = document.querySelector('#page-alumnos .table-wrapper')
               || document.querySelector('#page-alumnos table')?.parentElement;
    if (!tabla) return;
    el = document.createElement('div');
    el.id = 'alumnos-pagination';
    tabla.after(el);
  }
  const { page, totalPages, total, limit } = paginaAlumnos;
  const desde = ((page - 1) * limit) + 1;
  const hasta = Math.min(page * limit, total);
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4) var(--space-2);color:var(--color-text-muted);font-size:var(--text-sm)">
      <span>Mostrando ${desde}–${hasta} de ${total} alumnos</span>
      <div style="display:flex;gap:var(--space-2);align-items:center">
        <button class="btn btn-ghost btn-sm" ${page<=1?'disabled':''} onclick="cambiarPagina(${page-1})">
          <i data-lucide="chevron-left" size="14"></i> Anterior
        </button>
        <span style="padding:0 var(--space-2)">Página ${page} de ${totalPages}</span>
        <button class="btn btn-ghost btn-sm" ${page>=totalPages?'disabled':''} onclick="cambiarPagina(${page+1})">
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

async function renderAsignaturas() {
  const q = ($('search-asig')||{}).value?.toLowerCase();
  showLoader('asig-body', 5);
  const items = await api.getAsignaturas();
  const f = q ? items.filter(a => a.nombre.toLowerCase().includes(q)) : items;
  $('asig-body').innerHTML = f.map(a => `<tr><td><strong>${a.nombre}</strong></td><td><span class="chip">${a.codigo||'–'}</span></td><td>${a.horas}h</td><td style="color:var(--color-text-muted)">${a.desc||'–'}</td><td><div class="actions-cell"><button class="btn btn-ghost btn-sm" onclick="editAsignatura(${a.id})"><i data-lucide="pencil" size="12"></i></button><button class="btn btn-danger btn-sm" onclick="deleteItem('asignaturas',${a.id})"><i data-lucide="trash-2" size="12"></i></button></div></td></tr>`).join('');
  lucide.createIcons();
}

async function renderCursos() {
  showLoader('cursos-body', 6);
  const [cursos, alumnosResp] = await Promise.all([api.getCursos(), api.getAlumnos()]);
  const alumnos = Array.isArray(alumnosResp) ? alumnosResp : alumnosResp.data;
  $('cursos-body').innerHTML = cursos.map(c => { const n=alumnos.filter(a=>a.curso_id===c.id).length; return `<tr><td><strong>${c.nombre}</strong></td><td><span class="chip">${c.nivel}</span></td><td>${c.jefe_nombre||'–'}</td><td><span class="nota-badge" style="background:var(--color-blue-highlight);color:var(--color-blue)">${n}</span></td><td>${c.anio}</td><td><div class="actions-cell"><button class="btn btn-ghost btn-sm" onclick="editCurso(${c.id})"><i data-lucide="pencil" size="12"></i></button><button class="btn btn-danger btn-sm" onclick="deleteItem('cursos',${c.id})"><i data-lucide="trash-2" size="12"></i></button></div></td></tr>`; }).join('');
  lucide.createIcons();
}

async function renderProfesores() {
  const q = ($('search-prof')||{}).value?.toLowerCase();
  showLoader('prof-body', 6);
  const items = await api.getProfesores();
  const f = q ? items.filter(p => (p.nombres+' '+p.apellidos).toLowerCase().includes(q)) : items;
  $('prof-body').innerHTML = f.map(p => `<tr><td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${initials(p.nombres,p.apellidos)}</div>${p.nombres} ${p.apellidos}</div></td><td style="color:var(--color-text-muted)">${p.rut||'–'}</td><td style="color:var(--color-text-muted)">${p.email||'–'}</td><td><span class="chip">${p.especialidad||'–'}</span></td><td><span class="pill-status ${p.estado==='Activo'?'status-activo':'status-inactivo'}">${p.estado}</span></td><td><div class="actions-cell"><button class="btn btn-ghost btn-sm" onclick="editProfesor(${p.id})"><i data-lucide="pencil" size="12"></i></button><button class="btn btn-danger btn-sm" onclick="deleteItem('profesores',${p.id})"><i data-lucide="trash-2" size="12"></i></button></div></td></tr>`).join('');
  lucide.createIcons();
}
