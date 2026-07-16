import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'onestop.pusan.ac.kr के लिए चरण-दर-चरण मार्गदर्शिका',
  'oneStop.steps': 'चरण',
  'oneStop.relatedPages': 'संबंधित पृष्ठ',
  'oneStop.note': 'नोट',

  'oneStop.registration.title': 'कोर्स पंजीकरण (수강신청)',
  'oneStop.registration.step1':
    'अपने छात्र आईडी और पासवर्ड से [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) पर लॉग इन करें।',
  'oneStop.registration.step2':
    '수업 (Classes) → 수강신청및확인 (Registration & Confirmation) पर जाएँ।',
  'oneStop.registration.step3':
    'पहले कोर्स कैटलॉग देखें: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — विभाग से खोजें, खुले सेक्शन देखें, सीट सीमा जाँचें।',
  'oneStop.registration.step4':
    'पंजीकरण अवधि में, वास्तविक जमा अलग पंजीकरण सिस्टम पर होता है: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (PC या मोबाइल वेब)। यह One-Stop से अलग साइट है — यहाँ रीडायरेक्ट होने पर भ्रमित न हों।',
  'oneStop.registration.step5':
    'जमा करने के बाद One-Stop पर वापस जाएँ → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) से पुष्टि करें कि कोर्स वास्तव में पंजीकृत हुए — हर बार करें, क्योंकि "wishlist" (희망과목담기) पुष्ट पंजीकरण के बराबर नहीं है।',
  'oneStop.registration.related.addDrop': 'कोर्स जोड़/हटाएँ (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'कोर्स रद्द (수강취소)',
  'oneStop.registration.related.timetable': 'समय सारिणी देखें (시간표조회)',
  'oneStop.registration.note':
    'पंजीकरण केवल शैक्षणिक कैलेंडर में निर्धारित विशिष्ट अवधि में खुलता है (आमतौर पर One-Stop होमपेज पर सूचीबद्ध)। तारीखें पहले से जाँचें — सिस्टम केवल इन अवधि में उपयोगी है।',

  'oneStop.cancellation.title': 'कोर्स रद्द / वापसी (수강취소)',
  'oneStop.cancellation.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) पर लॉग इन करें।',
  'oneStop.cancellation.step2':
    '수업 (Classes) → 수강취소 (Course Cancellation) पर जाएँ: [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'रद्द करने वाले कोर्स चुनें और पुष्टि करें।',
  'oneStop.cancellation.step4':
    'बाद में, [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) फिर से देखें कि कोर्स सक्रिय समय सारिणी में नहीं है।',
  'oneStop.cancellation.note':
    'यह 수강정정 (add/drop) से अलग है, जो सेमेस्टर की शुरुआत में होता है और कोई रिकॉर्ड नहीं छोड़ता। 수강취소 सेमेस्टर के बाद में खुलता है (आमतौर पर मिडटर्म के बाद छोटी अवधि) और कोर्स पूरी तरह हटाने के बजाय ट्रांसक्रिप्ट पर W (Withdrawal) चिह्न छोड़ता है। सटीक तारीखें प्रत्येक सेमेस्टर में शैक्षणिक कैलेंडर पर निर्धारित होती हैं।',

  'oneStop.grades.title': 'ग्रेड देखना (성적확인)',
  'oneStop.grades.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) पर लॉग इन करें।',
  'oneStop.grades.step2': '수업 (Classes) → ग्रेड अनुभाग पर जाएँ।',
  'oneStop.grades.step3':
    'वर्तमान सेमेस्टर: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'पूर्ण शैक्षणिक रिकॉर्ड: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'वर्तमान सेमेस्टर के ग्रेड आमतौर पर अंतिम ग्रेड प्रकाशन बंद होने के बाद ही दिखते हैं — खाली हो तो ग्रेड अभी जारी नहीं हुए होंगे।',

  'oneStop.tuition.title': 'ट्यूशन — बिल और भुगतान पुष्टि (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) पर लॉग इन करें।',
  'oneStop.tuition.step2': '등록 (Registration/Tuition) मेनू पर जाएँ।',
  'oneStop.tuition.step3': 'बिल प्रिंट/देखें: 고지서출력 (Bill Print)।',
  'oneStop.tuition.step4':
    'बिल पर दिखाया गया स्कूल भुगतान कोड नोट करें (बैंक के अनुसार भिन्न — NH, Busan Bank, Hana, आदि) और बैंक ट्रांसफर, ATM, इंटरनेट/फोन बैंकिंग या बैंक में जाकर भुगतान करें।',
  'oneStop.tuition.step5':
    'भुगतान पुष्टि करें: 납부확인 (Payment Confirmation / Receipt Print) — भुगतान के बाद जाँचें, क्योंकि भुगतान तुरंत प्रतिबिंबित नहीं हो सकता।',
  'oneStop.tuition.note':
    'ट्यूशन बिल फोन/ईमेल/फैक्स से आपकी ओर से नहीं माँगे जा सकते — आपको अपने लॉगिन से स्वयं एक्सेस करना होगा।',

  'oneStop.leaveReturn.title': 'अवकाश / स्कूल वापसी (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) पर लॉग इन करें।',
  'oneStop.leaveReturn.step2':
    'अवकाश के लिए आवेदन: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'वापसी के लिए आवेदन: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'दोनों के प्रति सेमेस्टर विशिष्ट आवेदन अवधि होती है (One-Stop होमपेज पर शैक्षणिक कैलेंडर देखें) — अवधि के बाहर आवेदन संभव नहीं हो सकता।',
}

export default messages
