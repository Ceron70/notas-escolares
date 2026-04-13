const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Profesores
  const profesores = await prisma.profesor.createMany({
    data: [
      { nombres: 'Carlos',  apellidos: 'Vidal Rojas',    rut: '12.345.678-9', email: 'c.vidal@colegio.cl',   especialidad: 'Matemáticas' },
      { nombres: 'Ana',     apellidos: 'Morales Pérez',  rut: '13.456.789-0', email: 'a.morales@colegio.cl', especialidad: 'Lenguaje'    },
      { nombres: 'Roberto', apellidos: 'Fuentes Silva',  rut: '14.567.890-1', email: 'r.fuentes@colegio.cl', especialidad: 'Ciencias'    },
      { nombres: 'Claudia', apellidos: 'Torres Lagos',   rut: '15.678.901-2', email: 'c.torres@colegio.cl',  especialidad: 'Historia'    },
    ]
  });

  // Cursos
  const cursos = await prisma.curso.createMany({
    data: [
      { nombre: '1°A Básico', nivel: 'Básico', anio: 2025, jefe_id: 1 },
      { nombre: '2°B Básico', nivel: 'Básico', anio: 2025, jefe_id: 2 },
      { nombre: '1°A Medio',  nivel: 'Medio',  anio: 2025, jefe_id: 3 },
    ]
  });

  // Alumnos
  await prisma.alumno.createMany({
    data: [
      { nombres: 'Valentina', apellidos: 'González Díaz',   rut: '22.111.222-3', nac: '2012-03-15', curso_id: 1, email: 'vgonzalez@mail.cl', tel: '+56 9 1111 2222' },
      { nombres: 'Matías',    apellidos: 'Hernández Muñoz', rut: '22.333.444-5', nac: '2012-07-22', curso_id: 1, email: 'mhernandez@mail.cl', tel: '+56 9 2222 3333' },
      { nombres: 'Isidora',   apellidos: 'Ramírez Castro',  rut: '22.555.666-7', nac: '2011-11-05', curso_id: 2, email: 'iramirez@mail.cl',   tel: '+56 9 3333 4444' },
      { nombres: 'Diego',     apellidos: 'López Soto',      rut: '22.777.888-9', nac: '2011-01-30', curso_id: 2, email: 'dlopez@mail.cl',     tel: '+56 9 4444 5555' },
      { nombres: 'Camila',    apellidos: 'Martínez Bravo',  rut: '23.000.111-2', nac: '2009-06-18', curso_id: 3, email: 'cmartinez@mail.cl',  tel: '+56 9 5555 6666' },
      { nombres: 'Sebastián', apellidos: 'Rojas Lara',      rut: '23.222.333-4', nac: '2009-09-11', curso_id: 3, email: 'srojas@mail.cl',     tel: '+56 9 6666 7777' },
    ]
  });

  // Asignaturas
  await prisma.asignatura.createMany({
    data: [
      { nombre: 'Matemáticas', codigo: 'MAT-01', horas: 6, desc: 'Álgebra y geometría'      },
      { nombre: 'Lenguaje',    codigo: 'LEN-01', horas: 6, desc: 'Comunicación y literatura' },
      { nombre: 'Ciencias',    codigo: 'CIE-01', horas: 4, desc: 'Ciencias naturales'        },
      { nombre: 'Historia',    codigo: 'HIS-01', horas: 4, desc: 'Historia de Chile'         },
      { nombre: 'Inglés',      codigo: 'ING-01', horas: 3, desc: 'Idioma inglés'             },
    ]
  });

  // Notas
  await prisma.nota.createMany({
    data: [
      { alumno_id: 1, asig_id: 1, prof_id: 1, valor: 6.5, tipo: 'Prueba',  fecha: new Date('2025-03-20') },
      { alumno_id: 1, asig_id: 2, prof_id: 2, valor: 5.8, tipo: 'Control', fecha: new Date('2025-03-22') },
      { alumno_id: 2, asig_id: 1, prof_id: 1, valor: 4.2, tipo: 'Prueba',  fecha: new Date('2025-03-20') },
      { alumno_id: 2, asig_id: 3, prof_id: 3, valor: 6.0, tipo: 'Tarea',   fecha: new Date('2025-04-01') },
      { alumno_id: 3, asig_id: 2, prof_id: 2, valor: 7.0, tipo: 'Prueba',  fecha: new Date('2025-03-25') },
      { alumno_id: 3, asig_id: 4, prof_id: 4, valor: 5.5, tipo: 'Trabajo', fecha: new Date('2025-04-03') },
      { alumno_id: 4, asig_id: 1, prof_id: 1, valor: 3.8, tipo: 'Prueba',  fecha: new Date('2025-03-20') },
      { alumno_id: 5, asig_id: 5, prof_id: 2, valor: 6.2, tipo: 'Examen',  fecha: new Date('2025-04-10') },
      { alumno_id: 6, asig_id: 3, prof_id: 3, valor: 5.0, tipo: 'Control', fecha: new Date('2025-04-05') },
      { alumno_id: 1, asig_id: 3, prof_id: 3, valor: 6.8, tipo: 'Tarea',   fecha: new Date('2025-04-12') },
    ]
  });

  console.log('✅ Seed completado!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());