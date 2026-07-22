import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': '外国人留学生のアルバイト許可ガイド（시간제 취업허가）',
  'workPermit.disclaimerTitle': '重要',
  'workPermit.disclaimer':
    'これは**入国・滞在に関する法律**であり、学内手続きではありません。誤った情報は罰則、就労禁止、留学資格取消につながる可能性があります。申請前に PNU **国際処（국제처）** または入国相談 **1345** に必ず確認してください。',
  'workPermit.sourceDate': '法務省2026年2月ガイドに基づく。規定は変更される場合があります — [Hi Korea](https://www.hikorea.go.kr) で最新情報を確認してください。',
  'workPermit.keyPoints': '要点',
  'workPermit.steps': '手順',
  'workPermit.relatedPages': '関連リンク',
  'workPermit.note': '備考',

  'workPermit.basics.title': '許可は必要？（기본원칙）',
  'workPermit.basics.point1':
    'D-2 留学ビザ保持者は許可なく**就労・収入を得ることはできません** — アルバイト（아르바이트）を含みます。',
  'workPermit.basics.point2':
    '**大学と入国管理事務所の双方の承認**があれば、限定的なアルバイトが可能です。',
  'workPermit.basics.point3':
    '専門職（E-1~E-7、語学講師など）は別途 **체류자격외 활동허가** が必要な場合が多く、この許可の対象外です。',
  'workPermit.basics.note': '一般的なアルバイトのみを扱います。研究・家事支援などは別手続きです。',

  'workPermit.eligibility.title': '対象要件（대상자 요건）',
  'workPermit.eligibility.point1':
    '**成績：** 直近学期 GPA C（2.0）以上。第1学期（成績証明書なし）は例外ですが、許可時間は半分に制限されます。',
  'workPermit.eligibility.point2':
    '**語学：** 下表参照。語学要件を満たさなくても他の条件を満たせば許可可能ですが、時間は**通常の半分**です。',
  'workPermit.eligibility.point3':
    '**滞在期間：** 交換・訪問留学生（D-2-8）は入国または資格変更後 **6 か月** 経過が必要です。',
  'workPermit.eligibility.point4': '**違反歴：** 過去3か月以内にアルバイト違反がないこと。',
  'workPermit.eligibility.languageTable.title': '語学要件',
  'workPermit.eligibility.languageTable.colLevel': '対象',
  'workPermit.eligibility.languageTable.colKorean': '韓国語コース',
  'workPermit.eligibility.languageTable.colEnglish': '英語コース（学年問わず）',
  'workPermit.eligibility.languageTable.row1Level': '学士 1–2 年次',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3段階+ / 世宗中級1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': '学士 3–4 年次・大学院',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4段階+ / 世宗中級2+',
  'workPermit.eligibility.languageTable.row2English': '上記と同じ',
  'workPermit.eligibility.note': '英語トラックの学生は韓国語要件の代わりに英語欄を使用します。',

  'workPermit.hours.title': '許可時間（허용 시간）',
  'workPermit.hours.table.title': 'アルバイト時間上限（시간제 취업활동 허용시간 차등 적용 기준）',
  'workPermit.hours.table.colCourse': '課程',
  'workPermit.hours.table.colYear': '学年',
  'workPermit.hours.table.colKoreanCriteria': '韓国語能力',
  'workPermit.hours.table.colMet': '達成\n可否',
  'workPermit.hours.table.colAllowedHours': '許可時間',
  'workPermit.hours.table.colWeekday': '平日',
  'workPermit.hours.table.colWeekend': '週末・休暇',
  'workPermit.hours.table.colBonus': '認証大学、\n成績優秀、\n韓国語優秀\n（平日）',
  'workPermit.hours.table.bachelor': '学士',
  'workPermit.hours.table.bachelorY12': '1–2',
  'workPermit.hours.table.bachelorY34': '3–4',
  'workPermit.hours.table.grad': '修士・博士',
  'workPermit.hours.table.anyYear': '不問',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 時間',
  'workPermit.hours.table.hours15': '15 時間',
  'workPermit.hours.table.hours25': '25 時間',
  'workPermit.hours.table.hours30': '30 時間',
  'workPermit.hours.table.hours35': '35 時間',
  'workPermit.hours.table.unlimited': '制限なし',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK 3級\n② 社会統合プログラム 3段階以上または事前評価61点以上\n③ 世宗学堂 한국어 과정 中級1以上',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK 4級\n② 社会統合プログラム 4段階以上または事前評価81点以上\n③ 世宗学堂 한국어 과정 中級2以上',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK 4級\n② 社会統合プログラム 4段階以上または事前評価81点以上\n③ 世宗学堂 한국어 과정 中級2以上',
  'workPermit.hours.bonus1':
    '最右列は、語学要件を満たし、かつ（認証大学在籍・前学期全A・TOPIK 5+ / KIIP 5段階+）のいずれかに該当する場合に適用されます。',
  'workPermit.hours.bonus2':
    '**O** の場合、週末・祝日・学校休暇は時間制限ありません。',
  'workPermit.hours.bonus3':
    '表の時間は自動適用されません — 必ず許可を取得してください。',
  'workPermit.hours.note':
    '**X** の場合、平日・週末・休暇とも同じ時間制限が適用されます。英語プログラムの学生は韓国語基準の代わりに英語成績を使用します。',

  'workPermit.documents.title': '提出書類（제출 서류）',
  'workPermit.documents.item1': '申請書、パスポート、外国人登録証 — **手数料無料**',
  'workPermit.documents.item2': '成績証明書（성적증명서）',
  'workPermit.documents.item3': '韓国語または英語能力の証明',
  'workPermit.documents.item4': '外国人留学生アルバイト確認書（PNU **国際処** 発行）',
  'workPermit.documents.item5': '外国人留学生アルバイト要件遵守確認書',
  'workPermit.documents.item6': '事業者登録証、雇用主身分証、標準労働契約書（時給・業務・時間を明記）',
  'workPermit.documents.item7': '製造・建設業：追加遵守確認書',
  'workPermit.documents.note': '事業者登録証の事業体と**直接**契約すること — 派遣・仲介は**不可**。',

  'workPermit.apply.title': '申請方法（신청 방법）',
  'workPermit.apply.step1': 'まず大学の確認を — PNU は **国際処（국제처）** で確認書を発行します。',
  'workPermit.apply.step2':
    '管轄入国管理事務所へ申請、または [Hi Korea](https://www.hikorea.go.kr) オンライン（민원신청 → 電子민원）。',
  'workPermit.apply.step3': '承認後 **最大2か所** で就労可能。残存滞在期間内有効（1回最大1年）。',
  'workPermit.apply.step4': '**転職時** は新しい職場開始**前**に新許可が必要 — 遡及適用不可。',
  'workPermit.apply.related.hiKorea': 'Hi Korea（入国電子민원）',
  'workPermit.apply.note':
    '**釜山出入国・外国人庁：** 大韓航空ビル1F、中区中央大路146 · 地下鉄1号线釜山駅2番または中央駅14番 · 月–金 9:00–18:00（昼休 12:00–13:00） · **1345**（多言語相談）',

  'workPermit.restrictions.title': '制限業種（제한대상）',
  'workPermit.restrictions.item1': '製造・建設（製造は TOPIK 4+ 必要；建設は事実上不可 — 1回違反で出国命令）',
  'workPermit.restrictions.item2': '個人塾（개인과외）',
  'workPermit.restrictions.item3': '風俗・ナイトライフ関連（接待バー、マッサージ/浴場、モーテル、ゲーム室など）',
  'workPermit.restrictions.item4': 'プラットフォーム仕事：配達、宅配、代行運転、保険/訪問販売',
  'workPermit.restrictions.item5': '在宅・リモートのみの職種',
  'workPermit.restrictions.item6': '人材派遣・労務仲介経由の雇用',

  'workPermit.violations.title': '違反時の処理（위반 시 처리）',
  'workPermit.violations.table.colSituation': '状況',
  'workPermit.violations.table.colResult': '措置',
  'workPermit.violations.table.row1Situation': '無許可就労',
  'workPermit.violations.table.row1Result': '不法就労 — 制裁；建設業は出国命令',
  'workPermit.violations.table.row2Situation': '許可違反 1 回目',
  'workPermit.violations.table.row2Result': '警告',
  'workPermit.violations.table.row3Situation': '2 回目',
  'workPermit.violations.table.row3Result': '卒業までアルバイト禁止',
  'workPermit.violations.table.row4Situation': '3 回目',
  'workPermit.violations.table.row4Result': '留学資格（유학자격）取消の可能性',
  'workPermit.violations.note': '無許可就労は初回でも重大な不利益があります。迷ったら就業前に **1345** へ。',
}

export default messages
