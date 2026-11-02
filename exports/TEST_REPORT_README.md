# SkyJourney test report v2

File sử dụng: [SkyJourney_Test_Report_2026-11-01_v2.xlsx](SkyJourney_Test_Report_2026-11-01_v2.xlsx).

130 test case, 16 sheet, 106 case trong phạm vi mặc định và 24 case chờ triển khai hoặc chốt điều kiện đo. File v1 được giữ nguyên. Tất cả case bắt đầu ở `Not Run`; chưa có kết quả kiểm thử ứng dụng được ghi nhận.

Các sheet:

1. **Tổng hợp**: thông tin cycle, số case theo trạng thái, tỷ lệ thực thi, pass rate, lỗi mở và khuyến nghị QA.
2. **Kiểm soát tài liệu**: phiên bản và baseline.
3. **Phạm vi yêu cầu**: mã yêu cầu nội bộ, mức sẵn sàng, nguồn mã và giới hạn.
4. **Chiến lược**: mục tiêu, cấp độ, kỹ thuật, entry/exit criteria đề xuất, điều kiện dừng/tiếp tục.
5. **Môi trường**: build FE/BE, thiết bị, OS, API, dataset, Redis, mạng và công cụ.
6. **Dữ liệu test**: fixture tài khoản, hành trình, chuyến bay, ghế, tuổi hành khách và lỗi mạng.
7. **Test cases**: điều kiện, dữ liệu, bước, expected/actual, kết quả mới nhất, evidence, bug và execution ID.
8. **Traceability**: liên kết yêu cầu với test case và tổng hợp kết quả theo yêu cầu.
9. **Execution log**: lịch sử từng lần chạy; không xóa lần Fail khi retest thành công.
10. **Bug log**: bước tái hiện, severity/priority, môi trường, bằng chứng, người xử lý, build sửa và kết quả retest.
11. **Retest regression**: xác nhận sửa lỗi và phạm vi hồi quy.
12. **Bằng chứng**: quản lý ảnh, video, response và log đã che dữ liệu nhạy cảm.
13. **Đo hiệu năng**: 5 lần đo, median, ngưỡng được duyệt, số request và bằng chứng.
14. **Rủi ro**: gap, ảnh hưởng, cách xử lý, owner và quyết định chấp nhận.
15. **Phê duyệt**: QA, development, PO và release owner.
16. **Hướng dẫn**: trạng thái, vòng đời lỗi, cách tính KPI và quy tắc thực thi.

Trước khi chạy, hoàn tất môi trường và dữ liệu test, chốt scope và duyệt tiêu chí. Mỗi lượt chạy ghi vào Execution log, sau đó cập nhật kết quả mới nhất vào Test cases. Ghi dữ liệu thực tế thay cho fixture đề xuất. Một case có nhiều biến thể chỉ Pass khi tất cả biến thể đều đạt.

Mở bằng Excel hoặc LibreOffice có tính toán công thức để cập nhật KPI. Công thức không có cached result sẵn; trình xem chỉ đọc có thể hiển thị ô công thức trống trước lần tính đầu tiên. Báo cáo không tự quyết định sẵn sàng phát hành. Nếu kiểm tra nhiều ENV độc lập, sao chép workbook để tránh ghi đè kết quả giữa Android/iOS.

Sinh lại bằng Python, không cần cài thư viện:

```powershell
python exports/create_test_report.py
```

Lệnh sinh lại sẽ ghi đè **file v2**. Sao lưu bản đã có kết quả trước khi chạy lại. Script kiểm tra cấu trúc ZIP/XML, ID duy nhất, truy vết yêu cầu, độ rộng dữ liệu, số công thức và dropdown; chưa kiểm tra hiển thị bằng Excel hoặc thực thi công thức bằng Excel/LibreOffice.

Nguồn thiết kế: README, routes, validators, middleware, tiện ích frontend và các test có sẵn trong repository. REQ ID và tiêu chí ứng viên được tạo để truy vết trong báo cáo, cần người phụ trách duyệt; không được coi là tài liệu yêu cầu đã ký.
