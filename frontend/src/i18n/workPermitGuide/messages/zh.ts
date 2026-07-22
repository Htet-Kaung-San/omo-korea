import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': '外国留学生兼职工作许可指南（시간제 취업허가）',
  'workPermit.disclaimerTitle': '重要提示',
  'workPermit.disclaimer':
    '这是**出入境法律规定**，不是校内手续。信息错误可能导致处罚、禁止打工或取消留学资格。申请前请务必向 PNU **国际处（국제처）** 或出入境咨询热线 **1345** 确认。',
  'workPermit.sourceDate': '依据法务部2026年2月指南。规定可能变更 — 请查阅 [Hi Korea](https://www.hikorea.go.kr) 获取最新信息。',
  'workPermit.keyPoints': '要点',
  'workPermit.steps': '步骤',
  'workPermit.relatedPages': '相关链接',
  'workPermit.note': '备注',

  'workPermit.basics.title': '是否需要许可？（기본원칙）',
  'workPermit.basics.point1':
    '持 D-2 留学签证者**未经批准不得在韩国工作或有收入**，包括兼职（아르바이트）。',
  'workPermit.basics.point2':
    '获得**大学与出入境机关双方批准**后，可在限定范围内兼职。',
  'workPermit.basics.point3':
    '专业职种（E-1~E-7，如语言教学）通常需另行申请**체류자격외 활동허가**，不适用本许可。',
  'workPermit.basics.note': '本指南仅涵盖一般兼职。研究/家政类许可为单独事项。',

  'workPermit.eligibility.title': '申请资格（대상자 요건）',
  'workPermit.eligibility.point1':
    '**成绩：** 最近一学期 GPA C（2.0）以上。第一学期无成绩单可豁免，但允许工时为正常的一半。',
  'workPermit.eligibility.point2':
    '**语言：** 见下表。语言未达标但其他条件满足时，仍可获得许可，但工时为**正常的一半**。',
  'workPermit.eligibility.point3':
    '**停留时间：** 交换/访问留学生（D-2-8）须入境或变更资格后满 **6 个月**。',
  'workPermit.eligibility.point4': '**无违规记录：** 近 3 个月内无兼职违规。',
  'workPermit.eligibility.languageTable.title': '语言要求',
  'workPermit.eligibility.languageTable.colLevel': '对象',
  'workPermit.eligibility.languageTable.colKorean': '韩语课程',
  'workPermit.eligibility.languageTable.colEnglish': '英语课程（不限年级）',
  'workPermit.eligibility.languageTable.row1Level': '本科 1–2 年级',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3级+ / 世宗中级1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': '本科 3–4 年级及研究生',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4级+ / 世宗中级2+',
  'workPermit.eligibility.languageTable.row2English': '同上',
  'workPermit.eligibility.note': '英语课程学生使用英语栏要求，而非韩语要求。',

  'workPermit.hours.title': '允许工时（허용 시간）',
  'workPermit.hours.table.title': '兼职工作工时上限（시간제 취업활동 허용시간 차등 적용 기준）',
  'workPermit.hours.table.colCourse': '课程',
  'workPermit.hours.table.colYear': '年级',
  'workPermit.hours.table.colKoreanCriteria': '韩语能力',
  'workPermit.hours.table.colMet': '是否达标',
  'workPermit.hours.table.colAllowedHours': '允许工时',
  'workPermit.hours.table.colWeekday': '平日',
  'workPermit.hours.table.colWeekend': '周末·假期',
  'workPermit.hours.table.colBonus': '认证大学、\n成绩优秀、\n韩语优秀\n（平日）',
  'workPermit.hours.table.bachelor': '本科',
  'workPermit.hours.table.bachelorY12': '1–2',
  'workPermit.hours.table.bachelorY34': '3–4',
  'workPermit.hours.table.grad': '硕/博',
  'workPermit.hours.table.anyYear': '不限',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 小时',
  'workPermit.hours.table.hours15': '15 小时',
  'workPermit.hours.table.hours25': '25 小时',
  'workPermit.hours.table.hours30': '30 小时',
  'workPermit.hours.table.hours35': '35 小时',
  'workPermit.hours.table.unlimited': '不限',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK 3级\n② 社会统合项目(KIIP) 3阶段以上或事前评估61分以上\n③ 世宗学堂 한국어课程 中급1以上',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK 4级\n② 社会统合项目(KIIP) 4阶段以上或事前评估81分以上\n③ 世宗学堂 한국어课程 中급2以上',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK 4级\n② 社会统合项目(KIIP) 4阶段以上或事前评估81分以上\n③ 世宗学堂 한국어课程 中급2以上',
  'workPermit.hours.bonus1':
    '最右列适用于已满足语言要求，且符合认证大学在读、上学期全 A 或 TOPIK 5+ / KIIP 5级+ 之一的情况。',
  'workPermit.hours.bonus2':
    '标记为 **O** 时，周末、公休日及学校假期无工时限制。',
  'workPermit.hours.bonus3':
    '仍需正式许可 — 表中时限不会自动生效。',
  'workPermit.hours.note':
    '标记为 **X** 时，平日、周末及假期均适用相同上限。英语课程学生以英语成绩代替韩语能力列。',

  'workPermit.documents.title': '所需材料（제출 서류）',
  'workPermit.documents.item1': '申请表、护照、外国人登录证 — **免手续费**',
  'workPermit.documents.item2': '成绩单（성적증명서）',
  'workPermit.documents.item3': '韩语或英语能力证明',
  'workPermit.documents.item4': '外国人留学生兼职确认书（由 PNU **国际处** 签发）',
  'workPermit.documents.item5': '外国人留学生兼职要件遵守确认书',
  'workPermit.documents.item6': '雇主营业执照、身份证及标准劳动合同（须注明时薪、职责、工时）',
  'workPermit.documents.item7': '制造/建筑业雇主：额外遵守确认书',
  'workPermit.documents.note': '须与营业执照上的企业**直接**签约 — **禁止**派遣/中介安排。',

  'workPermit.apply.title': '申请方法（신청 방법）',
  'workPermit.apply.step1': '先获大学确认 — PNU 请向 **国际处（국제처）** 申请确认书。',
  'workPermit.apply.step2':
    '向管辖出入境机关提交，或通过 [Hi Korea](https://www.hikorea.go.kr) 在线申请 → 민원신청 → 电子민원。',
  'workPermit.apply.step3': '批准后可同时在**最多 2 处**工作，有效期至剩余停留期（每次最长 1 年）。',
  'workPermit.apply.step4': '**更换工作？** 须在新工作开始前取得新许可 — 不可追溯。',
  'workPermit.apply.related.hiKorea': 'Hi Korea（出入境官方门户）',
  'workPermit.apply.note':
    '**釜山出入境·外国人厅：** 大韩航空大厦1层，中区中央大路146 · 地铁1号线釜山站2号或中央站14号出口 · 周一至周五 9:00–18:00（午休 12:00–13:00） · **1345**（多语言咨询）',

  'workPermit.restrictions.title': '禁止行业（제한대상）',
  'workPermit.restrictions.item1': '制造/建筑业（制造需 TOPIK 4+；建筑实质上禁止 — 违规即出境命令）',
  'workPermit.restrictions.item2': '私人一对一家教（개인과외）',
  'workPermit.restrictions.item3': '娱乐/夜生活相关行业（陪酒酒吧、按摩/浴场、汽车旅馆、游戏厅等）',
  'workPermit.restrictions.item4': '平台零工：外卖、快递、代驾、保险/上门销售',
  'workPermit.restrictions.item5': '纯远程/居家办公岗位',
  'workPermit.restrictions.item6': '通过人力派遣/劳务中介安排的工作',

  'workPermit.violations.title': '违规处理（위반 시 처리）',
  'workPermit.violations.table.colSituation': '情况',
  'workPermit.violations.table.colResult': '后果',
  'workPermit.violations.table.row1Situation': '无证工作',
  'workPermit.violations.table.row1Result': '非法就业 — 处罚；建筑业 = 出境命令',
  'workPermit.violations.table.row2Situation': '第 1 次许可违规（工时/场所等）',
  'workPermit.violations.table.row2Result': '正式警告',
  'workPermit.violations.table.row3Situation': '第 2 次违规',
  'workPermit.violations.table.row3Result': '至毕业禁止兼职',
  'workPermit.violations.table.row4Situation': '第 3 次违规',
  'workPermit.violations.table.row4Result': '可能取消留学资格（유학자격）',
  'workPermit.violations.note': '无证工作即使首次也可能受到严重处罚。有疑问请在开工前拨打 **1345**。',
}

export default messages
