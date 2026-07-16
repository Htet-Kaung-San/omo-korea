import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'Cara menggunakan aplikasi seluler Perpustakaan PNU (부산대 도서관_PNUL)',
  'library.steps': 'Langkah',
  'library.usageGuide': 'Panduan penggunaan',

  'library.install.title': 'Instal aplikasi',
  'library.install.step1':
    'Cari "PNUL" atau "부산대 도서관" di [Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) atau Apple App Store (iOS) lalu instal.',
  'library.install.step2':
    'Jika sebelumnya Anda memakai aplikasi lama "부산대 도서관" atau "PNU Place", aplikasi tersebut sudah tidak digunakan — aplikasi baru ini menggantikan keduanya.',
  'library.install.step3':
    'Masuk dengan kredensial portal mahasiswa PNU (ID/kata sandi sama dengan [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)).',

  'library.seatReservation.title': 'Reservasi Kursi Ruang Baca (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'Hanya kursi yang ditetapkan melalui aplikasi yang sah — menggunakan kursi tanpa penugasan dan tertangkap akan mengakibatkan pembatasan penggunaan perpustakaan.',
  'library.seatReservation.tip2':
    'Setelah reservasi, Anda harus melewati gerbang masuk dalam 15 menit, atau penugasan dibatalkan.',
  'library.seatReservation.tip3':
    'Perpanjangan dibuka 2 jam sebelum sesi berakhir. Setiap perpanjangan menambah 4 jam, dan Anda dapat memperpanjang hingga 4 kali.',
  'library.seatReservation.tip4':
    'Perpanjangan dapat dilakukan di aplikasi atau di 좌석배정기 (mesin penugasan kursi) di perpustakaan.',
  'library.seatReservation.tip5': 'Kursi otomatis dikembalikan saat waktu habis.',
  'library.seatReservation.tip6':
    'Catatan: 중앙도서관 (Perpustakaan Pusat) terutama ruang koleksi — beberapa area baca tidak memerlukan penugasan kursi sama sekali.',
  'library.seatReservation.step1':
    'Di layar beranda, temukan panel 좌석예약 (Reservasi Kursi) di bagian atas. Jika tidak ada reservasi aktif akan tertulis "예약된 정보가 없습니다" (Tidak ada info reservasi). Ketuk 배정신청 (Ajukan Penugasan) untuk reservasi baru, atau 이용내역 (Riwayat Penggunaan) untuk melihat yang lalu.',
  'library.seatReservation.step2':
    'Pilih gedung dari baris tab — 나노생명, 의생명, 미리내, 새벽벌, atau 중앙.',
  'library.seatReservation.step3':
    'Pilih lantai (1층, 2층, ...), lalu tab jenis ruang di lantai itu (mis. [새벽벌]열람실 untuk ruang baca vs. [새벽벌]PC untuk zona PC).',
  'library.seatReservation.step4':
    'Anda akan melihat okupansi langsung setiap zona sebagai grafik cincin — mis. "새벽누리-열람존 34/73" berarti 34 dari 73 kursi terisi, 39 kosong.',
  'library.seatReservation.step5':
    'Ketuk zona untuk memilih kursi individual dan konfirmasi.',
  'library.seatReservation.image.homeScreen':
    'Layar beranda — panel 좌석예약 dengan tombol 배정신청',
  'library.seatReservation.image.buildingFloor':
    'Pemilihan gedung, lantai, dan zona dengan okupansi kursi langsung',

  'library.libraryCard.title': 'Kartu Perpustakaan / 이용증',
  'library.libraryCard.step1': 'Buka aplikasi dan masuk via 메뉴 (Menu) → LOGIN di atas.',
  'library.libraryCard.step2':
    'Ketuk 이용증 di bilah navigasi bawah — nav bawah berbunyi MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴, jadi tab langsung, bukan tersembunyi di menu.',
  'library.libraryCard.step3':
    'Layar 이용증 menampilkan kode QR — ini kartu perpustakaan seluler Anda. Pindai di gerbang masuk perpustakaan untuk masuk.',
}

export default messages
