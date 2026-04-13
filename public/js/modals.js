// public/js/modals.js — CRUD contra la API REST

function unwrapList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

async function openNotaModal(nota) {
  $('modal-nota-title').textContent = nota ? 'Editar nota' : 'Registrar nota';

  const [alumnosRes, asigsRes, profsRes] = await Promise.all([
    api.getAlumnos(),
    api.getAsignaturas(),
    api.getProfesores()
  ]);

  const alumnos = unwrapList(alumnosRes);
  const asigs = unwrapList(asigsRes);
  const profs = unwrapList(profsRes);

  $('nota-alumno').innerHTML =
    '<option value="">-- Selecciona alumno --</option>' +
    alumnos.map(a => `<option value="${a.id}">${a.nombres} ${a.apellidos}</option>`).join('');

  $('nota-asig').innerHTML =
    '<option value="">-- Selecciona asignatura --</option>' +
    asigs.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');

  $('nota-prof').innerHTML =
    '<option value="">-- Sin asignar --</option>' +
    profs.map(p => `<option value="${p.id}">${p.nombres} ${p.apellidos}</option>`).join('');

  if (nota) {
    $('nota-alumno').value = nota.alumno_id || '';
    $('nota-asig').value = nota.asig_id || '';
    $('nota-prof').value = nota.prof_id || '';
    $('nota-valor').value = nota.valor ?? '';
    $('nota-tipo').value = nota.tipo || 'Prueba';
    $('nota-fecha').value = nota.fecha?.split('T')[0] || '';
    $('nota-obs').value = nota.obs || '';
  } else {
    $('nota-alumno').value = '';
    $('nota-asig').value = '';
    $('nota-prof').value = '';
    $('nota-valor').value = '';
    $('nota-tipo').value = 'Prueba';
    $('nota-fecha').value = new Date().toISOString().split('T')[0];
    $('nota-obs').value = '';
  }

  $('modal-nota').style.display = 'flex';
  lucide.createIcons();
}

async function editNota(id) {
  state.editingId = id;
  const notasRes = await api.getNotas().catch(() => []);
  const notas = unwrapList(notasRes);
  const nota = notas.find(n => n.id === id) || null;
  openNotaModal(nota || { id });
}

