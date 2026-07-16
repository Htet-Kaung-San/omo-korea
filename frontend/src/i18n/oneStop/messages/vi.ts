import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'Hướng dẫn từng bước cho onestop.pusan.ac.kr',
  'oneStop.steps': 'Các bước',
  'oneStop.relatedPages': 'Trang liên quan',
  'oneStop.note': 'Lưu ý',

  'oneStop.registration.title': 'Đăng ký học phần (수강신청)',
  'oneStop.registration.step1':
    'Đăng nhập tại [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) bằng mã số sinh viên và mật khẩu.',
  'oneStop.registration.step2':
    'Vào 수업 (Classes) → 수강신청및확인 (Registration & Confirmation).',
  'oneStop.registration.step3':
    'Kiểm tra danh mục học phần trước: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — tìm theo khoa, xem các lớp mở, kiểm tra giới hạn chỗ.',
  'oneStop.registration.step4':
    'Trong thời gian đăng ký, việc nộp thực tế diễn ra trên hệ thống đăng ký riêng: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (web PC hoặc di động). Đây là trang khác với One-Stop — đừng nhầm lẫn nếu bạn bị chuyển hướng đến đây.',
  'oneStop.registration.step5':
    'Sau khi nộp, quay lại One-Stop → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) để xác nhận học phần đã được đăng ký thực sự — làm mỗi lần, vì "wishlist" (희망과목담기) không bằng đăng ký đã xác nhận.',
  'oneStop.registration.related.addDrop': 'Thêm/Bỏ học phần (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'Hủy học phần (수강취소)',
  'oneStop.registration.related.timetable': 'Xem thời khóa biểu (시간표조회)',
  'oneStop.registration.note':
    'Đăng ký chỉ mở trong các khung thời gian cụ thể theo lịch học (thường liệt kê trên trang chủ One-Stop). Kiểm tra ngày trước — hệ thống chỉ dùng được trong các khung này.',

  'oneStop.cancellation.title': 'Hủy học phần / Rút học (수강취소)',
  'oneStop.cancellation.step1':
    'Đăng nhập tại [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.cancellation.step2':
    'Vào 수업 (Classes) → 수강취소 (Course Cancellation): [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'Chọn học phần muốn hủy và xác nhận.',
  'oneStop.cancellation.step4':
    'Sau đó, kiểm tra lại [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) để xác nhận học phần không còn trong lịch học đang hoạt động.',
  'oneStop.cancellation.note':
    'Khác với 수강정정 (add/drop), diễn ra đầu học kỳ và không để lại hồ sơ. 수강취소 mở sau giữa học kỳ (thường là cửa sổ ngắn sau giữa kỳ) và để lại dấu W (Withdrawal) trên bảng điểm thay vì xóa hoàn toàn học phần. Ngày chính xác được đặt mỗi học kỳ trên lịch học.',

  'oneStop.grades.title': 'Xem điểm (성적확인)',
  'oneStop.grades.step1':
    'Đăng nhập tại [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.grades.step2': 'Vào 수업 (Classes) → mục điểm.',
  'oneStop.grades.step3':
    'Học kỳ hiện tại: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'Toàn bộ hồ sơ học tập: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'Điểm học kỳ hiện tại thường chỉ hiển thị sau khi công bố điểm cuối kỳ kết thúc — nếu trống, điểm có thể chưa được công bố.',

  'oneStop.tuition.title': 'Học phí — Hóa đơn & Xác nhận thanh toán (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    'Đăng nhập tại [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.tuition.step2': 'Vào menu 등록 (Registration/Tuition).',
  'oneStop.tuition.step3': 'In/xem hóa đơn: 고지서출력 (Bill Print).',
  'oneStop.tuition.step4':
    'Ghi mã thanh toán trường trên hóa đơn (tùy ngân hàng — NH, Busan Bank, Hana, v.v.) và thanh toán qua chuyển khoản, ATM, ngân hàng trực tuyến/điện thoại hoặc tại quầy ngân hàng.',
  'oneStop.tuition.step5':
    'Xác nhận thanh toán thành công: 납부확인 (Payment Confirmation / Receipt Print) — kiểm tra sau khi thanh toán, vì thanh toán không phản ánh ngay lập tức.',
  'oneStop.tuition.note':
    'Không thể yêu cầu hóa đơn học phí qua điện thoại/email/fax thay bạn — bạn phải tự truy cập bằng tài khoản của mình.',

  'oneStop.leaveReturn.title': 'Xin nghỉ học / Quay lại học (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    'Đăng nhập tại [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.leaveReturn.step2':
    'Đăng ký nghỉ học: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'Đăng ký quay lại học: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'Cả hai đều có khung đăng ký cụ thể mỗi học kỳ (xem lịch học trên trang chủ One-Stop) — đăng ký ngoài khung có thể không được.',
}

export default messages
