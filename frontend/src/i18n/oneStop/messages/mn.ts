import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'onestop.pusan.ac.kr-д зориулсан алхам алхмаар заавар',
  'oneStop.steps': 'Алхамууд',
  'oneStop.relatedPages': 'Холбоотой хуудсууд',
  'oneStop.note': 'Тэмдэглэл',

  'oneStop.registration.title': 'Хичээл бүртгүүлэх (수강신청)',
  'oneStop.registration.step1':
    'Оюутны дугаар, нууц үгээрээ [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) руу нэвтэрнэ үү.',
  'oneStop.registration.step2':
    '수업 (Classes) → 수강신청및확인 (Registration & Confirmation) руу очно уу.',
  'oneStop.registration.step3':
    'Эхлээд хичээлийн каталогийг шалгана уу: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — тэнхимээр хайх, нээлттэй бүлгүүдийг үзэх, суудлын хязгаарыг шалгах.',
  'oneStop.registration.step4':
    'Бүртгэлийн хугацаанд бодит илгээлт тусдаа бүртгэлийн системд хийгддэг: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (PC эсвэл гар утасны вэб). Энэ нь One-Stop-оос өөр сайт — энд шилжүүлэгдвэл бүү төөрч байгаарай.',
  'oneStop.registration.step5':
    'Илгээсний дараа One-Stop руу буцаж → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) ашиглан хичээлүүд үнэхээр бүртгэгдсэнийг баталгаажуулна уу — үргэлж хийнэ үү, учир нь "wishlist" (희망과목담기) нь баталгаажсан бүртгэлтэй тэнцүү биш.',
  'oneStop.registration.related.addDrop': 'Хичээл нэмэх/хасах (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'Хичээл цуцлах (수강취소)',
  'oneStop.registration.related.timetable': 'Хуваарь харах (시간표조회)',
  'oneStop.registration.note':
    'Бүртгэл зөвхөн эрдмийн хуанлиар тогтоосон тодорхой хугацаанд нээгддэг (ихэвчлэн One-Stop нүүр хуудсанд жагсаадаг). Огноог урьдчилан шалгана уу — систем зөвхөн эдгээр хугацаанд ашиглагдана.',

  'oneStop.cancellation.title': 'Хичээл цуцлах / Татгалзах (수강취소)',
  'oneStop.cancellation.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) руу нэвтэрнэ үү.',
  'oneStop.cancellation.step2':
    '수업 (Classes) → 수강취소 (Course Cancellation) руу очно уу: [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'Цуцлах хичээл(үүд)-ээ сонгоод баталгаажуулна уу.',
  'oneStop.cancellation.step4':
    'Дараа нь [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) дахин шалгаж, хичээл идэвхтэй хуваарь дээр байхгүй болсныг баталгаажуулна уу.',
  'oneStop.cancellation.note':
    'Энэ нь 수강정정 (add/drop)-аас ялгаатай, улирлын эхэнд хийгддэг бөгөөд бүртгэл үлддэггүй. 수강취소 улирлын дунд/сүүлд нээгддэг (ихэвчлэн дундаж шалгалтын дараах богино хугацаа) бөгөөд хичээлийг бүрэн устгахын оронд дүнгийн хуудсанд W (Withdrawal) тэмдэг үлдээнэ. Яг огноог улир бүр эрдмийн хуанлиар тогтоодог.',

  'oneStop.grades.title': 'Дүн шалгах (성적확인)',
  'oneStop.grades.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) руу нэвтэрнэ үү.',
  'oneStop.grades.step2': '수업 (Classes) → дүнгийн хэсэг рүү очно уу.',
  'oneStop.grades.step3':
    'Одоогийн улирлын дүн: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'Бүх улирлын дүн: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'Одоогийн улирлын дүн ихэвчлэн эцсийн дүн зарлагдсаны дараа л харагддаг — хоосон бол дүн одоогоор гаргаагүй байж магадгүй.',

  'oneStop.tuition.title': 'Сургалтын төлбөр — Нэхэмжлэх / Төлбөр баталгаажуулах (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) руу нэвтэрнэ үү.',
  'oneStop.tuition.step2': '등록 (Registration/Tuition) цэс рүү очно уу.',
  'oneStop.tuition.step3': 'Нэхэмжлэх хэвлэх/харах: 고지서출력 (Bill Print).',
  'oneStop.tuition.step4':
    'Нэхэмжлэх дээрх сургуулийн төлбөрийн кодыг тэмдэглэнэ үү (банкаас хамаарна — NH, Busan Bank, Hana гэх мэт) бөгөөд банкны шилжүүлэг, ATM, интернет/утасны банк эсвэл банкны салбарт төлнө үү.',
  'oneStop.tuition.step5':
    'Төлбөр амжилттай болсныг баталгаажуулна уу: 납부확인 (Payment Confirmation / Receipt Print) — төлсний дараа шалгана уу, учир нь төлбөр шууд тусахгүй байж болно.',
  'oneStop.tuition.note':
    'Сургалтын төлбөрийн нэхэмжлэхийг утас/имэйл/факсаар таны өмнөөс авах боломжгүй — өөрийн нэвтрэлтээрээ шууд хандах ёстой.',

  'oneStop.leaveReturn.title': 'Суралцахаа зогсоох / Буцаж ирэх (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) руу нэвтэрнэ үү.',
  'oneStop.leaveReturn.step2':
    'Суралцахаа зогсоох өргөдөл: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'Буцаж ирэх өргөдөл: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'Хоёулаа улир бүр тодорхой өргөдлийн хугацаатай (One-Stop нүүр хуудсан дээрх эрдмийн хуанлиг шалгана уу) — хугацаанаас гадуур өргөдөл гаргах боломжгүй байж болно.',
}

export default messages
