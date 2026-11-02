# Luồng đặt vé

1. Chọn chuyến đi/về, gói vé rồi nhập hành khách và liên hệ.
2. Chọn ghế cho mọi người lớn/trẻ em trên mỗi chặng. Sau khi kiểm tra lại ghế, `startBooking` ghi bản nháp vào `state.booking.draft`.
3. Dịch vụ bổ sung tải danh mục từ `GET /bookings/services`, theo hãng của từng chặng. Lựa chọn lưu bằng ID dịch vụ cho từng khách/chặng. Chỉ chọn một gói hành lý mỗi khách/chặng; em bé không mua dịch vụ riêng. Có thể bỏ qua dịch vụ.
4. Màn xác nhận hiển thị hành trình, hành khách, ghế, dịch vụ, liên hệ và thuế/phí. Sửa hành khách khôi phục dữ liệu bản nháp vào form, sau đó kiểm tra lại ghế. Cùng hành trình giữ dịch vụ; đổi hành trình/cơ cấu khách xóa dịch vụ cũ.
5. **Tiếp tục thanh toán** mở màn `Payment`, bước 5/5 theo thiết kế. Màn này yêu cầu đăng nhập, gọi `POST /bookings/quote`, hiển thị tổng tiền/chi tiết và các lựa chọn thẻ, ví điện tử, QR ngân hàng, cửa hàng tiện lợi. Có thể đổi MoMo/ZaloPay/ShopeePay/Apple Pay. Tất cả đều là mô phỏng, không thu tiền hoặc yêu cầu thông tin thẻ.
6. Backend kiểm tra lại toàn bộ, tạo booking, vé, dịch vụ, thanh toán mô phỏng thành công, cập nhật ghế/quỹ vé trong cùng transaction. App mở `PaymentResult` thành công và xóa bản nháp. Nếu lỗi, màn kết quả thất bại giữ bản nháp và cùng mã yêu cầu để thử lại. Mất phản hồi POST sẽ được tra cứu theo request key trước khi kết luận chưa thành công.
7. **Vé của tôi** tải danh sách thật từ backend. Chi tiết đơn hiển thị PNR, vé/QR từng khách/chặng, ghế, dịch vụ, liên hệ và tiền. Có thể sao chép PNR, chia sẻ hành trình, xuất PDF, đến check-in với PNR/họ điền sẵn trong RAM, hoặc hủy đơn mô phỏng trước giờ bay khi chưa check-in. Hủy giải phóng ghế/quỹ vé và ẩn QR.

## Dữ liệu

- Chuyến đã chọn ở màn tìm kiếm: state cục bộ, rồi truyền qua tham số điều hướng.
- Thông tin hành khách/liên hệ: state form, sau khi xác nhận ghế chuyển vào Redux RAM. Không đưa dữ liệu cá nhân vào URL hoặc AsyncStorage.
- `state.booking.draft`: `params`, `fares`, `passengers`, `contact`, `seats`, `services`, `catalog`, `requestKey`, `paymentChoice`.
- `completed`, `paymentFailure`, `checkinPrefill` trong booking slice chỉ lưu trong RAM và được xóa khi đăng xuất. URL kết quả thành công chỉ chứa ID booking, không có dữ liệu hành khách.
- `requestKey` giữ nguyên khi thử lại lỗi mạng để tránh tạo trùng đơn; chỉnh sửa form/ghế/dịch vụ tạo key mới.
- Bản nháp mất khi tải lại app, đăng xuất hoặc tạo đơn thành công. Đơn đã tạo nằm trong database, tải lại được sau khi đăng nhập.
- Database lưu `Booking`, `Ticket`, `TicketAddon`, `Payment`, `Notification`; hủy có `RefundCancelRequest`. `Booking.details` lưu ảnh chụp hành trình và giá tại lúc đặt.

## Giá và thanh toán

Giá dịch vụ lấy từ danh mục backend. Server kiểm tra hãng, tính lại vé/ghế/dịch vụ/thuế và từ chối nếu tổng tiền thay đổi sau khi người dùng xác nhận. Thuế/VAT dùng cùng công thức với frontend. Quy tắc giá hiện tại tính giá gói và thuế cho mọi hành khách, chưa có giảm giá riêng cho em bé.

Thanh toán tự thành công trong chế độ `demo` ở môi trường phát triển, không thu tiền. UI ghi rõ giao dịch mô phỏng. Backend không cho dùng auto-success ở production. API tạo đơn hiện xác nhận ngay trong một transaction, chưa có giai đoạn chờ thanh toán/giữ chỗ hết hạn.

`Payment.tsx`, `PaymentResult.tsx`, `TicketDetail.tsx` triển khai các màn trong ảnh thiết kế. Thành phần dùng chung nằm ở `components/payment/PaymentUI.tsx`. `useSubmitPayment` quản lý tạo đơn/khôi phục phản hồi mất kết nối; `useBookingRecord` tải lại đơn và dùng kết quả vừa tạo để hiển thị ngay.

Thời gian 15 phút trên màn thanh toán là chu kỳ yêu cầu cập nhật báo giá của giao diện, không phải thời gian giữ ghế. Ghế vẫn được kiểm tra tại lúc tạo đơn. Hợp đồng backend và cấu hình nằm ở `be/docs/booking.md`.

## Kiểm tra

Trong `fe`: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test:navigation`.

Trong `be`: `npm.cmd run booking:migrate`, `npm.cmd run build`.

Cần kiểm tra thêm trên thiết bị thật về cuộn, sheet, bàn phím, in/chia sẻ PDF và chuyển màn. PDF dùng `expo-print`/`expo-sharing`; trên web mở hộp thoại in để lưu PDF. Chưa có gửi email hoặc thanh toán qua cổng thật.
