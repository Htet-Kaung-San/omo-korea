import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'PNU図書館モバイルアプリ（부산대 도서관_PNUL）の使い方',
  'library.steps': '手順',
  'library.usageGuide': '利用ガイド',

  'library.install.title': 'アプリのインストール',
  'library.install.step1':
    '[Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib)（Android）または Apple App Store（iOS）で「PNUL」または「부산대 도서관」を検索してインストールします。',
  'library.install.step2':
    '以前「부산대 도서관」または「PNU Place」アプリを使用していた場合、それらは廃止されています — この新しいアプリに置き換わります。',
  'library.install.step3':
    'PNU学生ポータルの認証情報（[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)と同じID/パスワード）でログインします。',

  'library.seatReservation.title': '閲覧室座席予約 (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'アプリで割り当てられた座席のみ有効です — 未割り当ての座席を使用して発見されると、図書館利用が制限されます。',
  'library.seatReservation.tip2':
    '予約後15分以内に入場ゲートを通過する必要があります。さもないと割り当てはキャンセルされます。',
  'library.seatReservation.tip3':
    '延長は利用時間終了の2時間前から可能です。1回の延長で4時間追加され、最大4回まで延長できます。',
  'library.seatReservation.tip4':
    '延長はアプリまたは図書館内の 좌석배정기（座席割り当て機）で行えます。',
  'library.seatReservation.tip5': '時間が終了すると座席は自動的に返却されます。',
  'library.seatReservation.tip6':
    '注意：중앙도서관（中央図書館）は主に蔵書スペースです — 一部の閲覧エリアは座席割り当てが不要です。',
  'library.seatReservation.step1':
    'ホーム画面の上部付近にある 좌석예약（座席予約）パネルを確認します。有効な予約がない場合は「예약된 정보가 없습니다」（予約情報なし）と表示されます。新しい予約を開始するには 배정신청（割り当て申請）を、過去の利用履歴を見るには 이용내역（利用履歴）をタップします。',
  'library.seatReservation.step2':
    'タブ行から建物を選択します — 나노생명、의생명、미리내、새벽벌、または 중앙。',
  'library.seatReservation.step3':
    '階（1층、2층……）を選択し、その階のスペース種別タブを選択します（例：[새벽벌]열람실 は閲覧室、[새벽벌]PC はPCゾーン）。',
  'library.seatReservation.step4':
    '各ゾーンのリアルタイム占有率がリングチャートで表示されます — 例：「새벽누리-열람존 34/73」は73席中34席が使用中、39席が空いていることを意味します。',
  'library.seatReservation.step5':
    'ゾーンをタップして個別の座席を選択し、確認します。',
  'library.seatReservation.image.homeScreen':
    'ホーム画面 — 배정신청 ボタン付き 좌석예약 パネル',
  'library.seatReservation.image.buildingFloor':
    '建物・階・ゾーン選択とリアルタイム座席占有率',

  'library.libraryCard.title': '図書館カード / 이용증',
  'library.libraryCard.step1': 'アプリを開き、上部の 메뉴（メニュー）→ LOGIN でログインします。',
  'library.libraryCard.step2':
    '下部ナビゲーションバーの 이용증 をタップします — 下部ナビは MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴 の順で、サブメニューではなく直接タブです。',
  'library.libraryCard.step3':
    '이용증 画面にQRコードが表示されます — これがモバイル図書館カードです。図書館入場ゲートでスキャンして入場します。',
}

export default messages
