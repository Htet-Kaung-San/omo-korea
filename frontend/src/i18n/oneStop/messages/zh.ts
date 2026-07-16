import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'onestop.pusan.ac.kr 分步操作指南',
  'oneStop.steps': '步骤',
  'oneStop.relatedPages': '相关页面',
  'oneStop.note': '备注',

  'oneStop.registration.title': '课程注册 (수강신청)',
  'oneStop.registration.step1':
    '使用学号和密码登录 [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)。',
  'oneStop.registration.step2':
    '进入 수업（课程）→ 수강신청및확인（注册与确认）。',
  'oneStop.registration.step3':
    '请先查看课程目录：[수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — 可按院系搜索、浏览开课班级、查看名额限制。',
  'oneStop.registration.step4':
    '在选课期间，实际提交需在独立的选课系统完成：[sugang.pusan.ac.kr](https://sugang.pusan.ac.kr)（电脑或手机网页）。这是与 One-Stop 不同的网站 — 如果被跳转到这里，请不要混淆。',
  'oneStop.registration.step5':
    '提交后，返回 One-Stop → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) 确认课程是否已成功注册 — 每次都要确认，因为"心愿单"（희망과목담기）不等于正式注册。',
  'oneStop.registration.related.addDrop': '加退选 (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': '退课 (수강취소)',
  'oneStop.registration.related.timetable': '课表查询 (시간표조회)',
  'oneStop.registration.note':
    '选课仅在学年历规定的特定时间段开放（通常在 One-Stop 首页公布）。请提前确认日期 — 系统仅在这些时段可用。',

  'oneStop.cancellation.title': '退课 / 退学 (수강취소)',
  'oneStop.cancellation.step1':
    '登录 [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)。',
  'oneStop.cancellation.step2':
    '进入 수업（课程）→ 수강취소（退课）：[Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': '选择要退的课程并确认。',
  'oneStop.cancellation.step4':
    '之后，重新查看 [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355)，确认该课程已不再出现在您的在读课表中。',
  'oneStop.cancellation.note':
    '这与 수강정정（加退选）不同，加退选在学期初进行且不留记录。수강취소 在学期中后期开放（通常为期中考试后的短暂窗口），会在成绩单上留下 W（Withdrawal）标记，而非完全删除课程。具体日期每学期在学年历中公布。',

  'oneStop.grades.title': '成绩查询 (성적확인)',
  'oneStop.grades.step1':
    '登录 [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)。',
  'oneStop.grades.step2': '进入 수업（课程）→ 成绩栏目。',
  'oneStop.grades.step3':
    '本学期成绩：[Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    '全部学期成绩：[All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    '本学期成绩通常在期末成绩公布结束后才可查看 — 如果显示为空，可能成绩尚未发布。',

  'oneStop.tuition.title': '学费 — 缴费通知单 / 缴费确认 (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    '登录 [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)。',
  'oneStop.tuition.step2': '进入 등록（注册/学费）菜单。',
  'oneStop.tuition.step3': '打印/查看缴费通知单：고지서출력（Bill Print）。',
  'oneStop.tuition.step4':
    '记下通知单上的学校缴费代码（因银行而异 — NH、釜山银行、韩亚银行等），通过银行转账、ATM、网上/电话银行或到银行柜台缴费。',
  'oneStop.tuition.step5':
    '确认缴费是否成功：납부확인（Payment Confirmation / Receipt Print）— 缴费后务必确认，因为缴费可能不会立即反映。',
  'oneStop.tuition.note':
    '学费通知单无法通过电话/邮件/传真代为申请 — 您必须使用自己的账号亲自登录查看。',

  'oneStop.leaveReturn.title': '休学 / 复学申请 (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    '登录 [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)。',
  'oneStop.leaveReturn.step2':
    '申请休学：[Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    '申请复学：[Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    '两者每学期都有特定的申请窗口（请查看 One-Stop 首页的学年历）— 在窗口期外申请可能无法进行。',
}

export default messages
