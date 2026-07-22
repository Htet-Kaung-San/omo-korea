import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'คู่มือใบอนุญาตทำงานพาร์ทไทม์สำหรับนักเรียนต่างชาติ (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'สำคัญ',
  'workPermit.disclaimer':
    'นี่เป็น**กฎหมายตรวจคนเข้าเมือง** ไม่ใช่ขั้นตอนในมหาวิทยาลัย ข้อมูลผิดอาจถูกลงโทษ ห้ามทำงาน หรือเพิกถอนวีซ่านักเรียน โปรดยืนยันกับ **สำนักงานความสัมพันธ์ต่างประเทศ PNU (국제처)** หรือสายด่วน **1345** ก่อนยื่น',
  'workPermit.sourceDate': 'อิงตามแนวทางกระทรวงยุติธรรม ก.พ. 2026 กฎอาจเปลี่ยน — ดู [Hi Korea](https://www.hikorea.go.kr)',
  'workPermit.keyPoints': 'ประเด็นสำคัญ',
  'workPermit.steps': 'ขั้นตอน',
  'workPermit.relatedPages': 'ลิงก์ที่เกี่ยวข้อง',
  'workPermit.note': 'หมายเหตุ',

  'workPermit.basics.title': 'ต้องมีใบอนุญาตไหม? (기본원칙)',
  'workPermit.basics.point1':
    'ผู้ถือวีซ่า D-2 **ห้ามทำงานหรือมีรายได้** ในเกาหลีโดยไม่ได้รับอนุญาต — รวมงาน part-time (아르바이트)',
  'workPermit.basics.point2':
    'เมื่อได้รับอนุมัติจาก**ทั้งมหาวิทยาลัยและตรวจคนเข้าเมือง** จึงทำ part-time ได้ในขอบเขตที่กำหนด',
  'workPermit.basics.point3':
    'งานเฉพาะทาง (E-1~E-7 เช่น สอนภาษา) มักต้องขอ **체류자격외 활동허가** แยกต่างหาก',
  'workPermit.basics.note': 'คู่มือนี้ครอบคลุมงาน part-time ทั่วไปเท่านั้น',

  'workPermit.eligibility.title': 'คุณสมบัติ (대상자 요건)',
  'workPermit.eligibility.point1':
    '**เกรด:** GPA C (2.0) ขึ้นไปในเทอมล่าสุด เทอมแรกยังไม่มี transcript ได้ยกเว้นแต่ชั่วโมงจำกัดครึ่งหนึ่ง',
  'workPermit.eligibility.point2':
    '**ภาษา:** ดูตารางด้านล่าง ไม่ผ่านภาษาแต่ผ่านเงื่อนไขอื่น ยังขอได้แต่**ครึ่งชั่วโมงปกติ**',
  'workPermit.eligibility.point3':
    '**ระยะเวลาพำนัก:** นักเรียนแลกเปลี่ยน (D-2-8) ต้องรอ **6 เดือน** หลังเข้าเมืองหรือเปลี่ยนสถานะ',
  'workPermit.eligibility.point4': '**ไม่มีประวัติละเมิด:** ไม่ละเมิด part-time ใน 3 เดือนที่ผ่านมา',
  'workPermit.eligibility.languageTable.title': 'ข้อกำหนดภาษา',
  'workPermit.eligibility.languageTable.colLevel': 'กลุ่ม',
  'workPermit.eligibility.languageTable.colKorean': 'หลักสูตรเกาหลี',
  'workPermit.eligibility.languageTable.colEnglish': 'หลักสูตรอังกฤษ',
  'workPermit.eligibility.languageTable.row1Level': 'ปริญญาตรี ปี 1–2',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP ขั้น 3+ / Sejong ระดับกลาง 1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'ปริญญาตรี ปี 3–4 และบัณฑิตศึกษา',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP ขั้น 4+ / Sejong ระดับกลาง 2+',
  'workPermit.eligibility.languageTable.row2English': 'เหมือนด้านบน',
  'workPermit.eligibility.note': 'นักเรียนหลักสูตรอังกฤษใช้คอลัมน์อังกฤษแทนเกาหลี',

  'workPermit.hours.title': 'ชั่วโมงที่อนุญาต (허용 시간)',
  'workPermit.hours.table.title': 'ขีดจำกัดชั่วโมงทำงาน part-time (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'หลักสูตร',
  'workPermit.hours.table.colYear': 'ชั้นปี',
  'workPermit.hours.table.colKoreanCriteria': 'ความสามารถภาษาเกาหลี',
  'workPermit.hours.table.colMet': 'ผ่าน?',
  'workPermit.hours.table.colAllowedHours': 'ชั่วโมงที่อนุญาต',
  'workPermit.hours.table.colWeekday': 'วันธรรมดา',
  'workPermit.hours.table.colWeekend': 'สุดสัปดาห์ · ปิดเทอม',
  'workPermit.hours.table.colBonus': 'มหาวิทยาลัยรับรอง,\nเกรดดีเด่น,\nภาษาเกาหลีดีเด่น\n(วันธรรมดา)',
  'workPermit.hours.table.bachelor': 'ป.ตรี',
  'workPermit.hours.table.bachelorY12': 'ปี 1–2',
  'workPermit.hours.table.bachelorY34': 'ปี 3–4',
  'workPermit.hours.table.grad': 'ม./ดร.',
  'workPermit.hours.table.anyYear': 'ไม่จำกัด',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 ชม.',
  'workPermit.hours.table.hours15': '15 ชม.',
  'workPermit.hours.table.hours25': '25 ชม.',
  'workPermit.hours.table.hours30': '30 ชม.',
  'workPermit.hours.table.hours35': '35 ชม.',
  'workPermit.hours.table.unlimited': 'ไม่จำกัด',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK ระดับ 3\n② KIIP ขั้น 3+ หรือประเมินล่วงหน้า 61+\n③ Sejong Institute ระดับกลาง 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK ระดับ 4\n② KIIP ขั้น 4+ หรือประเมินล่วงหน้า 81+\n③ Sejong Institute ระดับกลาง 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK ระดับ 4\n② KIIP ขั้น 4+ หรือประเมินล่วงหน้า 81+\n③ Sejong Institute ระดับกลาง 2+',
  'workPermit.hours.bonus1':
    'คอลัมน์ขวาสุดใช้เมื่อผ่านภาษาแล้ว และเป็นหนึ่งใน: มหาวิทยาลัยรับรอง, เกรด A ทั้งเทอมก่อน, หรือ TOPIK 5+ / KIIP 5+',
  'workPermit.hours.bonus2':
    'เมื่อทำเครื่องหมาย **O** สุดสัปดาห์ วันหยุดราชการ และปิดเทอม **ไม่จำกัดชั่วโมง**',
  'workPermit.hours.bonus3':
    'ยังต้องมีใบอนุญาตจริง — ขีดจำกัดในตารางไม่เกิดอัตโนมัติ',
  'workPermit.hours.note':
    'เมื่อทำเครื่องหมาย **X** ใช้ขีดจำกัดเดียวกันทั้งวันธรรมดา สุดสัปดาห์ และปิดเทอม นักเรียนหลักสูตรภาษาอังกฤษใช้คะแนนภาษาอังกฤษแทนคอลัมน์ภาษาเกาหลี',

  'workPermit.documents.title': 'เอกสารที่ต้องยื่น (제출 서류)',
  'workPermit.documents.item1': 'แบบฟอร์ม หนังสือเดินทาง บัตร ARC — **ไม่เสียค่าธรรมเนียม**',
  'workPermit.documents.item2': 'ใบแสดงเกรด (성적증명서)',
  'workPermit.documents.item3': 'หลักฐานภาษาเกาหลีหรืออังกฤษ',
  'workPermit.documents.item4': 'หนังสือยืนยัน part-time (ออกโดย **สำนักงานความสัมพันธ์ต่างประเทศ PNU**)',
  'workPermit.documents.item5': 'หนังสือยืนยันการปฏิบัติตามเงื่อนไข',
  'workPermit.documents.item6': 'ทะเบียนธุรกิจนายจ้าง บัตรประชาชน และสัญญาจ้างมาตรฐาน',
  'workPermit.documents.item7': 'โรงงาน/ก่อสร้าง: แบบฟอร์มเพิ่มเติม',
  'workPermit.documents.note': 'สัญญาต้องกับธุรกิจที่จดทะเบียนโดยตรง — **ห้าม** ผ่านบริษัทส่งคน/นายหน้า',

  'workPermit.apply.title': 'วิธีสมัคร (신청 방법)',
  'workPermit.apply.step1': 'ขออนุมัติมหาวิทยาลัยก่อน — PNU ติดต่อ **สำนักงานความสัมพันธ์ต่างประเทศ (국제처)**',
  'workPermit.apply.step2':
    'ยื่นที่สำนักงานตรวจคนเข้าเมือง หรือออนไลน์ [Hi Korea](https://www.hikorea.go.kr) → 민원신청 → 전자민원',
  'workPermit.apply.step3': 'อนุมัติได้สูงสุด **2 ที่ทำงาน** มีผลจนหมดระยะพำนัก (สูงสุด 1 ปี/ครั้ง)',
  'workPermit.apply.step4': '**เปลี่ยนงาน?** ต้องได้ใบอนุญาตใหม่**ก่อน**เริ่มงานใหม่',
  'workPermit.apply.related.hiKorea': 'Hi Korea (พอร์ทัลตรวจคนเข้าเมือง)',
  'workPermit.apply.note':
    '**สำนักงานตรวจคนเข้าเมือง Busan (부산출입국·외국인청):** ชั้น 1 อาคาร Korean Air, 146 Jungang-daero · รถไฟใต้ดินสถานี Busan ทางออก 2 หรือ Jungang 14 · จ–ศ 9:00–18:00 · **1345**',

  'workPermit.restrictions.title': 'งานที่ห้าม (제한대상)',
  'workPermit.restrictions.item1': 'โรงงาน/ก่อสร้าง (โรงงานต้อง TOPIK 4+; ก่อสร้างแทบห้าม — ละเมิด = สั่งออกนอกประเทศ)',
  'workPermit.restrictions.item2': 'ติวเตอร์ส่วนตัว (개인과외)',
  'workPermit.restrictions.item3': 'สถานบันเทิงผู้ใหญ่ (บาร์, นวด/อาบน้ำ, โมเต็ล, เกม...)',
  'workPermit.restrictions.item4': 'งานแพลตฟอร์ม: ส่งของ, ขนส่ง, ขับแทน, ประกัน/ขายต door-to-door',
  'workPermit.restrictions.item5': 'งาน remote เท่านั้น',
  'workPermit.restrictions.item6': 'งานผ่านบริษัทส่งคน/นายหน้าแรงงาน',

  'workPermit.violations.title': 'บทลงโทษ (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'สถานการณ์',
  'workPermit.violations.table.colResult': 'ผล',
  'workPermit.violations.table.row1Situation': 'ทำงานไม่มีใบอนุญาต',
  'workPermit.violations.table.row1Result': 'ทำงานผิดกฎหมาย — ลงโทษ; ก่อสร้าง = สั่งออก',
  'workPermit.violations.table.row2Situation': 'ละเมิดใบอนุญาตครั้งที่ 1',
  'workPermit.violations.table.row2Result': 'ตักเตือน',
  'workPermit.violations.table.row3Situation': 'ครั้งที่ 2',
  'workPermit.violations.table.row3Result': 'ห้าม part-time จนจบการศึกษา',
  'workPermit.violations.table.row4Situation': 'ครั้งที่ 3',
  'workPermit.violations.table.row4Result': 'อาจเพิกถอนสถานะนักเรียน (유학자격)',
  'workPermit.violations.note': 'ทำงานไม่มีใบอนุญาตแม้ครั้งแรกอาจถูกลงโทษหนัก โทร **1345** ก่อนรับงานหากไม่แน่ใจ',
}

export default messages
