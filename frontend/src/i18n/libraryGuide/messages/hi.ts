import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'PNU लाइब्रेरी मोबाइल ऐप (부산대 도서관_PNUL) उपयोग गाइड',
  'library.steps': 'चरण',
  'library.usageGuide': 'उपयोग गाइड',

  'library.install.title': 'ऐप इंस्टॉल करें',
  'library.install.step1':
    '[Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) या Apple App Store (iOS) पर "PNUL" या "부산대 도서관" खोजकर इंस्टॉल करें।',
  'library.install.step2':
    'यदि आपने पहले पुराने "부산대 도서관" या "PNU Place" ऐप का उपयोग किया था, वे बंद हो चुके हैं — यह नया ऐप दोनों की जगह लेता है।',
  'library.install.step3':
    'PNU छात्र पोर्टल क्रेडेंशियल से लॉगिन करें ([onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) जैसा ही ID/पासवर्ड)।',

  'library.seatReservation.title': 'पठन कक्ष सीट आरक्षण (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'केवल ऐप के माध्यम से आवंटित सीटें मान्य हैं — बिना आवंटन के सीट का उपयोग करके पकड़े जाने पर लाइब्रेरी उपयोग प्रतिबंध लग सकता है।',
  'library.seatReservation.tip2':
    'आरक्षण के बाद 15 मिनट के भीतर प्रवेश गेट से गुजरना जरूरी है, नहीं तो आवंटन रद्द हो जाता है।',
  'library.seatReservation.tip3':
    'सत्र समाप्त होने से 2 घंटे पहले विस्तार खुलता है। प्रत्येक विस्तार 4 घंटे जोड़ता है, अधिकतम 4 बार विस्तार कर सकते हैं।',
  'library.seatReservation.tip4':
    'विस्तार ऐप में या लाइब्रेरी में 좌석배정기 (सीट आवंटन कियोस्क) पर किया जा सकता है।',
  'library.seatReservation.tip5': 'समय समाप्त होने पर सीट स्वचालित रूप से वापस हो जाती है।',
  'library.seatReservation.tip6':
    'नोट: 중앙도서관 (केंद्रीय लाइब्रेरी) मुख्य रूप से संग्रह स्थान है — कुछ पठन क्षेत्रों में सीट आवंटन की जरूरत नहीं।',
  'library.seatReservation.step1':
    'होम स्क्रीन पर ऊपर के पास 좌석예약 (सीट आरक्षण) पैनल खोजें। सक्रिय आरक्षण न होने पर "예약된 정보가 없습니다" (कोई आरक्षण जानकारी नहीं) दिखेगा। नया आरक्षण के लिए 배정신청 (आवंटन अनुरोध) टैप करें, या पिछले के लिए 이용내역 (उपयोग इतिहास)।',
  'library.seatReservation.step2':
    'टैब पंक्ति से भवन चुनें — 나노생명, 의생명, 미리내, 새벽벌, या 중앙।',
  'library.seatReservation.step3':
    'मंजिल (1층, 2층, ...) चुनें, फिर उस मंजिल का कक्ष प्रकार टैब (जैसे [새벽벌]열람실 पठन कक्ष vs. [새벽벌]PC PC ज़ोन)।',
  'library.seatReservation.step4':
    'प्रत्येक क्षेत्र की लाइव व्यस्तता रिंग चार्ट में दिखेगी — जैसे "새벽누리-열람존 34/73" का मतलब 73 में से 34 सीट ली, 39 खाली।',
  'library.seatReservation.step5':
    'क्षेत्र में टैप करके अलग सीट चुनें और पुष्टि करें।',
  'library.seatReservation.image.homeScreen':
    'होम स्क्रीन — 배정신청 बटन वाला 좌석예약 पैनल',
  'library.seatReservation.image.buildingFloor':
    'भवन, मंजिल और क्षेत्र चयन तथा लाइव सीट व्यस्तता',

  'library.libraryCard.title': 'लाइब्रेरी कार्ड / 이용증',
  'library.libraryCard.step1': 'ऐप खोलें और ऊपर 메뉴 (Menu) → LOGIN से लॉगिन करें।',
  'library.libraryCard.step2':
    'नीचे नेविगेशन बार में 이용증 टैप करें — नीचे नेव MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴, सीधा टैब है, मेनू में छिपा नहीं।',
  'library.libraryCard.step3':
    '이용증 स्क्रीन QR कोड दिखाती है — यह आपका मोबाइल लाइब्रेरी कार्ड है। प्रवेश के लिए लाइब्रेरी गेट पर स्कैन करें।',
}

export default messages
