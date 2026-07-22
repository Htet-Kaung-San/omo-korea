import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'Panduan izin kerja paruh waktu mahasiswa internasional (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'Penting',
  'workPermit.disclaimer':
    'Ini adalah **hukum imigrasi** — bukan formulir kampus. Informasi yang salah dapat berakibat denda, larangan kerja, atau kehilangan status mahasiswa. Konfirmasi dengan **Kantor Urusan Internasional PNU (국제처)** atau helpline **1345** sebelum mengajukan.',
  'workPermit.sourceDate':
    'Berdasarkan panduan MOJ, Feb 2026. Aturan resmi dapat berubah — periksa [Hi Korea](https://www.hikorea.go.kr) untuk pembaruan.',
  'workPermit.keyPoints': 'Poin utama',
  'workPermit.steps': 'Langkah',
  'workPermit.relatedPages': 'Tautan terkait',
  'workPermit.note': 'Catatan',

  'workPermit.basics.title': 'Apakah Perlu Izin? (기본원칙)',
  'workPermit.basics.point1':
    'Pemegang visa mahasiswa D-2 **tidak boleh bekerja atau memperoleh pendapatan** di Korea tanpa izin — termasuk kerja paruh waktu (아르바이트).',
  'workPermit.basics.point2':
    'Dengan persetujuan **keduanya** universitas dan imigrasi, kerja paruh waktu terbatas diperbolehkan.',
  'workPermit.basics.point3':
    'Pekerjaan khusus (E-1~E-7, mis. pengajaran bahasa) umumnya memerlukan **체류자격외 활동허가** terpisah — bukan izin ini.',
  'workPermit.basics.note':
    'Panduan ini hanya mencakup kerja paruh waktu standar. Izin riset/perawatan domestik adalah topik terpisah.',

  'workPermit.eligibility.title': 'Kelayakan (대상자 요건)',
  'workPermit.eligibility.point1':
    '**IPK:** C (2.0) atau lebih di semester terakhir. Semester pertama: bebas jika belum ada transkrip, tetapi jam dibatasi setengah.',
  'workPermit.eligibility.point2':
    '**Bahasa:** Lihat tabel di bawah. Jika persyaratan bahasa tidak terpenuhi tetapi sisanya OK, izin masih bisa diberikan dengan **setengah jam normal**.',
  'workPermit.eligibility.point3':
    '**Durasi tinggal:** Mahasiswa pertukaran/kunjungan (D-2-8) harus menunggu **6 bulan** setelah masuk atau perubahan status.',
  'workPermit.eligibility.point4':
    '**Rekam bersih:** Tidak ada pelanggaran kerja paruh waktu dalam 3 bulan terakhir.',
  'workPermit.eligibility.languageTable.title': 'Persyaratan bahasa',
  'workPermit.eligibility.languageTable.colLevel': 'Siapa',
  'workPermit.eligibility.languageTable.colKorean': 'Jalur Korea',
  'workPermit.eligibility.languageTable.colEnglish': 'Jalur Inggris (tahun berapa pun)',
  'workPermit.eligibility.languageTable.row1Level': 'Sarjana, tahun 1–2',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-step+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'Sarjana Y3–4 & pascasarjana',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-step+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'Sama seperti di atas',
  'workPermit.eligibility.note':
    'Mahasiswa jalur Inggris menggunakan kolom Inggris, bukan persyaratan Korea.',

  'workPermit.hours.title': 'Jam yang Diizinkan (허용 시간)',
  'workPermit.hours.table.title': 'Batas jam kerja paruh waktu (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Program',
  'workPermit.hours.table.colYear': 'Tahun',
  'workPermit.hours.table.colKoreanCriteria': 'Kemampuan bahasa Korea',
  'workPermit.hours.table.colMet': 'Terpenuhi?',
  'workPermit.hours.table.colAllowedHours': 'Jam diizinkan',
  'workPermit.hours.table.colWeekday': 'Hari kerja',
  'workPermit.hours.table.colWeekend': 'Akhir pekan · libur',
  'workPermit.hours.table.colBonus': 'Univ. tersertifikasi,\nprestasi akademik,\nKorea unggul\n(hari kerja)',
  'workPermit.hours.table.bachelor': 'Sarjana',
  'workPermit.hours.table.bachelorY12': 'T1–2',
  'workPermit.hours.table.bachelorY34': 'T3–4',
  'workPermit.hours.table.grad': 'S2/S3',
  'workPermit.hours.table.anyYear': 'Semua',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 jam',
  'workPermit.hours.table.hours15': '15 jam',
  'workPermit.hours.table.hours25': '25 jam',
  'workPermit.hours.table.hours30': '30 jam',
  'workPermit.hours.table.hours35': '35 jam',
  'workPermit.hours.table.unlimited': 'Tidak terbatas',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK Level 3\n② KIIP Level 3+ atau pre-assessment 61+\n③ Sejong Institute Intermediate 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK Level 4\n② KIIP Level 4+ atau pre-assessment 81+\n③ Sejong Institute Intermediate 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK Level 4\n② KIIP Level 4+ atau pre-assessment 81+\n③ Sejong Institute Intermediate 2+',
  'workPermit.hours.bonus1':
    'Kolom paling kanan berlaku jika persyaratan bahasa terpenuhi DAN memenuhi salah satu: mahasiswa universitas tersertifikasi, semua A semester lalu, atau TOPIK 5+ / KIIP 5-step+.',
  'workPermit.hours.bonus2':
    'Saat ditandai **O**, akhir pekan, hari libur nasional, dan libur sekolah resmi **tanpa batas jam**.',
  'workPermit.hours.bonus3':
    'Anda tetap perlu izin aktual — batas dalam tabel tidak otomatis.',
  'workPermit.hours.note':
    'Saat ditandai **X**, batas yang sama berlaku di hari kerja, akhir pekan, dan libur. Mahasiswa jalur Inggris menggunakan skor Inggris, bukan kolom kriteria Korea.',

  'workPermit.documents.title': 'Dokumen yang Diperlukan (제출 서류)',
  'workPermit.documents.item1':
    'Formulir aplikasi, paspor, Alien Registration Card (ARC) — **gratis**',
  'workPermit.documents.item2': 'Transkrip (성적증명서)',
  'workPermit.documents.item3': 'Bukti kemampuan Korea atau Inggris',
  'workPermit.documents.item4':
    'Konfirmasi universitas: 외국인 유학생 시간제 취업 확인서 (diterbitkan **Kantor Urusan Internasional PNU**)',
  'workPermit.documents.item5':
    'Konfirmasi kepatuhan: 외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    'Registrasi bisnis pemberi kerja + ID pemberi kerja, dan kontrak kerja standar (upah per jam, tugas, jam tercantum)',
  'workPermit.documents.item7':
    'Pemberi kerja manufaktur/konstruksi: formulir kepatuhan tambahan',
  'workPermit.documents.note':
    'Kontrak harus langsung dengan bisnis terdaftar — agen tenaga kerja / pengiriman **tidak diizinkan**.',

  'workPermit.apply.title': 'Cara Mengajukan (신청 방법)',
  'workPermit.apply.step1':
    'Dapatkan persetujuan universitas dulu — di PNU, hubungi **Kantor Urusan Internasional (국제처)** untuk formulir konfirmasi.',
  'workPermit.apply.step2':
    'Ajukan di kantor imigrasi setempat atau online via [Hi Korea](https://www.hikorea.go.kr) → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    'Persetujuan mencakup hingga **2 tempat kerja** sekaligus, berlaku untuk sisa masa tinggal (maks. 1 tahun per persetujuan).',
  'workPermit.apply.step4':
    '**Ganti pekerjaan?** Dapatkan izin baru **sebelum** mulai di tempat kerja baru — tidak retroaktif.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (portal imigrasi resmi)',
  'workPermit.apply.note':
    '**Busan Immigration (부산출입국·외국인청):** Korean Air bldg 1F, 146 Jungang-daero, Jung-gu · Metro: Busan Stn (L1) Exit 2 atau Jungang Exit 14 · Sen–Jum 9:00–18:00 (makan siang 12:00–13:00) · **1345** (helpline multibahasa)',

  'workPermit.restrictions.title': 'Pekerjaan Terbatas (제한대상)',
  'workPermit.restrictions.item1':
    'Manufaktur/konstruksi (TOPIK 4+ diperlukan untuk manufaktur; konstruksi praktis tidak pernah diizinkan — satu pelanggaran = perintah keluar)',
  'workPermit.restrictions.item2': 'Les privat satu-satu (개인과외)',
  'workPermit.restrictions.item3':
    'Hiburan dewasa / terkait nightlife (bar dengan hostess, pijat/pemandian, motel, ruang permainan, dll.)',
  'workPermit.restrictions.item4':
    'Pekerjaan platform: kurir, pengantar, sopir pengganti, asuransi/penjualan door-to-door',
  'workPermit.restrictions.item5': 'Posisi remote / telecommute saja',
  'workPermit.restrictions.item6': 'Pekerjaan melalui agen tenaga kerja atau dispatch/perantara tenaga kerja',

  'workPermit.violations.title': 'Sanksi (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Situasi',
  'workPermit.violations.table.colResult': 'Konsekuensi',
  'workPermit.violations.table.row1Situation': 'Bekerja tanpa izin',
  'workPermit.violations.table.row1Result':
    'Pekerjaan ilegal — sanksi; sektor konstruksi = perintah keluar',
  'workPermit.violations.table.row2Situation': 'Pelanggaran izin ke-1 (jam/tempat salah)',
  'workPermit.violations.table.row2Result': 'Peringatan resmi',
  'workPermit.violations.table.row3Situation': 'Pelanggaran ke-2',
  'workPermit.violations.table.row3Result': 'Dilarang kerja paruh waktu selama sisa studi',
  'workPermit.violations.table.row4Situation': 'Pelanggaran ke-3',
  'workPermit.violations.table.row4Result': 'Status mahasiswa (유학자격) dapat dicabut',
  'workPermit.violations.note':
    'Pelanggaran pertama untuk kerja tanpa izin dapat berakibat serius. Jika ragu, hubungi **1345** sebelum memulai pekerjaan.',
}

export default messages
