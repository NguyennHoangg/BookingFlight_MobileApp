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

Seed riêng đọc `SeatTemplate` đang hoạt động, bổ sung ghế thiếu của chuyến đang mở trong 30 ngày tới, kể cả chuyến chưa có ghế. Có thể thu hẹp bằng --days=7 hoặc --days=14, tối đa 30 ngày. Một câu INSERT nguyên tử với `ON CONFLICT DO NOTHING` đảm bảo có thể chạy lại; không cập nhật hoặc xóa ghế đã có, vé, trạng thái đặt và khóa ghế.

Script bổ sung ghế dừng nếu vượt 250.000 ghế/lần hoặc tổng dung lượng ước tính vượt 350 MB. Không tự kích hoạt ghế đã bị vô hiệu hóa và không có lịch chạy tự động. Ghế mẫu còn thiếu có thể được bổ sung bằng `npx tsx prisma/seed-seat-template.ts`, không xóa ghế mẫu cũ.

Sơ đồ sinh tự động là dữ liệu phát triển theo cấu hình trong database, không phải sơ đồ được hãng chứng nhận. Không giới hạn 45 hàng; hàng cuối có thể không đủ cột. Seed tổng tính quota theo số ghế mỗi khoang. Số bán hiện có được giữ lại vì seed trước đây tạo số bán mô phỏng; không suy ra giao dịch thanh toán từ trạng thái booking. Các bản sao quota trước lần sửa được giữ cục bộ tại `prisma/repair-backups/`, không đưa vào Git.

Các CHECK và index được quản lý tại `prisma/maintenance/integrity.sql` (Prisma schema không biểu diễn CHECK). Áp dụng file SQL này bằng SQL Editor sau khi tạo database mới; đây là bảo trì bổ sung, không phải lịch sử migration đã baseline.

Các vị trí cũ nằm ngoài cấu hình máy bay vẫn được giữ trong database để bảo toàn tham chiếu vé. Chúng không hiển thị hoặc được chấp nhận như một lựa chọn mới trên sơ đồ.

Lựa chọn trên màn hình được lưu trong phiên đặt vé. Khi nhấn tiếp tục, API được đọc lại để loại ghế không còn trống và cập nhật phụ phí. Bước này chưa tạo khóa ghế hay thanh toán.
