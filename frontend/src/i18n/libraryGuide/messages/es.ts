import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'Cómo usar la app móvil de la Biblioteca PNU (부산대 도서관_PNUL)',
  'library.steps': 'Pasos',
  'library.usageGuide': 'Guía de uso',

  'library.install.title': 'Instalar la app',
  'library.install.step1':
    'Busca "PNUL" o "부산대 도서관" en [Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) o Apple App Store (iOS) e instálala.',
  'library.install.step2':
    'Si antes usabas las apps antiguas "부산대 도서관" o "PNU Place", ya no están disponibles — esta nueva app las reemplaza.',
  'library.install.step3':
    'Inicia sesión con tus credenciales del portal estudiantil PNU (mismo ID/contraseña que [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)).',

  'library.seatReservation.title': 'Reserva de asientos en sala de lectura (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'Solo son válidos los asientos asignados por la app — usar un asiento sin asignación y ser detectado conlleva restricción de uso de la biblioteca.',
  'library.seatReservation.tip2':
    'Tras reservar, debes pasar por la puerta de entrada en 15 minutos, o la asignación se cancela.',
  'library.seatReservation.tip3':
    'Las extensiones se abren 2 horas antes de que termine tu sesión. Cada extensión añade 4 horas, y puedes extender hasta 4 veces.',
  'library.seatReservation.tip4':
    'Las extensiones se pueden hacer en la app o en el 좌석배정기 (quiosco de asignación de asientos) de la biblioteca.',
  'library.seatReservation.tip5': 'Los asientos se devuelven automáticamente cuando se acaba el tiempo.',
  'library.seatReservation.tip6':
    'Nota: la 중앙도서관 (Biblioteca Central) es principalmente un espacio de colecciones — algunas zonas de lectura no requieren asignación de asiento.',
  'library.seatReservation.step1':
    'En la pantalla de inicio, busca el panel 좌석예약 (Reserva de asientos) cerca de arriba. Si no tienes reserva activa dirá "예약된 정보가 없습니다" (Sin información de reserva). Toca 배정신청 (Solicitar asignación) para una nueva reserva, o 이용내역 (Historial de uso) para ver anteriores.',
  'library.seatReservation.step2':
    'Elige el edificio en la fila de pestañas — 나노생명, 의생명, 미리내, 새벽벌 o 중앙.',
  'library.seatReservation.step3':
    'Elige un piso (1층, 2층, ...), luego la pestaña de tipo de sala en ese piso (p. ej. [새벽벌]열람실 para sala de lectura vs. [새벽벌]PC para zona PC).',
  'library.seatReservation.step4':
    'Verás la ocupación en vivo de cada zona como gráfico circular — p. ej. "새벽누리-열람존 34/73" significa 34 de 73 asientos ocupados, 39 libres.',
  'library.seatReservation.step5':
    'Entra en una zona, elige un asiento individual y confirma.',
  'library.seatReservation.image.homeScreen':
    'Pantalla de inicio — panel 좌석예약 con botón 배정신청',
  'library.seatReservation.image.buildingFloor':
    'Selección de edificio, piso y zona con ocupación de asientos en vivo',

  'library.libraryCard.title': 'Tarjeta de biblioteca / 이용증',
  'library.libraryCard.step1': 'Abre la app e inicia sesión en 메뉴 (Menú) → LOGIN arriba.',
  'library.libraryCard.step2':
    'Toca 이용증 en la barra de navegación inferior — la barra inferior dice MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴, es una pestaña directa, no está en un submenú.',
  'library.libraryCard.step3':
    'La pantalla 이용증 muestra un código QR — es tu tarjeta de biblioteca móvil. Escanéalo en la puerta de entrada de la biblioteca.',
}

export default messages
