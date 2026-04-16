// public/js/api.js
const BASE = '/api';

async function apiFetch(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la solicitud');
  }
  return res.json().catch(() => null);
}

const api = {
  getProfesores:     ()      => apiFetch('/profesores'),
  createProfesor:    (data)  => apiFetch('/profesores',       { method: 'POST',   body: JSON.stringify(data) }),
  updateProfesor:    (id, d) => apiFetch(`/profesores/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
  deleteProfesor:    (id)    => apiFetch(`/profesores/${id}`, { method: 'DELETE' }),

  getCursos:         ()      => apiFetch('/cursos'),
  createCurso:       (data)  => apiFetch('/cursos',       { method: 'POST',   body: JSON.stringify(data) }),
  updateCurso:       (id, d) => apiFetch(`/cursos/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
  deleteCurso:       (id)    => apiFetch(`/cursos/${id}`, { method: 'DELETE' }),

  getAlumnos:        (p = {}) => apiFetch('/alumnos?' + new URLSearchParams(p)),
  getAlumnoPromedio: (id)     => apiFetch(`/alumnos/${id}/promedio`),
  createAlumno:      (data)   => apiFetch('/alumnos',       { method: 'POST',   body: JSON.stringify(data) }),
  updateAlumno:      (id, d)  => apiFetch(`/alumnos/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
  deleteAlumno:      (id)     => apiFetch(`/alumnos/${id}`, { method: 'DELETE' }),

  getAsignaturas:    ()      => apiFetch('/asignaturas'),
  createAsignatura:  (data)  => apiFetch('/asignaturas',       { method: 'POST',   body: JSON.stringify(data) }),
  updateAsignatura:  (id, d) => apiFetch(`/asignaturas/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
  deleteAsignatura:  (id)    => apiFetch(`/asignaturas/${id}`, { method: 'DELETE' }),

  getNotas:          (p = {}) => apiFetch('/notas?' + new URLSearchParams(p)),
  getNotasStats:     ()       => apiFetch('/notas/stats'),
  createNota:        (data)   => apiFetch('/notas',       { method: 'POST',   body: JSON.stringify(data) }),
  updateNota:        (id, d)  => apiFetch(`/notas/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
  deleteNota:        (id)     => apiFetch(`/notas/${id}`, { method: 'DELETE' }),
};
