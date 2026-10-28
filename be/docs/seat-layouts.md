# Sơ đồ ghế theo máy bay

`GET /api/v1/flights/:flightId/seat-map` trả `aircraft`, `columnGroups` và `seats`. Endpoint `/seats` vẫn trả mảng như trước. `columnGroups` giữ đúng lối đi và quy tắc bỏ chữ cột; ghế bị thiếu trong tồn chỗ không được tự biến thành ghế trống.

## Seed bổ sung riêng

Không chạy lại `npm run seed` để bổ sung ghế: seed tổng có thao tác xóa dữ liệu.

Tại thư mục `be`, xem số vị trí còn thiếu:

```sh
npm run seed:seat-layouts
```

Bổ sung các vị trí đó:

```sh
npm run seed:seat-layouts -- --apply
```

Seed riêng đọc `SeatTemplate` đang hoạt động, chỉ bổ sung ghế thiếu của chuyến đang mở và đã có tồn ghế. Một câu INSERT nguyên tử với `ON CONFLICT DO NOTHING` đảm bảo có thể chạy lại; không cập nhật hoặc xóa ghế đã có, vé, trạng thái đặt và khóa ghế. Seed không tự mở sơ đồ cho chuyến chưa có tồn ghế.

Các vị trí cũ nằm ngoài cấu hình máy bay vẫn được giữ trong database để bảo toàn tham chiếu vé. Chúng không hiển thị hoặc được chấp nhận như một lựa chọn mới trên sơ đồ.

Lựa chọn trên màn hình được lưu trong phiên đặt vé. Khi nhấn tiếp tục, API được đọc lại để loại ghế không còn trống và cập nhật phụ phí. Bước này chưa tạo khóa ghế hay thanh toán.
