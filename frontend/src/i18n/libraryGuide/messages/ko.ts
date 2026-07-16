import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': '부산대 도서관 모바일 앱(부산대 도서관_PNUL) 이용 안내',
  'library.steps': '단계',
  'library.usageGuide': '이용 안내',

  'library.install.title': '앱 설치',
  'library.install.step1':
    '[Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib)(Android) 또는 Apple App Store(iOS)에서 "PNUL" 또는 "부산대 도서관"을 검색해 설치하세요.',
  'library.install.step2':
    '이전에 "부산대 도서관" 또는 "PNU Place" 앱을 사용하셨다면, 해당 앱은 더 이상 지원되지 않으며 이 새 앱으로 대체됩니다.',
  'library.install.step3':
    'PNU 학생 포털 계정([onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)과 동일한 ID/비밀번호)으로 로그인하세요.',

  'library.seatReservation.title': '열람실 좌석예약',
  'library.seatReservation.tip1':
    '앱을 통해 배정받은 좌석만 이용할 수 있습니다. 배정되지 않은 좌석을 사용하다 적발되면 도서관 이용이 제한됩니다.',
  'library.seatReservation.tip2':
    '예약 후 15분 이내에 입구 게이트를 통과해야 하며, 그렇지 않으면 배정이 취소됩니다.',
  'library.seatReservation.tip3':
    '연장은 이용 시간 종료 2시간 전부터 가능합니다. 한 번 연장할 때마다 4시간이 추가되며, 최대 4회까지 연장할 수 있습니다.',
  'library.seatReservation.tip4':
    '연장은 앱 또는 도서관 내 좌석배정기에서 할 수 있습니다.',
  'library.seatReservation.tip5': '이용 시간이 끝나면 좌석은 자동으로 반납됩니다.',
  'library.seatReservation.tip6':
    '참고: 중앙도서관은 주로 장서 보관 공간으로, 일부 열람 구역은 좌석 배정 없이 이용할 수 있습니다.',
  'library.seatReservation.step1':
    '홈 화면 상단 근처의 좌석예약 패널을 확인하세요. 예약이 없으면 "예약된 정보가 없습니다"라고 표시됩니다. 새 예약을 시작하려면 배정신청을, 지난 이용 내역을 보려면 이용내역을 탭하세요.',
  'library.seatReservation.step2':
    '탭 행에서 건물을 선택하세요 — 나노생명, 의생명, 미리내, 새벽벌, 또는 중앙.',
  'library.seatReservation.step3':
    '층(1층, 2층, …)을 선택한 뒤, 해당 층의 공간 유형 탭을 선택하세요(예: [새벽벌]열람실은 열람실, [새벽벌]PC는 PC존).',
  'library.seatReservation.step4':
    '각 구역의 실시간 좌석 점유율이 원형 차트로 표시됩니다 — 예: "새벽누리-열람존 34/73"은 73석 중 34석이 사용 중이고 39석이 비어 있다는 뜻입니다.',
  'library.seatReservation.step5':
    '구역을 탭해 개별 좌석을 선택하고 확인하세요.',
  'library.seatReservation.image.homeScreen':
    '홈 화면 — 배정신청 버튼이 있는 좌석예약 패널',
  'library.seatReservation.image.buildingFloor':
    '건물·층·구역 선택 및 실시간 좌석 점유 현황',

  'library.libraryCard.title': '이용증',
  'library.libraryCard.step1': '앱을 열고 상단 메뉴 → LOGIN으로 로그인하세요.',
  'library.libraryCard.step2':
    '하단 내비게이션 바에서 이용증을 탭하세요 — 하단 메뉴는 MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴 순이며, 별도 메뉴가 아닌 직접 탭입니다.',
  'library.libraryCard.step3':
    '이용증 화면에 QR 코드가 표시됩니다 — 이것이 모바일 도서관 이용증입니다. 도서관 입구 게이트에서 스캔해 입장하세요.',
}

export default messages
