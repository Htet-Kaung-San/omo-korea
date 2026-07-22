import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'Hướng dẫn giấy phép làm thêm cho du học sinh (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'Quan trọng',
  'workPermit.disclaimer':
    'Đây là **luật nhập cư**, không phải thủ tục trong trường. Sai sót có thể dẫn đến phạt, cấm làm việc hoặc mất tư cách lưu trú. Hãy xác nhận với **Phòng Quốc tế PNU (국제처)** hoặc tổng đài **1345** trước khi nộp hồ sơ.',
  'workPermit.sourceDate': 'Dựa trên hướng dẫn Bộ Tư pháp, tháng 2/2026. Quy định có thể thay đổi — xem [Hi Korea](https://www.hikorea.go.kr).',
  'workPermit.keyPoints': 'Điểm chính',
  'workPermit.steps': 'Các bước',
  'workPermit.relatedPages': 'Liên kết',
  'workPermit.note': 'Lưu ý',

  'workPermit.basics.title': 'Có cần giấy phép không? (기본원칙)',
  'workPermit.basics.point1':
    'Người giữ visa D-2 **không được làm việc hoặc có thu nhập** tại Hàn nếu chưa được phép — kể cả làm thêm (아르바이트).',
  'workPermit.basics.point2':
    'Khi được **cả trường và cơ quan nhập cư** phê duyệt, làm thêm trong giới hạn được phép.',
  'workPermit.basics.point3':
    'Việc chuyên môn (E-1~E-7, ví dụ dạy ngôn ngữ) thường cần **체류자격외 활동허가** riêng.',
  'workPermit.basics.note': 'Hướng dẫn này chỉ về làm thêm thông thường. Giấy phép nghiên cứu/chăm sóc là chủ đề khác.',

  'workPermit.eligibility.title': 'Điều kiện (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** C (2.0) trở lên ở học kỳ gần nhất. Học kỳ đầu chưa có bảng điểm được miễn nhưng giờ làm bị giới hạn một nửa.',
  'workPermit.eligibility.point2':
    '**Ngôn ngữ:** Xem bảng bên dưới. Không đạt ngôn ngữ nhưng đủ điều kiện khác vẫn được phép với **một nửa giờ bình thường**.',
  'workPermit.eligibility.point3':
    '**Thời gian lưu trú:** Sinh viên trao đổi (D-2-8) phải đợi **6 tháng** sau nhập cảnh hoặc đổi tư cách.',
  'workPermit.eligibility.point4': '**Không vi phạm:** Không vi phạm làm thêm trong 3 tháng gần nhất.',
  'workPermit.eligibility.languageTable.title': 'Yêu cầu ngôn ngữ',
  'workPermit.eligibility.languageTable.colLevel': 'Đối tượng',
  'workPermit.eligibility.languageTable.colKorean': 'Chương trình tiếng Hàn',
  'workPermit.eligibility.languageTable.colEnglish': 'Chương trình tiếng Anh',
  'workPermit.eligibility.languageTable.row1Level': 'Cử nhân năm 1–2',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP bậc 3+ / Sejong trung cấp 1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'Cử nhân năm 3–4 & sau đại học',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP bậc 4+ / Sejong trung cấp 2+',
  'workPermit.eligibility.languageTable.row2English': 'Như trên',
  'workPermit.eligibility.note': 'Sinh viên chương trình tiếng Anh dùng cột tiếng Anh thay vì tiếng Hàn.',

  'workPermit.hours.title': 'Giờ làm được phép (허용 시간)',
  'workPermit.hours.table.title': 'Giới hạn giờ làm thêm (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Chương trình',
  'workPermit.hours.table.colYear': 'Năm học',
  'workPermit.hours.table.colKoreanCriteria': 'Trình độ tiếng Hàn',
  'workPermit.hours.table.colMet': 'Đạt?',
  'workPermit.hours.table.colAllowedHours': 'Giờ được phép',
  'workPermit.hours.table.colWeekday': 'Ngày thường',
  'workPermit.hours.table.colWeekend': 'Cuối tuần · nghỉ',
  'workPermit.hours.table.colBonus': 'Trường chứng nhận,\nđiểm xuất sắc,\ntiếng Hàn xuất sắc\n(ngày thường)',
  'workPermit.hours.table.bachelor': 'Cử nhân',
  'workPermit.hours.table.bachelorY12': 'N1–2',
  'workPermit.hours.table.bachelorY34': 'N3–4',
  'workPermit.hours.table.grad': 'ThS/TS',
  'workPermit.hours.table.anyYear': 'Bất kỳ',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 giờ',
  'workPermit.hours.table.hours15': '15 giờ',
  'workPermit.hours.table.hours25': '25 giờ',
  'workPermit.hours.table.hours30': '30 giờ',
  'workPermit.hours.table.hours35': '35 giờ',
  'workPermit.hours.table.unlimited': 'Không giới hạn',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK cấp 3\n② KIIP bậc 3+ hoặc đánh giá trước 61+\n③ Sejong Institute Trung cấp 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK cấp 4\n② KIIP bậc 4+ hoặc đánh giá trước 81+\n③ Sejong Institute Trung cấp 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK cấp 4\n② KIIP bậc 4+ hoặc đánh giá trước 81+\n③ Sejong Institute Trung cấp 2+',
  'workPermit.hours.bonus1':
    'Cột ngoài cùng bên phải áp dụng nếu đã đạt yêu cầu ngôn ngữ và thuộc một trong: trường chứng nhận, toàn A học kỳ trước, hoặc TOPIK 5+ / KIIP bậc 5+.',
  'workPermit.hours.bonus2':
    'Khi đánh dấu **O**, cuối tuần, ngày lễ và kỳ nghỉ trường **không giới hạn giờ**.',
  'workPermit.hours.bonus3':
    'Vẫn cần giấy phép chính thức — giới hạn trong bảng không tự động áp dụng.',
  'workPermit.hours.note':
    'Khi đánh dấu **X**, cùng giới hạn áp dụng cho ngày thường, cuối tuần và kỳ nghỉ. Sinh viên chương trình tiếng Anh dùng điểm tiếng Anh thay cho cột tiêu chí tiếng Hàn.',

  'workPermit.documents.title': 'Hồ sơ cần nộp (제출 서류)',
  'workPermit.documents.item1': 'Đơn, hộ chiếu, thẻ ARC — **miễn phí**',
  'workPermit.documents.item2': 'Bảng điểm (성적증명서)',
  'workPermit.documents.item3': 'Chứng chỉ tiếng Hàn hoặc tiếng Anh',
  'workPermit.documents.item4': 'Giấy xác nhận làm thêm (PNU **Phòng Quốc tế** cấp)',
  'workPermit.documents.item5': 'Giấy xác nhận tuân thủ điều kiện làm thêm',
  'workPermit.documents.item6': 'Giấy đăng ký kinh doanh, CMND chủ lao động, hợp đồng lao động chuẩn',
  'workPermit.documents.item7': 'Sản xuất/xây dựng: thêm giấy tuân thủ',
  'workPermit.documents.note': 'Hợp đồng trực tiếp với doanh nghiệp đăng ký — **cấm** công ty đưa người/ môi giới.',

  'workPermit.apply.title': 'Cách nộp (신청 방법)',
  'workPermit.apply.step1': 'Xin xác nhận trường trước — PNU liên hệ **Phòng Quốc tế (국제처)**.',
  'workPermit.apply.step2':
    'Nộp tại cơ quan nhập cư hoặc online [Hi Korea](https://www.hikorea.go.kr) → 민원신청 → 전자민원.',
  'workPermit.apply.step3': 'Tối đa **2 nơi** làm việc, hiệu lực trong thời gian lưu trú còn lại (tối đa 1 năm/lần).',
  'workPermit.apply.step4': '**Đổi việc?** Cần giấy phép mới **trước** khi bắt đầu — không hồi tố.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (cổng nhập cư chính thức)',
  'workPermit.apply.note':
    '**Nhập cư Busan:** Tầng 1 tòa Korean Air, 146 Jungang-daero · Tàu điện ngầm Ga Busan (L1) lối 2 hoặc Jungang lối 14 · T2–T6 9:00–18:00 · **1345**',

  'workPermit.restrictions.title': 'Việc bị cấm (제한대상)',
  'workPermit.restrictions.item1': 'Sản xuất/xây dựng (sản xuất cần TOPIK 4+; xây dựng gần như cấm — vi phạm = lệnh xuất cảnh)',
  'workPermit.restrictions.item2': 'Gia sư riêng (개인과외)',
  'workPermit.restrictions.item3': 'Giải trí người lớn (bar tiếp viên, massage, nhà nghỉ, phòng game...)',
  'workPermit.restrictions.item4': 'Gig platform: giao hàng, chuyển phát, lái hộ, bảo hiểm/bán hàng door-to-door',
  'workPermit.restrictions.item5': 'Chỉ làm việc từ xa',
  'workPermit.restrictions.item6': 'Việc qua công ty đưa người/môi giới lao động',

  'workPermit.violations.title': 'Xử lý vi phạm (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Tình huống',
  'workPermit.violations.table.colResult': 'Hậu quả',
  'workPermit.violations.table.row1Situation': 'Làm không giấy phép',
  'workPermit.violations.table.row1Result': 'Lao động bất hợp pháp — xử phạt; xây dựng = lệnh xuất cảnh',
  'workPermit.violations.table.row2Situation': 'Vi phạm giấy phép lần 1',
  'workPermit.violations.table.row2Result': 'Cảnh cáo',
  'workPermit.violations.table.row3Situation': 'Lần 2',
  'workPermit.violations.table.row3Result': 'Cấm làm thêm đến khi tốt nghiệp',
  'workPermit.violations.table.row4Situation': 'Lần 3',
  'workPermit.violations.table.row4Result': 'Có thể hủy tư cách lưu trú (유학자격)',
  'workPermit.violations.note': 'Làm không phép dù lần đầu cũng có thể bị xử nặng. Gọi **1345** trước khi nhận việc nếu không chắc.',
}

export default messages
