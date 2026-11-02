from pathlib import Path
template = Path(__file__).with_name('create_schedule.py').read_text(encoding='utf-8')
helpers = {'__file__': str(Path(__file__).with_name('create_schedule.py'))}
exec(compile(template.split("with ZipFile(OUT,'w',ZIP_DEFLATED) as z:")[0], 'schedule_helpers', 'exec'), helpers)
sheet_xml, styles, NS = (helpers[key] for key in ('sheet_xml','styles','NS'))

# No execution results are recorded: the user will perform manual testing.
cases = [
('UI-01','Khởi động','Cao','Hiện có','App đã đóng hoàn toàn.','Mở app; quan sát màn khởi động.','Chỉ có SkyJourney và slogan “Chạm bầu trời. Mở hành trình.” trên nền trắng; không có máy bay.'),
('UI-02','Home / điểm đến','Cao','Hiện có','Backend chạy và có điểm đến phổ biến.','Mở Home; cuộn đến Điểm đến thịnh hành.','Hiển thị card có tên, mô tả và ảnh tương ứng dữ liệu API.'),
('UI-03','Cuộn ngang','Cao','Hiện có','Có ít nhất 3 điểm đến.','Vuốt danh sách sang trái/phải; sau đó cuộn trang lên/xuống.','Card nằm trên một hàng; xem được card tiếp theo; trang vẫn cuộn dọc; không báo lỗi VirtualizedLists lồng cùng hướng.'),
('UI-04','Lỗi tải điểm đến','Cao','Hiện có','Cold start hoặc reload để không có dữ liệu cũ; ngắt API điểm đến.','Mở Home; chờ request kết thúc.','Có thông báo không tải được điểm đến; không crash; các phần khác của Home vẫn dùng được.'),
('UI-05','Điểm đến trống','Vừa','Hiện có','Mock API điểm đến trả success=true và data=[].','Mở Home; chờ tải xong.','Hiển thị “Chưa có điểm đến nổi bật.”; không còn thông báo đang tải.'),
('AUTH-01','Đăng nhập đúng','Cao','Hiện có','Tài khoản hợp lệ; đang đăng xuất.','Nhập tài khoản/mật khẩu đúng; bấm Đăng nhập.','Có trạng thái chờ; đăng nhập thành công; màn Login được đóng theo điều hướng; hồ sơ đúng tài khoản.'),
('AUTH-02','Đăng nhập sai','Cao','Hiện có','Đang đăng xuất.','Nhập tài khoản hợp lệ với mật khẩu sai; bấm Đăng nhập.','Hiện thông báo thất bại; không cấp quyền vào màn yêu cầu đăng nhập; có thể nhập lại.'),
('AUTH-03','Khôi phục phiên','Cao','Hiện có','Đã đăng nhập và có phiên còn hiệu lực.','Đóng hoàn toàn rồi mở lại app; vào hồ sơ.','Khôi phục thông tin tài khoản; không yêu cầu đăng nhập lại; không hiển thị nhầm tài khoản.'),
('AUTH-04','Đăng xuất','Cao','Hiện có','Đã đăng nhập.','Đăng xuất; thử mở màn yêu cầu đăng nhập; mở lại app.','Không còn quyền vào màn bảo vệ; mở lại vẫn ở trạng thái đăng xuất.'),
('AUTH-05','Đổi tài khoản','Cao','Hiện có','Có tài khoản A và B với hồ sơ khác nhau.','Đăng nhập A; xem hồ sơ; logout; đăng nhập B; xem lại.','Hồ sơ hiển thị B; không còn thông tin cá nhân của A.'),
('SRCH-01','Tìm một chiều','Cao','Hiện có','Có chuyến phù hợp trong database.','Chọn một chiều; điểm đi/đến; ngày; số khách; tìm chuyến.','Kết quả đúng tuyến/ngày; số khách và hạng ghế được truyền đúng.'),
('SRCH-02','Tìm khứ hồi','Cao','Hiện có','Có dữ liệu chặng đi và về.','Chọn khứ hồi; nhập ngày đi/về hợp lệ; tìm chuyến.','Kết quả và hành trình phân biệt đúng chặng đi/về; giữ đúng ngày đã chọn.'),
('SRCH-03','Ngày và tuyến không hợp lệ','Cao','Hiện có','Đang ở form Home.','Thử chọn cùng sân bay; thử đặt ngày về trước ngày đi; bấm tìm.','Ngăn tìm tuyến trùng; không cho gửi hành trình có ngày về trước ngày đi (có thể tự điều chỉnh ngày).'),
('SRCH-04','Không có chuyến','Vừa','Hiện có','Chọn ngày/tuyến được xác nhận không có chuyến.','Tìm chuyến; chờ hoàn tất.','Hiển thị trạng thái không có kết quả; không loading vô hạn hoặc hiện kết quả lần trước.'),
('BOOK-01','Gói vé','Cao','Hiện có','Có chuyến với các gói vé.','Mở chuyến; chọn gói; xem giá, hành lý và điều kiện; tiếp tục.','Dữ liệu gói khớp API; gói đã chọn được giữ ở bước hành khách.'),
('BOOK-02','Thông tin hành khách','Cao','Hiện có','Đã chọn chuyến và gói.','Để trống trường bắt buộc; nhập dữ liệu không hợp lệ; sau đó nhập đúng.','Chặn dữ liệu sai với thông báo; dữ liệu đúng cho phép sang chọn ghế.'),
('BOOK-03','Chọn ghế','Cao','Hiện có','Có sơ đồ ghế với ghế trống và ghế đã đặt.','Thử chọn ghế đã đặt; chọn ghế trống cho từng khách/chặng; đổi lựa chọn.','Không chọn được ghế đã đặt; không gán cùng ghế cho hai khách cùng chặng; phí ghế hiển thị đúng.'),
('BOOK-04','Phạm vi đặt chỗ hiện tại','Cao','Hiện có','Đang ở bước xem lại lựa chọn ghế.','Quan sát thông báo và hành vi tiếp tục.','Nêu rõ chọn ghế chưa tạo booking/giữ ghế/thanh toán; không báo đặt vé thành công khi chưa có nghiệp vụ.'),
('FAV-01','Lưu/bỏ lưu tại chi tiết','Cao','Hiện có','Đăng nhập; có chuyến bay.','Lưu yêu thích; rời màn; mở lại; bỏ lưu; mở lại lần nữa.','Trạng thái khớp dữ liệu server sau mỗi thao tác; không tạo bản ghi lặp.'),
('FAV-02','Danh sách yêu thích thật','Cao','Sau triển khai','API danh sách và tab dữ liệu thật đã hoàn thành; A có yêu thích.','Đăng nhập A; mở tab Yêu thích.','Danh sách khớp dữ liệu của A trên backend; không còn dữ liệu mẫu.'),
('FAV-03','Đồng bộ giữa các màn','Cao','Sau triển khai','Đã kết nối tab Yêu thích.','Lưu tại chi tiết; mở tab; bỏ lưu trong tab; quay lại chi tiết.','Cả hai màn cập nhật đúng sau thao tác; không cần khởi động lại app.'),
('FAV-04','Cách ly tài khoản','Cao','Sau triển khai','A và B có danh sách khác nhau; cache Yêu thích đã triển khai.','Mở Yêu thích bằng A; logout; đăng nhập B; mở tab.','Không xuất hiện danh sách A trong phiên B, kể cả khi đang chờ request.'),
('CACHE-01','Chống request trùng','Cao','Sau triển khai','RTK Query đã triển khai; mở Network Inspector; cache rỗng.','Mở Home; tạo nhiều nơi đọc cùng query nếu có; đếm request.','Mỗi endpoint và bộ tham số chỉ có một request đang thực hiện; dữ liệu được chia sẻ.'),
('CACHE-02','Quay lại Home','Cao','Sau triển khai','Sân bay/điểm đến đã tải; chưa vượt ngưỡng làm mới.','Chuyển tab rồi quay lại Home nhiều lần; kiểm tra request.','Dữ liệu có sẵn ngay; không có request thừa khi chính sách còn mới cho phép dùng cache.'),
('CACHE-03','Làm mới dữ liệu cũ','Cao','Sau triển khai','Rút ngắn ngưỡng stale trên môi trường test; có thể đổi fixture API.','Tải dữ liệu; đợi vượt ngưỡng; đổi dữ liệu API; vào lại màn theo chính sách refetch.','Có request mới và dữ liệu mới; không nhầm thời gian giữ cache với thời gian dữ liệu còn mới.'),
('CACHE-04','Thử lại sau lỗi','Cao','Sau triển khai','Đã có nút/thao tác thử lại; mô phỏng API lỗi.','Tải để nhận lỗi; phục hồi API; chọn thử lại.','Tải thành công và xóa trạng thái lỗi; không tạo vòng lặp request.'),
('CACHE-05','Redis miss và hit','Cao','Sau triển khai','Redis bật; chỉ xóa key test tương ứng; có log hit/miss hoặc bộ đếm DB.','Gọi GET airports/destinations hai lần liên tiếp.','Lần đầu miss và lấy DB; lần sau hit; payload tương đương; không truy vấn DB lần hai.'),
('CACHE-06','Redis TTL','Cao','Sau triển khai','TTL ngắn trên môi trường test; có log hit/miss.','Gọi API; kiểm tra TTL; chờ hết hạn; gọi lại.','Key có TTL đúng; hết hạn thì đọc DB và tạo lại cache.'),
('CACHE-07','Redis mất kết nối','Cao','Sau triển khai','Cache backend đã triển khai; có thể dừng Redis test.','Dừng Redis; gọi API; bật Redis lại; gọi lại.','API vẫn trả dữ liệu từ DB trong timeout hợp lý; kết nối/cache phục hồi; không crash tiến trình.'),
('CACHE-08','Không cache lỗi','Cao','Sau triển khai','Redis hoạt động; có thể giả lập lỗi DB cho key test chưa có cache.','Cho DB lỗi; gọi API; phục hồi DB; gọi lại.','Lỗi không bị lưu làm dữ liệu hợp lệ; request sau phục hồi trả dữ liệu đúng.'),
('CACHE-09','Xóa cache danh mục','Vừa','Sau triển khai','Đã thống nhất cơ chế invalidation khi sửa danh mục.','Tải danh mục; sửa bản ghi test qua luồng được hỗ trợ; làm mới theo chính sách.','Cache liên quan bị xóa/làm mới; người dùng nhận danh mục cập nhật theo thời hạn đã chốt.'),
('PERF-01','Thời gian khởi động','Cao','Đo trước và sau','Cùng thiết bị, bản release, điều kiện phiên/mạng; chốt ngưỡng sau baseline.','Cold start 5 lần trước/sau tối ưu; đo từ mở app đến Home có thể thao tác.','Ghi từng lần và trung vị; so với ngưỡng đã chốt; không làm hỏng khôi phục phiên.'),
('PERF-02','Tải Home và request','Cao','Đo trước và sau','Cùng thiết bị/mạng; phân biệt cache lạnh và cache ấm.','Đo 5 lần tải Home cho mỗi chế độ; ghi request và thời gian.','Có trung vị và số request; cache ấm giảm request thừa; đánh giá theo mục tiêu đã chốt.'),
('PERF-03','Ảnh và cuộn ngang','Vừa','Đo trước và sau','Bản release; đủ card; theo dõi tải ảnh và frame nếu công cụ hỗ trợ.','Vuốt qua lại 10 lần; rời Home rồi quay lại; thử mạng chậm và ảnh lỗi.','Không giật kéo dài, không trắng card do kích thước sai; có fallback ảnh; ghi số đo/quan sát thực tế.'),
('PERF-04','Tìm kiếm và SQL','Vừa','Đo trước và sau','Cùng bộ điều kiện tìm kiếm; môi trường DB test ổn định.','Gọi API 5 lần; ghi thời gian; so truy vấn trước/sau bằng EXPLAIN ANALYZE trên DB test.','Có bảng thời gian và kế hoạch truy vấn; kết quả nghiệp vụ không thay đổi; không khẳng định nhanh hơn khi chưa đo.'),
('REG-01','Kiểm tra sau tích hợp','Cao','Sau triển khai','Đã tích hợp các thay đổi trong ngày.','Đi Home → tìm chuyến → gói vé → hành khách → ghế; quay lại; kiểm tra Yêu thích và logout.','Luồng trước đó còn hoạt động; không crash, lỗi điều hướng hoặc mất lựa chọn không mong muốn.'),
]
# Preserve the original workbook; detailed v2 is written to a separate file.
from test_report_details import build_report

if __name__ == '__main__':
    build_report(cases, sheet_xml, styles)
