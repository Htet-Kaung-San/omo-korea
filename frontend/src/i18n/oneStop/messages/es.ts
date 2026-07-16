import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'Guías paso a paso para onestop.pusan.ac.kr',
  'oneStop.steps': 'Pasos',
  'oneStop.relatedPages': 'Páginas relacionadas',
  'oneStop.note': 'Nota',

  'oneStop.registration.title': 'Inscripción de cursos (수강신청)',
  'oneStop.registration.step1':
    'Inicia sesión en [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) con tu número de estudiante y contraseña.',
  'oneStop.registration.step2':
    'Ve a 수업 (Classes) → 수강신청및확인 (Registration & Confirmation).',
  'oneStop.registration.step3':
    'Consulta primero el catálogo de cursos: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — busca por departamento, revisa las secciones abiertas, verifica los límites de cupo.',
  'oneStop.registration.step4':
    'Durante el período de inscripción, el envío real se hace en el sistema de inscripción separado: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (web de PC o móvil). Es un sitio diferente de One-Stop — no te confundas si te redirigen aquí.',
  'oneStop.registration.step5':
    'Después de enviar, vuelve a One-Stop → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) para confirmar que tus cursos se registraron realmente — hazlo cada vez, ya que la "wishlist" (희망과목담기) no equivale a una inscripción confirmada.',
  'oneStop.registration.related.addDrop': 'Agregar/Quitar cursos (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'Cancelación de curso (수강취소)',
  'oneStop.registration.related.timetable': 'Ver horario (시간표조회)',
  'oneStop.registration.note':
    'La inscripción solo se abre en ventanas específicas del calendario académico (normalmente listadas en la página principal de One-Stop). Revisa las fechas con anticipación — el sistema solo es usable durante estos períodos.',

  'oneStop.cancellation.title': 'Cancelación de curso / Retiro (수강취소)',
  'oneStop.cancellation.step1':
    'Inicia sesión en [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.cancellation.step2':
    'Ve a 수업 (Classes) → 수강취소 (Course Cancellation): [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'Selecciona el/los curso(s) que deseas cancelar y confirma.',
  'oneStop.cancellation.step4':
    'Después, vuelve a revisar [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) para confirmar que el curso ya no aparece en tu horario activo.',
  'oneStop.cancellation.note':
    'Esto es diferente de 수강정정 (add/drop), que ocurre al inicio del semestre sin dejar registro. 수강취소 se abre más tarde en el semestre (normalmente una ventana corta después de los parciales) y deja una marca W (Withdrawal) en el expediente en lugar de eliminar el curso por completo. Las fechas exactas se establecen cada semestre en el calendario académico.',

  'oneStop.grades.title': 'Consulta de calificaciones (성적확인)',
  'oneStop.grades.step1':
    'Inicia sesión en [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.grades.step2': 'Ve a 수업 (Classes) → sección de calificaciones.',
  'oneStop.grades.step3':
    'Semestre actual: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'Todos los semestres: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'Las calificaciones del semestre actual generalmente solo son visibles después de que cierra la publicación de notas finales — si aparece vacío, es posible que las notas aún no se hayan publicado.',

  'oneStop.tuition.title': 'Matrícula — Factura y confirmación de pago (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    'Inicia sesión en [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.tuition.step2': 'Ve al menú 등록 (Registration/Tuition).',
  'oneStop.tuition.step3': 'Imprime/consulta tu factura: 고지서출력 (Bill Print).',
  'oneStop.tuition.step4':
    'Anota el código de pago escolar que aparece en la factura (varía según el banco — NH, Busan Bank, Hana, etc.) y paga mediante transferencia bancaria, cajero automático, banca por internet/teléfono o en persona en el banco.',
  'oneStop.tuition.step5':
    'Confirma que el pago se realizó: 납부확인 (Payment Confirmation / Receipt Print) — verifica después de pagar, ya que el pago no siempre se refleja al instante.',
  'oneStop.tuition.note':
    'Las facturas de matrícula no pueden solicitarse por teléfono/correo/fax en tu nombre — debes acceder tú mismo con tu propio inicio de sesión.',

  'oneStop.leaveReturn.title': 'Licencia de estudios / Regreso a clases (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    'Inicia sesión en [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.leaveReturn.step2':
    'Solicitar licencia de estudios: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'Solicitar regreso a clases: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'Ambos tienen ventanas de solicitud específicas cada semestre (consulta el calendario académico en la página principal de One-Stop) — solicitar fuera del período puede no ser posible.',
}

export default messages
