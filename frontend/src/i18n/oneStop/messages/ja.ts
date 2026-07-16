import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'onestop.pusan.ac.kr のステップバイステップガイド',
  'oneStop.steps': '手順',
  'oneStop.relatedPages': '関連ページ',
  'oneStop.note': '注意',

  'oneStop.registration.title': '履修登録 (수강신청)',
  'oneStop.registration.step1':
    '学籍番号とパスワードで [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) にログインします。',
  'oneStop.registration.step2':
    '수업 (Classes) → 수강신청및확인 (Registration & Confirmation) に移動します。',
  'oneStop.registration.step3':
    'まず履修要覧を確認: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — 学科で検索、開講クラスを閲覧、定員を確認。',
  'oneStop.registration.step4':
    '履修登録期間中、実際の申請は別の登録システムで行います: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr)（PCまたはモバイルWeb）。One-Stopとは別サイトです — ここにリダイレクトされても混乱しないでください。',
  'oneStop.registration.step5':
    '申請後、One-Stopに戻り → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) で履修が実際に登録されたか確認 — 毎回確認してください。「wishlist」(희망과목담기) は確定した登録とは異なります。',
  'oneStop.registration.related.addDrop': '履修追加・変更 (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': '履修取消 (수강취소)',
  'oneStop.registration.related.timetable': '時間割照会 (시간표조회)',
  'oneStop.registration.note':
    '履修登録は学事暦で定められた特定の期間のみ開放されます（通常One-Stopホームページに掲載）。事前に日程を確認してください — この期間のみシステムが利用可能です。',

  'oneStop.cancellation.title': '履修取消 / 退学 (수강취소)',
  'oneStop.cancellation.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) にログインします。',
  'oneStop.cancellation.step2':
    '수업 (Classes) → 수강취소 (Course Cancellation): [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': '取消したい科目を選択して確認します。',
  'oneStop.cancellation.step4':
    'その後、[수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) を再確認し、科目が履修中の時間割に表示されなくなったことを確認します。',
  'oneStop.cancellation.note':
    'これは学期初めに行われ記録が残らない 수강정정 (add/drop) とは異なります。수강취소 は学期後半（通常中間試験後の短期間）に開放され、科目を完全に削除するのではなく成績証明書に W (Withdrawal) マークが残ります。正確な日程は毎学期学事暦で定められます。',

  'oneStop.grades.title': '成績確認 (성적확인)',
  'oneStop.grades.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) にログインします。',
  'oneStop.grades.step2': '수업 (Classes) → 成績セクションに移動します。',
  'oneStop.grades.step3':
    '今学期: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    '全学期: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    '今学期の成績は通常、最終成績の公表が終わってから表示されます — 空欄の場合、まだ成績が公開されていない可能性があります。',

  'oneStop.tuition.title': '学費 — 納付通知書 / 納付確認 (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) にログインします。',
  'oneStop.tuition.step2': '등록 (Registration/Tuition) メニューに移動します。',
  'oneStop.tuition.step3': '納付通知書の印刷・閲覧: 고지서출력 (Bill Print)。',
  'oneStop.tuition.step4':
    '通知書に記載の学校納付コード（銀行により異なる — NH、釜山銀行、ハナなど）を確認し、銀行振込、ATM、インターネット/電話バンキング、または銀行窓口で納付します。',
  'oneStop.tuition.step5':
    '納付確認: 납부확인 (Payment Confirmation / Receipt Print) — 納付後に必ず確認してください。反映に時間がかかる場合があります。',
  'oneStop.tuition.note':
    '学費の納付通知書は電話/メール/FAXで代理請求できません — ご自身のアカウントで直接アクセスする必要があります。',

  'oneStop.leaveReturn.title': '休学 / 復学申請 (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) にログインします。',
  'oneStop.leaveReturn.step2':
    '休学申請: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    '復学申請: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'どちらも毎学期特定の申請期間があります（One-Stopホームページの学事暦を確認） — 期間外の申請はできない場合があります。',
}

export default messages
