# Check-in online trong ứng dụng

Luồng đã nối database và FE: tra cứu → chọn vé theo chặng → xác nhận thông tin →
lưu `Ticket.isCheckedIn/status/boardingTime/qrCodeData` → xem xác nhận và QR.
Không cần thay schema hoặc chạy migration. Không tự tạo booking/vé mẫu trong database.

Đây là trạng thái check-in của ứng dụng, chưa tích hợp hệ thống hãng/DCS.
QR là mã tham chiếu ngẫu nhiên lưu trên vé, không phải mã IATA BCBP hoặc thẻ do hãng phát hành.
FE nói rõ giới hạn này; không giả gửi email, không báo đã tải file khi chưa tải.
Có chia sẻ nội dung xác nhận; trên web thiếu Web Share thì hiện thông tin để xem/copy.

## API

Hai endpoint công khai, dùng PNR/số vé + họ như thông tin tra cứu; không đưa lên URL.
Header `Cache-Control: no-store`. Cùng quota 30 request/10 phút/IP/instance, vượt trả 429
và `Retry-After`. Khi triển khai nhiều instance cần thay limiter bằng shared store/gateway;
cấu hình proxy phải phản ánh đúng kiến trúc triển khai, không tự bật trust proxy toàn cục.

`POST /api/v1/checkin/lookup`

```json
{ "bookingCode": "ABC123", "lastName": "Nguyễn" }
```

PNR gồm 6 ký tự chữ/số. Có thể dùng số vé 13 chữ số, có hoặc không có dấu `-` sau
3 chữ số đầu. Họ được chuẩn hóa hoa, bỏ dấu tiếng Việt/Đ, khoảng trắng thừa.
Schema lưu tên đầy đủ theo thứ tự họ trước: họ tra cứu phải khớp phần đầu tên theo ranh giới từ.
Sai họ và mã không tồn tại đều trả cùng 404, không tiết lộ thông tin đặt chỗ.

- PNR + họ của một vé còn hoạt động cho phép xem/chọn cả đoàn trong PNR.
- Số vé + họ chỉ cho phép xem/check-in chính vé đó, không mở rộng sang các vé cùng PNR.
- Không trả ngày sinh, giấy tờ, email/điện thoại hoặc userId.
- Lookup chỉ đọc; không tự check-in. QR chỉ trả khi trạng thái hợp lệ đã CHECKED_IN.

`POST /api/v1/checkin/confirm`

```json
{
  "bookingCode": "ABC123",
  "lastName": "NGUYEN",
  "ticketIds": ["ticket-id"],
  "acceptedConditions": true
}
```

Tối đa 18 vé khác nhau. Backend xác thực lại thông tin tra cứu và toàn bộ ID được chọn.
Trong một transaction: khóa booking rồi vé/chuyến/ghế và dữ liệu liên quan; lấy giờ DB;
kiểm tra mọi vé trước khi ghi; cập nhật trạng thái và QR; commit. Vé sai điều kiện hoặc lỗi
bất kỳ làm rollback toàn bộ danh sách. Có lock/statement timeout; xung đột trả 409 để thử lại.
Gửi lại vé đã check-in còn hợp lệ trả cùng QR/boardingTime, không tạo dữ liệu mới.

Response cả hai endpoint có dạng `{ "status": "success", "data": { "pnrCode", "serverTime", "tickets": [...] } }`.
Mỗi ticket gồm id, số vé, tên/loại khách, fareClassName, seat, flight, eligibility và boardingPass.
`eligibility` gồm state/reason/opensAt/closesAt. `boardingPass` là null trước check-in;
khi hợp lệ đã check-in có qrCodeData và boardingTime.

## Chính sách đang thực thi

Đây là quy tắc sản phẩm của ứng dụng, chưa phải cấu hình riêng theo từng hãng:

- Booking phải CONFIRMED; ticket, flight, airline, aircraft, fare, airports còn active.
- Flight SCHEDULED hoặc DELAYED, dùng departureTime hiện có trong database.
- Ghế còn active, đã booked cho vé, đúng chuyến và khoang gói vé; check-in không đổi ghế.
- Chuyến nội địa VN; country hỗ trợ `Việt Nam`, `Viet Nam`, `Vietnam`, `VN` sau chuẩn hóa.
- Mở đúng T−24h (bao gồm), đóng đúng T−60m (không bao gồm). Giờ backend/DB quyết định,
  không tin đồng hồ thiết bị. Thời gian FE hiển thị theo Asia/Ho_Chi_Minh.
- Đoàn cùng chặng có vé infant cần ra quầy; trẻ em tại EXIT_ROW cần hỗ trợ tại quầy.
- Vé CANCELLED/REFUNDED/BOARDED/COMPLETED hoặc dữ liệu trạng thái không đồng nhất không được check-in.
- Vé đã check-in hợp lệ vẫn xem được QR sau mốc đóng online đến trước giờ bay;
  chuyến hủy/đã khởi hành hoặc booking không còn confirmed thì không trả QR.
- boardingTime giữ giá trị hiện có, nếu chưa có đặt dự kiến T−40m. Không khẳng định đây
  là thời gian lên máy bay do hãng xác nhận.

Mã trạng thái eligibility: OPEN, NOT_OPEN, CLOSED, CHECKED_IN, AIRPORT_REQUIRED, UNAVAILABLE.
Lỗi API: 400 input/consent, 404 mã/họ/ID ngoài phạm vi, 409 điều kiện thay đổi/xung đột,
429 giới hạn tra cứu, 500 lỗi hệ thống.

## Frontend

- `src/screens/checkin/CheckinScreen.tsx`: tra cứu, nhóm theo chặng, chọn vé, sheet đồng ý/xác nhận.
- `src/hook/useCheckin.ts`: state trong RAM, chặn double submit, hủy response sau unmount,
  refresh/xóa tra cứu; lỗi mạng khi confirm hướng dẫn tra cứu lại vì DB có thể đã commit.
- `src/api/checkin.api.ts`: POST và kiểm tra cấu trúc response.
- `src/utils/checkin.ts`: chuẩn hóa form, nhóm chặng, nội dung chia sẻ.
- `src/components/checkin/CheckinPassCard.tsx`: QR từ backend bằng react-native-qrcode-svg,
  tên, vé, chặng, ghế, gate/terminal và chia sẻ thông tin qua native/web.
- Route tab hiện có `src/app/(tabs)/Checkin.tsx` giữ nguyên.

Không dùng MyTickets/TicketDetail mock làm nguồn check-in; cần booking/ticket thật còn hoạt động.
Các mã ví dụ trong tài liệu không cam kết tồn tại. Vé seed có thể nằm ngoài khung check-in,
FE sẽ hiển thị đúng NOT_OPEN/CLOSED thay vì giả thành công.
