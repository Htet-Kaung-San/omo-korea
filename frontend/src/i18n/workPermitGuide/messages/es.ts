import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'Permiso de trabajo a tiempo parcial para estudiantes internacionales (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'Importante',
  'workPermit.disclaimer':
    'Esto es **ley de inmigración** — no un formulario del campus. Datos incorrectos pueden acarrear multas, prohibición de trabajar o pérdida del estatus de estudiante. Confirme con **Asuntos Internacionales de PNU (국제처)** o la línea **1345** antes de solicitar.',
  'workPermit.sourceDate':
    'Basado en la guía del MOJ, feb. 2026. Las normas oficiales pueden cambiar — consulte [Hi Korea](https://www.hikorea.go.kr) para actualizaciones.',
  'workPermit.keyPoints': 'Puntos clave',
  'workPermit.steps': 'Pasos',
  'workPermit.relatedPages': 'Enlaces relacionados',
  'workPermit.note': 'Nota',

  'workPermit.basics.title': '¿Necesita un permiso? (기본원칙)',
  'workPermit.basics.point1':
    'Los titulares de visa de estudiante D-2 **no pueden trabajar ni obtener ingresos** en Corea sin permiso — incluidos trabajos a tiempo parcial (아르바이트).',
  'workPermit.basics.point2':
    'Con la aprobación de **ambos**, la universidad y la inmigración, se permite un trabajo a tiempo parcial limitado.',
  'workPermit.basics.point3':
    'Empleos especializados (E-1~E-7, p. ej. enseñanza de idiomas) suelen requerir un **체류자격외 활동허가** separado — no este permiso.',
  'workPermit.basics.note':
    'Esta guía cubre solo trabajo a tiempo parcial estándar. Permisos de investigación/cuidado doméstico son temas aparte.',

  'workPermit.eligibility.title': 'Elegibilidad (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** C (2.0) o superior en el semestre más reciente. Primer semestre: exento si no hay expediente, pero las horas se limitan a la mitad.',
  'workPermit.eligibility.point2':
    '**Idioma:** Vea la tabla. Si no cumple el requisito de idioma pero lo demás está bien, puede obtener permiso con **la mitad de las horas normales**.',
  'workPermit.eligibility.point3':
    '**Duración de estancia:** Estudiantes de intercambio/visita (D-2-8) deben esperar **6 meses** tras la entrada o cambio de estatus.',
  'workPermit.eligibility.point4':
    '**Antecedentes limpios:** Sin infracciones de trabajo a tiempo parcial en los últimos 3 meses.',
  'workPermit.eligibility.languageTable.title': 'Requisitos de idioma',
  'workPermit.eligibility.languageTable.colLevel': 'Quién',
  'workPermit.eligibility.languageTable.colKorean': 'Programa en coreano',
  'workPermit.eligibility.languageTable.colEnglish': 'Programa en inglés (cualquier año)',
  'workPermit.eligibility.languageTable.row1Level': 'Licenciatura, años 1–2',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-step+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'Licenciatura Y3–4 y posgrado',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-step+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'Igual que arriba',
  'workPermit.eligibility.note':
    'Estudiantes en programa en inglés usan la columna de inglés en lugar de los requisitos en coreano.',

  'workPermit.hours.title': 'Horas permitidas (허용 시간)',
  'workPermit.hours.table.title': 'Límites de horas de trabajo parcial (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Programa',
  'workPermit.hours.table.colYear': 'Año',
  'workPermit.hours.table.colKoreanCriteria': 'Dominio del coreano',
  'workPermit.hours.table.colMet': '¿Cumple?',
  'workPermit.hours.table.colAllowedHours': 'Horas permitidas',
  'workPermit.hours.table.colWeekday': 'Días laborables',
  'workPermit.hours.table.colWeekend': 'Fines de semana · vacaciones',
  'workPermit.hours.table.colBonus': 'Univ. certificada,\nnotas excelentes,\ncoreano excelente\n(días laborables)',
  'workPermit.hours.table.bachelor': 'Licenciatura',
  'workPermit.hours.table.bachelorY12': 'A1–2',
  'workPermit.hours.table.bachelorY34': 'A3–4',
  'workPermit.hours.table.grad': 'MA/PhD',
  'workPermit.hours.table.anyYear': 'Cualquiera',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 h',
  'workPermit.hours.table.hours15': '15 h',
  'workPermit.hours.table.hours25': '25 h',
  'workPermit.hours.table.hours30': '30 h',
  'workPermit.hours.table.hours35': '35 h',
  'workPermit.hours.table.unlimited': 'Sin límite',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK Nivel 3\n② KIIP Nivel 3+ o pre-evaluación 61+\n③ Sejong Institute Intermedio 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK Nivel 4\n② KIIP Nivel 4+ o pre-evaluación 81+\n③ Sejong Institute Intermedio 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK Nivel 4\n② KIIP Nivel 4+ o pre-evaluación 81+\n③ Sejong Institute Intermedio 2+',
  'workPermit.hours.bonus1':
    'La columna más a la derecha aplica si cumple requisitos de idioma Y califica como: estudiante de universidad certificada, todas A el semestre anterior, o TOPIK 5+ / KIIP 5-step+.',
  'workPermit.hours.bonus2':
    'Cuando está marcado **O**, fines de semana, festivos y vacaciones escolares **sin límite de horas**.',
  'workPermit.hours.bonus3':
    'Aún necesita un permiso real — los límites de la tabla no son automáticos.',
  'workPermit.hours.note':
    'Cuando está marcado **X**, el mismo límite aplica en días laborables, fines de semana y vacaciones. Estudiantes en programa en inglés usan puntuaciones en inglés en lugar de la columna de coreano.',

  'workPermit.documents.title': 'Documentos requeridos (제출 서류)',
  'workPermit.documents.item1':
    'Formulario, pasaporte, Alien Registration Card (ARC) — **sin tarifa**',
  'workPermit.documents.item2': 'Expediente académico (성적증명서)',
  'workPermit.documents.item3': 'Prueba de coreano o inglés',
  'workPermit.documents.item4':
    'Confirmación universitaria: 외국인 유학생 시간제 취업 확인서 (emitida por **Asuntos Internacionales de PNU**)',
  'workPermit.documents.item5':
    'Confirmación de cumplimiento: 외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    'Registro comercial del empleador + ID del empleador, y contrato laboral estándar (salario por hora, funciones, horas indicadas)',
  'workPermit.documents.item7':
    'Empleadores de manufactura/construcción: formulario de cumplimiento adicional',
  'workPermit.documents.note':
    'El contrato debe ser directamente con el negocio registrado — agencias de personal / dispatch **no permitidos**.',

  'workPermit.apply.title': 'Cómo solicitar (신청 방법)',
  'workPermit.apply.step1':
    'Primero la aprobación universitaria — en PNU, contacte **Asuntos Internacionales (국제처)** para los formularios de confirmación.',
  'workPermit.apply.step2':
    'Solicite en la oficina de inmigración local o en línea vía [Hi Korea](https://www.hikorea.go.kr) → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    'La aprobación cubre hasta **2 lugares de trabajo** a la vez, válida por el resto de la estancia (máx. 1 año por aprobación).',
  'workPermit.apply.step4':
    '**¿Cambia de trabajo?** Obtenga un nuevo permiso **antes** de empezar en el nuevo lugar — no retroactivo.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (portal oficial de inmigración)',
  'workPermit.apply.note':
    '**Busan Immigration (부산출입국·외국인청):** Korean Air bldg 1F, 146 Jungang-daero, Jung-gu · Metro: Busan Stn (L1) Exit 2 o Jungang Exit 14 · Lun–Vie 9:00–18:00 (almuerzo 12:00–13:00) · **1345** (línea multilingüe)',

  'workPermit.restrictions.title': 'Trabajos restringidos (제한대상)',
  'workPermit.restrictions.item1':
    'Manufactura/construcción (TOPIK 4+ para manufactura; construcción prácticamente nunca — una infracción = orden de salida)',
  'workPermit.restrictions.item2': 'Tutoría privada uno a uno (개인과외)',
  'workPermit.restrictions.item3':
    'Entretenimiento para adultos / nightlife (bares con hostess, masajes/baños, moteles, salas de juegos, etc.)',
  'workPermit.restrictions.item4':
    'Trabajos de plataforma: repartidores, mensajeros, designated driver, seguros/ventas puerta a puerta',
  'workPermit.restrictions.item5': 'Puestos solo remote / telecommute',
  'workPermit.restrictions.item6': 'Empleos a través de agencias de personal o dispatch/intermediación laboral',

  'workPermit.violations.title': 'Sanciones (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Situación',
  'workPermit.violations.table.colResult': 'Consecuencia',
  'workPermit.violations.table.row1Situation': 'Trabajar sin permiso',
  'workPermit.violations.table.row1Result':
    'Empleo ilegal — sanción; sector construcción = orden de salida',
  'workPermit.violations.table.row2Situation': '1.ª infracción del permiso (horas/lugar incorrectos)',
  'workPermit.violations.table.row2Result': 'Advertencia formal',
  'workPermit.violations.table.row3Situation': '2.ª infracción',
  'workPermit.violations.table.row3Result': 'Prohibido trabajar a tiempo parcial el resto de los estudios',
  'workPermit.violations.table.row4Situation': '3.ª infracción',
  'workPermit.violations.table.row4Result': 'Estatus de estudiante (유학자격) puede revocarse',
  'workPermit.violations.note':
    'Incluso una primera infracción por trabajo sin permiso puede ser grave. En caso de duda, llame al **1345** antes de empezar cualquier trabajo.',
}

export default messages
