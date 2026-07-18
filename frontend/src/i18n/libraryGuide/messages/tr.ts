import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'PNU Kütüphanesi mobil uygulaması (부산대 도서관_PNUL) kullanım kılavuzu',
  'library.steps': 'Adımlar',
  'library.usageGuide': 'Kullanım kılavuzu',

  'library.install.title': 'Uygulamayı yükle',
  'library.install.step1':
    '[Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) veya Apple App Store (iOS) üzerinde "PNUL" veya "부산대 도서관" arayıp yükleyin.',
  'library.install.step2':
    'Daha önce eski "부산대 도서관" veya "PNU Place" uygulamalarını kullandıysanız, bunlar kaldırıldı — bu yeni uygulama ikisinin yerini alır.',
  'library.install.step3':
    'PNU öğrenci portalı bilgilerinizle giriş yapın ([onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) ile aynı ID/şifre).',

  'library.seatReservation.title': 'Okuma Salonu Koltuk Rezervasyonu (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'Yalnızca uygulama üzerinden atanan koltuklar geçerlidir — atanmamış koltuk kullanıp yakalanmak kütüphane kullanım kısıtlamasına yol açar.',
  'library.seatReservation.tip2':
    'Rezervasyondan sonra 15 dakika içinde giriş kapısından geçmelisiniz, aksi halde atama iptal edilir.',
  'library.seatReservation.tip3':
    'Uzatma, oturum bitmeden 2 saat önce açılır. Her uzatma 4 saat ekler, en fazla 4 kez uzatabilirsiniz.',
  'library.seatReservation.tip4':
    'Uzatma uygulamada veya kütüphanedeki 좌석배정기 (koltuk atama kioskunda) yapılabilir.',
  'library.seatReservation.tip5': 'Süre dolduğunda koltuk otomatik olarak iade edilir.',
  'library.seatReservation.tip6':
    'Not: 중앙도서관 (Merkez Kütüphane) esas olarak koleksiyon alanıdır — bazı okuma alanlarında koltuk ataması hiç gerekmez.',
  'library.seatReservation.step1':
    'Ana ekranda üst kısımdaki 좌석예약 (Koltuk Rezervasyonu) panelini bulun. Aktif rezervasyon yoksa "예약된 정보가 없습니다" (Rezervasyon bilgisi yok) yazar. Yeni rezervasyon için 배정신청 (Atama Talebi), geçmiş için 이용내역 (Kullanım Geçmişi) dokunun.',
  'library.seatReservation.step2':
    'Sekme satırından binayı seçin — 나노생명, 의생명, 미리내, 새벽벌 veya 중앙.',
  'library.seatReservation.step3':
    'Kat seçin (1층, 2층, ...), ardından o kattaki oda türü sekmesini (ör. [새벽벌]열람실 okuma salonu vs. [새벽벌]PC PC bölgesi).',
  'library.seatReservation.step4':
    'Her bölgenin canlı doluluk oranı halka grafikte görünür — örn. "새벽누리-열람존 34/73" 73 koltuktan 34\'ünün dolu, 39\'unun boş olduğu anlamına gelir.',
  'library.seatReservation.step5':
    'Bölgeye girip tek bir koltuk seçin ve onaylayın.',
  'library.seatReservation.image.homeScreen':
    'Ana ekran — 배정신청 düğmeli 좌석예약 paneli',
  'library.seatReservation.image.buildingFloor':
    'Bina, kat ve bölge seçimi ile canlı koltuk doluluk oranı',

  'library.libraryCard.title': 'Kütüphane Kartı / 이용증',
  'library.libraryCard.step1': 'Uygulamayı açın ve üstteki 메뉴 (Menu) → LOGIN ile giriş yapın.',
  'library.libraryCard.step2':
    'Alt gezinme çubuğunda 이용증 dokunun — alt nav MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴 şeklinde, doğrudan sekme, menüde gizli değil.',
  'library.libraryCard.step3':
    '이용증 ekranı QR kod gösterir — bu mobil kütüphane kartınızdır. Giriş için kütüphane kapısında taratın.',
}

export default messages
