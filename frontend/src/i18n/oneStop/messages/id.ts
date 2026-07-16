import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'Panduan langkah demi langkah untuk onestop.pusan.ac.kr',
  'oneStop.steps': 'Langkah',
  'oneStop.relatedPages': 'Halaman terkait',
  'oneStop.note': 'Catatan',

  'oneStop.registration.title': 'Pendaftaran Kursus (수강신청)',
  'oneStop.registration.step1':
    'Masuk ke [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) dengan ID mahasiswa dan kata sandi Anda.',
  'oneStop.registration.step2':
    'Buka 수업 (Classes) → 수강신청및확인 (Registration & Confirmation).',
  'oneStop.registration.step3':
    'Periksa katalog kursus terlebih dahulu: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — cari berdasarkan departemen, lihat kelas yang dibuka, periksa batas kursi.',
  'oneStop.registration.step4':
    'Selama periode pendaftaran, pengajuan sebenarnya dilakukan di sistem pendaftaran terpisah: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (web PC atau seluler). Ini situs berbeda dari One-Stop — jangan bingung jika dialihkan ke sini.',
  'oneStop.registration.step5':
    'Setelah mengajukan, kembali ke One-Stop → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) untuk memastikan kursus benar-benar terdaftar — lakukan setiap kali, karena "wishlist" (희망과목담기) tidak sama dengan pendaftaran yang dikonfirmasi.',
  'oneStop.registration.related.addDrop': 'Tambah/Hapus Kursus (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'Pembatalan Kursus (수강취소)',
  'oneStop.registration.related.timetable': 'Lihat Jadwal (시간표조회)',
  'oneStop.registration.note':
    'Pendaftaran hanya dibuka pada jendela waktu tertentu sesuai kalender akademik (biasanya tercantum di beranda One-Stop). Periksa tanggal sebelumnya — sistem hanya dapat digunakan selama periode ini.',

  'oneStop.cancellation.title': 'Pembatalan Kursus / Penarikan (수강취소)',
  'oneStop.cancellation.step1':
    'Masuk ke [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.cancellation.step2':
    'Buka 수업 (Classes) → 수강취소 (Course Cancellation): [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'Pilih kursus yang ingin dibatalkan dan konfirmasi.',
  'oneStop.cancellation.step4':
    'Setelah itu, periksa kembali [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) untuk memastikan kursus tidak lagi muncul di jadwal aktif Anda.',
  'oneStop.cancellation.note':
    'Ini berbeda dari 수강정정 (add/drop), yang dilakukan di awal semester tanpa meninggalkan catatan. 수강취소 dibuka di akhir semester (biasanya jendela singkat setelah ujian tengah) dan meninggalkan tanda W (Withdrawal) di transkrip, bukan menghapus kursus sepenuhnya. Tanggal pasti ditetapkan setiap semester di kalender akademik.',

  'oneStop.grades.title': 'Memeriksa Nilai (성적확인)',
  'oneStop.grades.step1':
    'Masuk ke [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.grades.step2': 'Buka 수업 (Classes) → bagian nilai.',
  'oneStop.grades.step3':
    'Semester berjalan: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'Seluruh rekam akademik: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'Nilai semester berjalan biasanya hanya terlihat setelah pengumuman nilai akhir selesai — jika kosong, nilai mungkin belum dirilis.',

  'oneStop.tuition.title': 'Biaya Kuliah — Tagihan & Konfirmasi Pembayaran (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    'Masuk ke [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.tuition.step2': 'Buka menu 등록 (Registration/Tuition).',
  'oneStop.tuition.step3': 'Cetak/lihat tagihan: 고지서출력 (Bill Print).',
  'oneStop.tuition.step4':
    'Catat kode pembayaran sekolah pada tagihan (berbeda per bank — NH, Busan Bank, Hana, dll.) dan bayar melalui transfer bank, ATM, perbankan internet/telepon, atau langsung di bank.',
  'oneStop.tuition.step5':
    'Konfirmasi pembayaran berhasil: 납부확인 (Payment Confirmation / Receipt Print) — periksa setelah membayar, karena pembayaran tidak selalu langsung tercatat.',
  'oneStop.tuition.note':
    'Tagihan biaya kuliah tidak dapat diminta melalui telepon/email/faks atas nama Anda — Anda harus mengaksesnya sendiri dengan login Anda.',

  'oneStop.leaveReturn.title': 'Cuti / Kembali Kuliah (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    'Masuk ke [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.leaveReturn.step2':
    'Ajukan cuti kuliah: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'Ajukan kembali kuliah: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'Keduanya memiliki jendela pengajuan tertentu setiap semester (periksa kalender akademik di beranda One-Stop) — mengajukan di luar jendela mungkin tidak memungkinkan.',
}

export default messages
