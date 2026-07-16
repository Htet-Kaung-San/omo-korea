import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'Hướng dẫn sử dụng ứng dụng thư viện PNU (부산대 도서관_PNUL)',
  'library.steps': 'Các bước',
  'library.usageGuide': 'Hướng dẫn sử dụng',

  'library.install.title': 'Cài đặt ứng dụng',
  'library.install.step1':
    'Tìm "PNUL" hoặc "부산대 도서관" trên [Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) hoặc Apple App Store (iOS) và cài đặt.',
  'library.install.step2':
    'Nếu bạn từng dùng ứng dụng cũ "부산대 도서관" hoặc "PNU Place", các ứng dụng đó đã ngừng hỗ trợ — ứng dụng mới này thay thế cả hai.',
  'library.install.step3':
    'Đăng nhập bằng tài khoản cổng sinh viên PNU (cùng ID/mật khẩu với [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)).',

  'library.seatReservation.title': 'Đặt chỗ ngồi phòng đọc (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'Chỉ có chỗ ngồi được phân qua ứng dụng mới hợp lệ — dùng chỗ chưa được phân và bị phát hiện sẽ bị hạn chế sử dụng thư viện.',
  'library.seatReservation.tip2':
    'Sau khi đặt, bạn phải qua cổng vào trong 15 phút, nếu không việc phân chỗ sẽ bị hủy.',
  'library.seatReservation.tip3':
    'Gia hạn mở 2 giờ trước khi phiên kết thúc. Mỗi lần gia hạn thêm 4 giờ, tối đa 4 lần.',
  'library.seatReservation.tip4':
    'Gia hạn có thể thực hiện trên ứng dụng hoặc tại 좌석배정기 (máy phân chỗ ngồi) trong thư viện.',
  'library.seatReservation.tip5': 'Chỗ ngồi tự động trả khi hết thời gian.',
  'library.seatReservation.tip6':
    'Lưu ý: 중앙도서관 (Thư viện Trung ương) chủ yếu là khu lưu trữ sách — một số khu đọc không cần phân chỗ ngồi.',
  'library.seatReservation.step1':
    'Trên màn hình chính, tìm bảng 좌석예약 (Đặt chỗ ngồi) gần phía trên. Nếu không có đặt chỗ đang hoạt động sẽ hiện "예약된 정보가 없습니다" (Không có thông tin đặt chỗ). Chạm 배정신청 (Yêu cầu phân chỗ) để đặt mới, hoặc 이용내역 (Lịch sử sử dụng) để xem trước đây.',
  'library.seatReservation.step2':
    'Chọn tòa nhà từ hàng tab — 나노생명, 의생명, 미리내, 새벽벌 hoặc 중앙.',
  'library.seatReservation.step3':
    'Chọn tầng (1층, 2층, ...), rồi chọn tab loại phòng trong tầng đó (ví dụ [새벽벌]열람실 cho phòng đọc vs. [새벽벌]PC cho khu PC).',
  'library.seatReservation.step4':
    'Bạn sẽ thấy mức sử dụng thời gian thực của từng khu dạng biểu đồ vòng — ví dụ "새벽누리-열람존 34/73" nghĩa là 34/73 chỗ đã dùng, 39 chỗ trống.',
  'library.seatReservation.step5':
    'Chạm vào khu để chọn chỗ ngồi cụ thể và xác nhận.',
  'library.seatReservation.image.homeScreen':
    'Màn hình chính — bảng 좌석예약 với nút 배정신청',
  'library.seatReservation.image.buildingFloor':
    'Chọn tòa nhà, tầng và khu với mức sử dụng chỗ ngồi thời gian thực',

  'library.libraryCard.title': 'Thẻ thư viện / 이용증',
  'library.libraryCard.step1': 'Mở ứng dụng và đăng nhập qua 메뉴 (Menu) → LOGIN ở trên.',
  'library.libraryCard.step2':
    'Chạm 이용증 trên thanh điều hướng dưới — thanh dưới ghi MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴, là tab trực tiếp, không nằm trong menu con.',
  'library.libraryCard.step3':
    'Màn hình 이용증 hiển thị mã QR — đây là thẻ thư viện di động của bạn. Quét tại cổng vào thư viện để vào.',
}

export default messages
