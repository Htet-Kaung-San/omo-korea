import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'How to use the PNU Library mobile app (부산대 도서관_PNUL)',
  'library.steps': 'Steps',
  'library.usageGuide': 'Usage guide',

  'library.install.title': 'Install the app',
  'library.install.step1':
    'Search "PNUL" or "부산대 도서관" on the [Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) or Apple App Store (iOS) and install.',
  'library.install.step2':
    'If you previously had the old "부산대 도서관" or "PNU Place" apps, those are deprecated — this new app replaces both.',
  'library.install.step3':
    'Log in with your PNU student portal credentials (same ID/password as [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)).',

  'library.seatReservation.title': 'Reading Room Seat Reservation (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'Only seats assigned through the app are valid — using an unassigned seat and getting caught results in a library usage restriction.',
  'library.seatReservation.tip2':
    'After reserving, you must pass through the entry gate within 15 minutes, or the assignment is cancelled.',
  'library.seatReservation.tip3':
    'Extensions open 2 hours before your session ends. Each extension adds 4 hours, and you can extend up to 4 times.',
  'library.seatReservation.tip4':
    'Extensions can be done either in the app or at the 좌석배정기 (seat-assignment kiosk) in the library.',
  'library.seatReservation.tip5': 'Seats are automatically returned when your time runs out.',
  'library.seatReservation.tip6':
    'Note: the 중앙도서관 (Central Library) is mainly a collections space — some of its reading areas do not require seat assignment at all.',
  'library.seatReservation.step1':
    'On the home screen, find the 좌석예약 (Seat Reservation) panel near the top. If you have no active reservation it will say "예약된 정보가 없습니다" (No reservation info). Tap 배정신청 (Request Assignment) to start a new reservation, or 이용내역 (Usage History) to see past ones.',
  'library.seatReservation.step2':
    'Pick your building from the tab row — 나노생명, 의생명, 미리내, 새벽벌, or 중앙.',
  'library.seatReservation.step3':
    'Pick a floor (1층, 2층, ...), then a room type tab within that floor (e.g. [새벽벌]열람실 for the reading room vs. [새벽벌]PC for the PC zone).',
  'library.seatReservation.step4':
    'You will see live occupancy for each zone as a ring chart — e.g. "새벽누리-열람존 34/73" means 34 of 73 seats are taken, 39 open.',
  'library.seatReservation.step5':
    'Tap into a zone to pick an individual seat and confirm.',
  'library.seatReservation.image.homeScreen':
    'Home screen — 좌석예약 panel with 배정신청 button',
  'library.seatReservation.image.buildingFloor':
    'Building, floor, and zone selection with live seat occupancy',

  'library.libraryCard.title': 'Library Card / 이용증',
  'library.libraryCard.step1': 'Open the app and log in via 메뉴 (Menu) → LOGIN at the top.',
  'library.libraryCard.step2':
    'Tap 이용증 in the bottom navigation bar — the bottom nav reads MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴, so it is a direct tab, not buried in a menu.',
  'library.libraryCard.step3':
    'The 이용증 screen displays a QR code — this is your mobile library card. Scan it at the library entry gate to get in.',
}

export default messages
