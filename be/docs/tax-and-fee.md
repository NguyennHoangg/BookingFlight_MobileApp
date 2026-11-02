# Thuế và phí theo hãng hàng không

`GET /api/v1/airlines/:airlineId/tax-and-fee`

Truyền `Airline.id` (không phải mã sân bay hoặc mã IATA của hãng). Endpoint công khai,
chỉ đọc cấu hình trong `TaxAndFee` của hãng có `isActive = true`.
Route `/airports/:airportId/tax-and-fee` được thay bằng route theo hãng vì schema
không có quan hệ thuế/phí với sân bay.

Ví dụ phản hồi 200 (các giá trị chỉ để minh họa):

```json
{
  "status": 200,
  "message": "Thành công",
  "data": {
    "id": "config-id",
    "airline_id": "airline-id",
    "admin_fee": 50000,
    "airport_fee": 100000,
    "security_fee": 20000,
    "fuel_surcharge": null,
    "vat_percent": 8,
    "currency": "VND"
  }
}
```

Các trường phí và VAT trả dạng số; `null` nghĩa là chưa cấu hình, khác với `0`.
API cung cấp cấu hình, chưa tính tổng tiền theo hành khách hoặc giá vé.
Không tự gán thuế suất hoặc thêm dữ liệu phí mẫu vào database.

- 400: ID rỗng hoặc không hợp lệ.
- 404: Không có cấu hình hoặc hãng không tồn tại/không hoạt động.
- 409: Có nhiều cấu hình cho cùng hãng; schema hiện cho phép nhiều bản ghi nhưng chưa có quy tắc chọn phiên bản.
- 500: Lỗi database hoặc giá trị phí âm/vượt giới hạn số nguyên an toàn của JavaScript.

Frontend có thể gọi `getTaxAndFee(airlineId)` từ `src/api/airport.api.ts`.

Frontend đã tích hợp từ bước nhập hành khách, chọn ghế, dịch vụ đến xác nhận.
API chuyến bay trả thêm `airline.id` để tra cứu cấu hình đúng hãng; mỗi hãng
chỉ được tải một lần trên mỗi màn dù có nhiều chặng.

Công thức tạm tính đã chọn: mỗi khách/mỗi chặng = `admin_fee + airport_fee +
security_fee + fuel_surcharge + round(ticket.price * vat_percent / 100)`.
Nhân số khách sau khi làm tròn VAT mỗi khách, áp dụng cả trẻ em/em bé.
Không tính VAT trên phụ phí ghế hoặc dịch vụ bổ sung.
Tổng booking = giá vé + thuế/phí + ghế + dịch vụ.

Frontend hiện hỗ trợ VND. Cần cấu hình đủ các khoản và VAT bằng số hợp lệ
(không thu phí thì đặt `0`, không để `null`). Khi thiếu cấu hình hoặc tải lỗi,
tổng tiền hiển thị `—`, có nút thử lại và chưa cho qua bước tiếp theo.

Kiểm tra backend: `npx.cmd tsc --noEmit` và `npx.cmd tsx --test tests/taxAndFee.test.ts`.
Kiểm thử API dùng database giả lập, không thay đổi dữ liệu thật.
