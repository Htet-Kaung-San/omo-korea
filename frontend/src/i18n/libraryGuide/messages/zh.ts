import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': '釜山大学图书馆移动应用（부산대 도서관_PNUL）使用指南',
  'library.steps': '步骤',
  'library.usageGuide': '使用指南',

  'library.install.title': '安装应用',
  'library.install.step1':
    '在 [Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib)（Android）或 Apple App Store（iOS）搜索"PNUL"或"부산대 도서관"并安装。',
  'library.install.step2':
    '如果您之前使用过旧的"부산대 도서관"或"PNU Place"应用，这些应用已停用 — 请改用此新应用。',
  'library.install.step3':
    '使用 PNU 学生门户账号登录（与 [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) 相同的 ID/密码）。',

  'library.seatReservation.title': '阅览室座位预约 (열람실 좌석예약)',
  'library.seatReservation.tip1':
    '只有通过应用分配的座位才有效 — 使用未分配的座位被发现后将受到图书馆使用限制。',
  'library.seatReservation.tip2':
    '预约后必须在 15 分钟内通过入口闸机，否则分配将被取消。',
  'library.seatReservation.tip3':
    '续时在使用时段结束前 2 小时开放。每次续时增加 4 小时，最多可续 4 次。',
  'library.seatReservation.tip4':
    '续时可在应用中操作，也可在图书馆内的 좌석배정기（座位分配机）上操作。',
  'library.seatReservation.tip5': '时间到期后座位会自动归还。',
  'library.seatReservation.tip6':
    '注意：중앙도서관（中央图书馆）主要是藏书空间 — 部分阅览区完全不需要座位分配。',
  'library.seatReservation.step1':
    '在首页顶部附近找到 좌석예약（座位预约）面板。如果没有有效预约，会显示"예약된 정보가 없습니다"（无预约信息）。点击 배정신청（申请分配）开始新预约，或点击 이용내역（使用记录）查看历史记录。',
  'library.seatReservation.step2':
    '在标签栏中选择建筑 — 나노생命、의생명、미리내、새벽벌 或 중앙。',
  'library.seatReservation.step3':
    '选择楼层（1층、2층……），然后选择该楼层的空间类型标签（例如 [새벽벌]열람실 为阅览室，[새벽벌]PC 为 PC 区）。',
  'library.seatReservation.step4':
    '每个区域的实时占用率以环形图显示 — 例如"새벽누리-열람존 34/73"表示 73 个座位中 34 个已占用，39 个空闲。',
  'library.seatReservation.step5':
    '点击进入区域，选择具体座位并确认。',
  'library.seatReservation.image.homeScreen':
    '首页 — 带 배정신청 按钮的 좌석예약 面板',
  'library.seatReservation.image.buildingFloor':
    '建筑、楼层和区域选择及实时座位占用情况',

  'library.libraryCard.title': '图书馆证 / 이용증',
  'library.libraryCard.step1': '打开应用，通过顶部 메뉴（菜单）→ LOGIN 登录。',
  'library.libraryCard.step2':
    '点击底部导航栏中的 이용증 — 底部导航为 MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴，是直接标签页，不在子菜单中。',
  'library.libraryCard.step3':
    '이용증 页面显示 QR 码 — 这是您的移动图书馆证。在图书馆入口闸机扫描即可进入。',
}

export default messages
