import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'onestop.pusan.ac.kr için adım adım rehber',
  'oneStop.steps': 'Adımlar',
  'oneStop.relatedPages': 'İlgili sayfalar',
  'oneStop.note': 'Not',

  'oneStop.registration.title': 'Ders Kaydı (수강신청)',
  'oneStop.registration.step1':
    'Öğrenci numaranız ve şifrenizle [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) adresine giriş yapın.',
  'oneStop.registration.step2':
    '수업 (Classes) → 수강신청및확인 (Registration & Confirmation) bölümüne gidin.',
  'oneStop.registration.step3':
    'Önce ders kataloğunu kontrol edin: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — bölüme göre arayın, açık sınıfları inceleyin, kontenjan sınırını kontrol edin.',
  'oneStop.registration.step4':
    'Kayıt döneminde gerçek başvuru ayrı kayıt sisteminde yapılır: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (PC veya mobil web). Bu One-Stop\'tan farklı bir sitedir — buraya yönlendirilirseniz karıştırmayın.',
  'oneStop.registration.step5':
    'Gönderdikten sonra One-Stop\'a dönün → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) ile derslerin gerçekten kaydedildiğini doğrulayın — her seferinde yapın, çünkü "wishlist" (희망과목담기) onaylanmış kayıtla aynı değildir.',
  'oneStop.registration.related.addDrop': 'Ders Ekleme/Çıkarma (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'Ders İptali (수강취소)',
  'oneStop.registration.related.timetable': 'Ders Programı Görüntüleme (시간표조회)',
  'oneStop.registration.note':
    'Kayıt yalnızca akademik takvimde belirlenen belirli dönemlerde açılır (genellikle One-Stop ana sayfasında listelenir). Tarihleri önceden kontrol edin — sistem yalnızca bu dönemlerde kullanılabilir.',

  'oneStop.cancellation.title': 'Ders İptali / Çekilme (수강취소)',
  'oneStop.cancellation.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) adresine giriş yapın.',
  'oneStop.cancellation.step2':
    '수업 (Classes) → 수강취소 (Course Cancellation) bölümüne gidin: [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'İptal etmek istediğiniz ders(ler)i seçin ve onaylayın.',
  'oneStop.cancellation.step4':
    'Ardından [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) tekrar kontrol ederek dersin aktif programınızda artık görünmediğini doğrulayın.',
  'oneStop.cancellation.note':
    'Bu, dönem başında yapılan ve kayıt bırakmayan 수강정정 (add/drop) işleminden farklıdır. 수강취소 dönemin ilerleyen dönemlerinde açılır (genellikle ara sınavdan sonra kısa bir süre) ve dersi tamamen silmek yerine transkriptte W (Withdrawal) işareti bırakır. Kesin tarihler her dönem akademik takvimde belirlenir.',

  'oneStop.grades.title': 'Not Kontrolü (성적확인)',
  'oneStop.grades.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) adresine giriş yapın.',
  'oneStop.grades.step2': '수업 (Classes) → notlar bölümüne gidin.',
  'oneStop.grades.step3':
    'Güncel dönem: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'Tüm dönemler: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'Güncel dönem notları genellikle yalnızca final notları açıklandıktan sonra görünür — boşsa notlar henüz yayınlanmamış olabilir.',

  'oneStop.tuition.title': 'Öğrenim Ücreti — Fatura ve Ödeme Onayı (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) adresine giriş yapın.',
  'oneStop.tuition.step2': '등록 (Registration/Tuition) menüsüne gidin.',
  'oneStop.tuition.step3': 'Faturayı yazdırın/görüntüleyin: 고지서출력 (Bill Print).',
  'oneStop.tuition.step4':
    'Faturada gösterilen okul ödeme kodunu not edin (bankaya göre değişir — NH, Busan Bank, Hana vb.) ve banka havalesi, ATM, internet/telefon bankacılığı veya bankada yüz yüze ödeme yapın.',
  'oneStop.tuition.step5':
    'Ödemeyi onaylayın: 납부확인 (Payment Confirmation / Receipt Print) — ödedikten sonra kontrol edin, çünkü ödeme her zaman anında yansımayabilir.',
  'oneStop.tuition.note':
    'Öğrenim ücreti faturası telefon/e-posta/faks ile sizin adınıza talep edilemez — kendi girişinizle kendiniz erişmelisiniz.',

  'oneStop.leaveReturn.title': 'Kayıt Dondurma / Okula Dönüş (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) adresine giriş yapın.',
  'oneStop.leaveReturn.step2':
    'Kayıt dondurma başvurusu: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'Okula dönüş başvurusu: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'Her ikisinin de her dönem belirli başvuru pencereleri vardır (One-Stop ana sayfasındaki akademik takvimi kontrol edin) — pencere dışında başvuru yapılamayabilir.',
}

export default messages