async function saveNota() {
  const data = {
    alumno_id: parseInt($('nota-alumno').value),
    asig_id: parseInt($('nota-asig').value),
    prof_id: parseInt($('nota-prof').value) || null,
    valor: parseFloat($('nota-valor').value),
    tipo: $('nota-tipo').value,
    fecha: $('nota-fecha').value,
    obs: $('nota-obs').value,
  };

  if (!data.alumno_id || !data.asig_id || isNaN(data.valor) || data.valor < 1 || data.valor > 7) {
    return showToast('⚠ Completa alumno, asignatura y nota válida (1.0–7.0)', 'err');
  }

  try {
    if (state.editingId) await api.updateNota(state.editingId, data);
    else await api.createNota(data);

    closeModal('modal-nota');
    await renderNotas();
    showToast('✓ Nota guardada');
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// ─────────────────────────────────────────────────────────────
// ALUMNOS
// ─────────────────────────────────────────────────────────────

async function openAlumnoModal(alumno) {
  const cursosRes = await api.getCursos();
  const cursos = unwrapList(cursosRes);

  $('al-curso').innerHTML = cursos
    .map(c => `<option value="${c.id}">${c.nombre}</option>`)
    .join('');

  if (alumno) {
    $('al-nombres').value = alumno.nombres;
    $('al-apellidos').value = alumno.apellidos;
    $('al-rut').value = alumno.rut || '';
    $('al-nac').value = alumno.nac?.split('T')[0] || '';
    $('al-curso').value = alumno.curso_id;
    $('al-email').value = alumno.email || '';
    $('al-tel').value = alumno.tel || '';
    $('al-estado').value = alumno.estado;
  } else {
    ['al-nombres', 'al-apellidos', 'al-rut', 'al-nac', 'al-email', 'al-tel'].forEach(id => $(id).value = '');
    $('al-estado').value = 'Activo';
  }

  $('modal-alumno').style.display = 'flex';
  lucide.createIcons();
}

async function editAlumno(id) {
  state.editingId = id;
  const a = await fetch('/api/alumnos/' + id).then(r => r.json());
  openAlumnoModal(a);
}

async function saveAlumno() {
  const data = {
    nombres: $('al-nombres').value.trim(),
    apellidos: $('al-apellidos').value.trim(),
    rut: $('al-rut').value,
    nac: $('al-nac').value,
    curso_id: parseInt($('al-curso').value),
    email: $('al-email').value,
    tel: $('al-tel').value,
    estado: $('al-estado').value,
  };

  if (!data.nombres || !data.apellidos) {
    return showToast('⚠ Completa los campos obligatorios', 'err');
  }

  try {
    if (state.editingId) await api.updateAlumno(state.editingId, data);
    else await api.createAlumno(data);

    closeModal('modal-alumno');
    await renderAlumnos();
    showToast('✓ Alumno guardado');
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// ─────────────────────────────────────────────────────────────
// ASIGNATURAS
// ─────────────────────────────────────────────────────────────

async function openAsigModal(as) {
  if (as) {
    $('as-nombre').value = as.nombre;
    $('as-codigo').value = as.codigo || '';
    $('as-horas').value = as.horas || 4;
    $('as-desc').value = as.desc || '';
  } else {
    ['as-nombre', 'as-codigo', 'as-desc'].forEach(id => $(id).value = '');
    $('as-horas').value = 4;
  }

  $('modal-asig').style.display = 'flex';
  lucide.createIcons();
}

async function editAsignatura(id) {
  state.editingId = id;
  const a = await fetch('/api/asignaturas/' + id).then(r => r.json());
  openAsigModal(a);
}

async function saveAsignatura() {
  const data = {
    nombre: $('as-nombre').value.trim(),
    codigo: $('as-codigo').value,
    horas: parseInt($('as-horas').value) || 4,
    desc: $('as-desc').value,
  };

  if (!data.nombre) return showToast('⚠ Ingresa el nombre', 'err');

  try {
    if (state.editingId) await api.updateAsignatura(state.editingId, data);
    else await api.createAsignatura(data);

    closeModal('modal-asig');
    await renderAsignaturas();
    showToast('✓ Asignatura guardada');
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// ─────────────────────────────────────────────────────────────
// CURSOS
// ─────────────────────────────────────────────────────────────

async function openCursoModal(cu) {
  const profsRes = await api.getProfesores();
  const profs = unwrapList(profsRes);

  $('cu-jefe').innerHTML =
    '<option value="">Sin asignar</option>' +
    profs.map(p => `<option value="${p.id}">${p.nombres} ${p.apellidos}</option>`).join('');

  if (cu) {
    $('cu-nombre').value = cu.nombre;
    $('cu-nivel').value = cu.nivel;
    $('cu-anio').value = cu.anio || 2025;
    $('cu-jefe').value = cu.jefe_id || '';
  } else {
    $('cu-nombre').value = '';
    $('cu-nivel').value = 'Básico';
    $('cu-anio').value = 2025;
    $('cu-jefe').value = '';
  }

  $('modal-curso').style.display = 'flex';
  lucide.createIcons();
}

async function editCurso(id) {
  state.editingId = id;
  const c = await fetch('/api/cursos/' + id).then(r => r.json());
  openCursoModal(c);
}

async function saveCurso() {
  const data = {
    nombre: $('cu-nombre').value.trim(),
    nivel: $('cu-nivel').value,
    anio: parseInt($('cu-anio').value) || 2025,
    jefe_id: parseInt($('cu-jefe').value) || null,
  };

  if (!data.nombre) return showToast('⚠ Ingresa el nombre del curso', 'err');

  try {
    if (state.editingId) await api.updateCurso(state.editingId, data);
    else await api.createCurso(data);

    closeModal('modal-curso');
    await renderCursos();
    showToast('✓ Curso guardado');
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// ─────────────────────────────────────────────────────────────
// PROFESORES
// ─────────────────────────────────────────────────────────────

async function openProfModal(pr) {
  if (pr) {
    $('pr-nombres').value = pr.nombres;
    $('pr-apellidos').value = pr.apellidos;
    $('pr-rut').value = pr.rut || '';
    $('pr-email').value = pr.email || '';
    $('pr-esp').value = pr.especialidad || '';
    $('pr-estado').value = pr.estado;
  } else {
    ['pr-nombres', 'pr-apellidos', 'pr-rut', 'pr-email', 'pr-esp'].forEach(id => $(id).value = '');
    $('pr-estado').value = 'Activo';
  }

  $('modal-prof').style.display = 'flex';
  lucide.createIcons();
}

async function editProfesor(id) {
  state.editingId = id;
  const p = await fetch('/api/profesores/' + id).then(r => r.json());
  openProfModal(p);
}

async function saveProfesor() {
  const data = {
    nombres: $('pr-nombres').value.trim(),
    apellidos: $('pr-apellidos').value.trim(),
    rut: $('pr-rut').value,
    email: $('pr-email').value,
    especialidad: $('pr-esp').value,
    estado: $('pr-estado').value,
  };

  if (!data.nombres || !data.apellidos) {
    return showToast('⚠ Completa los campos obligatorios', 'err');
  }

  try {
    if (state.editingId) await api.updateProfesor(state.editingId, data);
    else await api.createProfesor(data);

    closeModal('modal-prof');
    await renderProfesores();
    showToast('✓ Profesor guardado');
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE GENÉRICO
// ─────────────────────────────────────────────────────────────

async function deleteItem(entity, id) {
  if (!confirm('¿Eliminar este registro?')) return;

  const apiMap = {
    notas: api.deleteNota,
    alumnos: api.deleteAlumno,
    asignaturas: api.deleteAsignatura,
    cursos: api.deleteCurso,
    profesores: api.deleteProfesor,
  };

  try {
    await apiMap[entity](id);
    await renderPage(state.page);
    showToast('✓ Eliminado');
  } catch (e) {
    showToast('Error: ' + e.message, 'err');
  }
}