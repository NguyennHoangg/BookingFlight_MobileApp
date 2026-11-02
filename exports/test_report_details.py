"""Detailed manual QA workbook. Standard library only; never invent execution results."""
from collections import Counter
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
import xml.etree.ElementTree as ET

NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
ET.register_namespace('', NS)

# Candidate acceptance criteria are identified in the scope sheet, not claimed as approved requirements.
GROUPS = {
'REG': ('Đăng ký', 'be/src/middlewares/validate.middleware.ts', '''
Đăng ký hợp lệ|Email mới qa.new@example.test; mật khẩu QaTest@2026; họ tên Nguyễn Văn An; SĐT test chưa tồn tại|Mở Đăng ký; nhập đủ dữ liệu; gửi một lần; thử đăng nhập tài khoản mới|Tạo đúng một tài khoản; có thể đăng nhập; không trả hash mật khẩu
Email sai định dạng|abc; a@; a@b|Lần lượt thay email trong payload hợp lệ; gửi mỗi biến thể riêng|Từ chối từng biến thể; API 400; không tạo tài khoản
Mật khẩu thiếu độ mạnh|abcdefg; Abcdefgh; Abcdefg1; abcdef1!|Thử riêng từng mật khẩu thiếu độ dài/hoa/số/ký tự đặc biệt|API 400; thông báo quy tắc; không tạo tài khoản
Email đã tồn tại|Email của TD-USER-A|Đăng ký email đã dùng với thông tin còn lại hợp lệ|Từ chối trùng; không ghi đè hồ sơ A; ghi mã HTTP thực tế
SĐT không hợp lệ|0123; abc; chuỗi rỗng|Thay lần lượt SĐT; gửi đăng ký|API 400; không có tài khoản mới
Họ tên không hợp lệ|Tên rỗng; An123; <script>|Thử riêng từng tên; giữ các trường khác hợp lệ|API 400; không thực thi nội dung nhập
Gửi đăng ký liên tiếp|Một bộ thông tin mới duy nhất|Bấm đăng ký hai lần nhanh; kiểm tra kết quả và số tài khoản|Không tạo hai tài khoản cùng định danh; UI có phản hồi rõ
Trở về đăng nhập|Form đăng ký đang nhập dở|Quay lại Login; mở Register lần nữa|Điều hướng đúng; không tự đăng nhập khi chưa xác thực
'''),
'PROF': ('Hồ sơ và mật khẩu', 'be/src/routes/auth.route.ts; be/src/controllers/user.controller.ts', '''
Xem hồ sơ|TD-USER-A|Đăng nhập A; mở Hồ sơ; đối chiếu GET /auth/profile|Dữ liệu đúng A; không có password/hash/token trong hồ sơ
Cập nhật hồ sơ hợp lệ|Tên Nguyễn Văn Bình; SĐT test thuộc A|Sửa hồ sơ; lưu; đóng mở app; tải lại hồ sơ|Thông tin mới được lưu và hiển thị nhất quán
Hủy cập nhật|Hồ sơ A có giá trị gốc đã ghi nhận|Sửa tên; bấm quay lại/hủy; tải lại|Giá trị chưa lưu không ghi lên server
Đổi mật khẩu đúng|Mật khẩu hiện tại của A; mật khẩu mới QaNext@2026|Đổi mật khẩu; logout; đăng nhập bằng mật khẩu cũ và mới riêng biệt|Mật khẩu cũ thất bại; mật khẩu mới thành công; khôi phục fixture sau test
Đổi mật khẩu sai mật khẩu cũ|currentPassword sai; newPassword hợp lệ|Gửi PUT /auth/change-password; thử lại mật khẩu hiện tại|Từ chối thay đổi; mật khẩu hiện tại vẫn dùng được
Mật khẩu mới không đạt|newPassword=123|Gửi yêu cầu đổi bằng mật khẩu hiện tại đúng|Từ chối theo chính sách đã thống nhất; nếu chưa có validation ghi bug/gap
Hồ sơ không có token|Không gửi Authorization|Gọi riêng GET và PUT /auth/profile|HTTP 401; không đọc hoặc sửa dữ liệu
Danh bạ hành khách trống|A chưa có hành khách lưu|Mở chọn nhanh hành khách; kiểm tra GET /auth/passengers|Trạng thái trống rõ ràng; vẫn nhập tay được
Danh bạ đúng chủ sở hữu|A và B có danh bạ khác nhau|Đăng nhập A rồi B; mở danh bạ mỗi lần|Chỉ hiện hành khách của tài khoản hiện tại
'''),
'SRCHX': ('Tìm kiếm và lịch giá', 'be/src/validators/flight.validator.ts; fe/src/screens/search/SearchFlightResult.tsx', '''
Chuẩn hóa mã sân bay|departureCode=" sgn "; arrivalCode="han"|POST /flights/conditions với TD-SEARCH; thay hai mã như dữ liệu|Chuẩn hóa thành SGN/HAN; dữ liệu đúng tuyến
Mã sân bay sai|SG; SGNN; 123; rỗng|Gửi riêng từng biến thể mã đi trong TD-SEARCH|HTTP 400 trước truy vấn nghiệp vụ
Tuyến trùng nhau|SGN → SGN|Gửi tìm kiếm qua UI và API|UI ngăn hoặc API 400; không trả hành trình giả
Ngày không tồn tại|2027-02-29; 2026-04-31|Gửi riêng từng ngày trong TD-SEARCH|API 400; không tự chuyển sang tháng tiếp theo
Định dạng ngày sai|01/11/2026; timestamp; null|Gửi riêng từng định dạng|API 400; yêu cầu YYYY-MM-DD
Biên số khách hợp lệ|passengers=1 và 18|Gửi từng giá trị với chuyến có đủ chỗ|Chấp nhận validation; kết quả còn phụ thuộc tồn kho fixture
Biên số khách không hợp lệ|0; 19; -1; 1.5; "2"|Gửi từng biến thể|API 400 cho từng giá trị
Hạng ghế không hỗ trợ|seatClass="First"; null|Gửi riêng từng giá trị|API 400; không tự chọn hạng khác
Body không phải object|null; []; chuỗi|POST /flights/conditions với mỗi body|API 400; không lộ stack hoặc crash
Lịch giá đúng 31 ngày|startDate=2026-11-01; endDate=2026-12-01|POST /flights/calendar với TD-SEARCH và khoảng ngày|Khoảng gồm 31 ngày được chấp nhận; giá khớp fixture
Lịch giá quá giới hạn|startDate=2026-11-01; endDate=2026-12-02|Gọi lịch giá|API 400 vì khoảng lớn hơn 31 ngày
Lịch giá đảo ngày|startDate=2026-11-02; endDate=2026-11-01|Gọi lịch giá|API 400; không truy vấn khoảng đảo
Đổi điều kiện tìm kiếm|Lần 1 SGN-HAN; lần 2 HAN-SGN|Tìm lần 1; đổi tuyến; tìm lần 2; cho response lần 1 về chậm|Chỉ hiển thị kết quả phù hợp điều kiện hiện tại
Bộ lọc kết quả|Fixture nhiều hãng/giờ/giá|Áp từng bộ lọc được UI hỗ trợ; xóa bộ lọc|Kết quả đáp ứng bộ lọc; xóa khôi phục tập kết quả; ghi bộ lọc thực tế
Lỗi API tìm kiếm|Mock 500 hoặc timeout|Gửi tìm kiếm; chờ lỗi; phục hồi API; tìm lại|Dừng loading; có thông báo; không dùng dữ liệu mẫu thay lỗi; thao tác lại được
Đổi ngày khứ hồi|Ngày đi D; ngày về D+2|Chọn đi/về; thay ngày đi sau ngày về; tìm kiếm|Không gửi cặp ngày đảo; giải thích hoặc điều chỉnh rõ trên UI
'''),
'FARE': ('Gói vé', 'fe/src/utils/fare.ts; be/src/validators/flight.validator.ts', '''
UUID chuyến sai|flightId=not-a-uuid|GET /flights/not-a-uuid/fares|API 400; không phát sinh lỗi ép kiểu PostgreSQL
Số khách mặc định|UUID fixture có gói vé; bỏ query passengers|GET /flights/{id}/fares|Dùng 1 hành khách; gói và giá đúng fixture
Không đủ tồn kho|Gói còn 1 chỗ; passengers=2|Mở gói vé cho 2 khách; thử chọn gói thiếu chỗ|Không cho tiếp tục bằng gói không đủ chỗ
Tải mới tồn kho|Gói đã chọn còn đủ rồi fixture chuyển thành hết chỗ|Quay lại hoặc refetch gói vé sau thay đổi tồn kho|Lựa chọn không hợp lệ bị bỏ; yêu cầu chọn lại; không giữ giá cũ âm thầm
Khứ hồi thiếu gói về|Có gói đi; chưa chọn gói về|Chọn chỉ gói đi; bấm tiếp tục|Chặn đi tiếp; không hiển thị tổng giá hoàn chỉnh khi thiếu chặng
Tổng giá khứ hồi|Gói đi A; gói về B; N khách theo fixture|Chọn đủ hai gói; đối chiếu số tiền và số khách|Tổng theo công thức giá đã duyệt; tách rõ phí ghế; ghi bảng tính đối chứng
API gói vé lỗi|Mock 500|Mở FareSelection; thử tiếp tục sau lỗi|Báo lỗi; không cho dùng gói mẫu hoặc lựa chọn chưa xác thực
'''),
'PAX': ('Hành khách và liên hệ', 'fe/src/utils/passengerForm.ts', '''
Đúng số form|2 adult; 1 child; 1 infant|Tìm hành trình với cơ cấu trên; mở hành khách|Có đúng 4 form với đúng loại; không tự thêm khách mẫu
Họ và tên bắt buộc|Họ rỗng hoặc tên đệm/tên rỗng|Thử riêng mỗi trường rỗng rồi bấm tiếp tục|Lỗi đúng trường; không đi tiếp
Tên tiếng Việt hợp lệ|Nguyễn; Thị Ánh|Nhập tên có dấu và các trường còn lại hợp lệ|Chấp nhận; tên đầy đủ ghép đúng; không mất dấu
Tên chứa số hoặc markup|An123; <b>An</b>|Nhập riêng từng tên và tiếp tục|Từ chối; không thực thi nội dung nhập
Giới tính chưa chọn|gender rỗng|Điền hợp lệ các trường khác; tiếp tục|Lỗi giới tính; không đi tiếp
Quốc tịch chưa xác định|nationality rỗng hoặc OTHER|Thử riêng hai giá trị; tiếp tục|Yêu cầu chọn quốc tịch cụ thể
Giấy tờ người lớn thiếu|identity rỗng; 5 ký tự; 6 ký tự|Thử lần lượt với adult hợp lệ|Dưới 6 ký tự bị chặn; từ 6 vượt validation độ dài; chưa thay thế xác minh giấy tờ
Ngày sinh sai|31/02/2020; 1/1/2000; ngày sau ngày bay|Thử từng giá trị; tiếp tục|Lỗi ngày sinh; không tự sửa thành ngày khác
Biên trẻ sơ sinh 2 tuổi|Ngày bay 01/11/2026; sinh 02/11/2024 và 01/11/2024|Chọn infant; thử từng ngày sinh|Chưa đủ 2 tuổi hợp lệ; đúng 2 tuổi bị từ chối loại infant
Biên trẻ em 12 tuổi|Ngày bay 01/11/2026; sinh 02/11/2014 và 01/11/2014|Chọn child; thử từng ngày|Chưa đủ 12 tuổi hợp lệ; đúng 12 tuổi yêu cầu adult
Người lớn đúng 12 tuổi|Ngày bay 01/11/2026; sinh 01/11/2014|Chọn adult; nhập đủ thông tin|Chấp nhận theo tuổi tại ngày bay
Email liên hệ sai|a@; abc; rỗng|Thử riêng mỗi email trong form đầy đủ|Lỗi email; không đi tiếp
Điện thoại liên hệ biên|6; 7; 15; 16 chữ số|Thử mỗi độ dài; giữ các trường khác hợp lệ|Chấp nhận 7-15 chữ số theo validator; từ chối 6 và 16
Chọn hành khách đã lưu|TD-USER-A có danh bạ|Chọn một người; kiểm tra họ tên; sửa thông tin vừa điền|Điền đúng form được chọn; sửa được; không đổi form khách khác
Quay lại từ chọn ghế|Form đã điền hợp lệ|Sang chọn ghế; quay lại|Giữ dữ liệu trong hành trình; không phát sinh khách thừa
'''),
'SEAT': ('Sơ đồ và lựa chọn ghế', 'fe/src/utils/seatMap.ts; be/src/utils/seatTemplates.ts', '''
Thứ tự hàng số|Fixture hàng 1; 2; 10; 46|Mở sơ đồ và cuộn cuối|Thứ tự số đúng; hiển thị hàng lớn hơn 45 nếu tàu bay có
Hai lối đi và ô khuyết|Fixture tàu bay hai lối đi và hàng cuối thiếu ghế|Đối chiếu sơ đồ với geometry API|Đúng cột/lối đi; không tự tạo ghế ở ô trống
Chọn sai khoang|Vé Phổ thông; ghế Thương gia|Thử bấm ghế khác khoang|Không cho gán ghế không thuộc khoang hợp lệ
Bỏ chọn ghế|Một khách đang có ghế trống được chọn|Bấm lại ghế đó|Bỏ lựa chọn và cập nhật phụ phí tương ứng
Đổi ghế một khách|Ghế A trống phí X; ghế B trống phí Y|Chọn A rồi chọn B cho cùng khách|Chỉ B được giữ trong lựa chọn; phí cập nhật từ X sang Y
Thiếu ghế một chặng|2 khách khứ hồi; thiếu ghế khách 2 chặng về|Chọn đủ các ghế còn lại; tiếp tục|Chặn vì chưa đủ ghế từng khách trên từng chặng
Ghế vừa bị đặt|Ghế chọn ban đầu trống; fixture đổi sang booked|Refetch sơ đồ|Bỏ lựa chọn không còn hợp lệ; thông báo để chọn lại
Đổi phụ phí ghế|Ghế đã chọn có phí X; server đổi Y|Refetch sơ đồ|Phí cập nhật theo dữ liệu mới; không âm thầm dùng giá cũ
Tàu bay chưa có cấu hình|Flight fixture không có geometry được hỗ trợ|Gọi seat-map và mở UI|Báo lỗi cấu hình rõ; không suy đoán cột ghế; không crash
API ghế lỗi|Mock seats hoặc seat-map 500|Mở bước ghế; phục hồi API; tải lại|Thông báo lỗi; không dùng sơ đồ giả; phục hồi được
Chọn ghế không giữ chỗ|Ghế trống; mở cùng chuyến bằng hai phiên|Chọn ghế phiên A; xem server và phiên B|Không tuyên bố đã giữ/đặt; ghi rõ đây là lựa chọn chưa tạo booking
'''),
'SEC': ('Xác thực và bảo vệ dữ liệu', 'be/src/middlewares/auth.middleware.ts; fe/tests/navigation.test.cjs', '''
Token không hợp lệ|Bearer token bị sửa chữ ký|GET /auth/profile|HTTP 403 theo middleware hiện tại; không trả dữ liệu cá nhân
Token hết hạn|JWT test đã hết hạn|GET /auth/profile; quan sát UI khi nhận lỗi|API 403 theo hiện trạng; ghi hành vi UI và gap so với chính sách hết phiên đã duyệt
Token đã logout|Token A vừa logout; Redis test hoạt động|Dùng lại token gọi /auth/profile|HTTP 401 khi token nằm blacklist; không trả hồ sơ
403 không xóa nhầm phiên|Phiên A hợp lệ; mock request trả 403|Thực hiện request; mở lại Hồ sơ|Không reset phiên chỉ vì 403 theo logic hiện tại; ghi thông báo
401 của request cũ|Request dùng token A đang chờ; đã đăng nhập B|Trả 401 cho request cũ sau khi B đăng nhập|Không xóa phiên B; không hiển thị dữ liệu A
Logout khi mạng chậm|Đã đăng nhập A; delay /auth/logout|Bấm logout; ngay lập tức thử màn được bảo vệ|Quyền truy cập local bị xóa ngay; không chờ response logout
Không lộ dữ liệu trong URL|Form có họ tên; email; giấy tờ giả lập|Sang chọn ghế; xem URL/deep link và log|Không chứa dữ liệu cá nhân dạng rõ; nếu có ghi bug và che bằng chứng
Không lộ thông tin máy chủ|Payload sai định dạng và UUID sai|Gọi API; xem response và log được cấp quyền|Response không chứa stack/SQL/secret; ghi field bị lộ nếu có
Yêu thích cách ly người dùng|A lưu flight F; B chưa lưu F|GET trạng thái favorite với token A rồi B|A true; B false; B không sửa bản ghi của A
'''),
'NAV': ('Điều hướng và thiết bị', 'fe/tests/navigation.test.cjs; fe/src/navigation', '''
Deep link thiếu tham số|Link FareSelection thiếu flight/leg bắt buộc|Mở link từ trạng thái app đóng|Không tạo lựa chọn giả; trở về màn an toàn hoặc báo lỗi
JSON điều hướng hỏng|Tham số serialized JSON bị cắt|Mở link; bấm Back nếu hiển thị|Không crash; có đường quay lại
Back không có lịch sử|Mở trực tiếp màn chi tiết bằng deep link|Bấm nút Back của app|Fallback Home; không kẹt màn
Giữ dữ liệu khứ hồi|Hai flight ID khác nhau; ngày đi/về; số khách|Đi tìm kiếm → gói → hành khách → ghế; kiểm tra mỗi chặng|Không đảo flight ID; giữ ngày và số khách đúng qua serialization
Android nút Back|Thiết bị Android trong ENV|Đi qua từng bước; bấm Back hệ thống|Về đúng màn; không bỏ qua auth hoặc crash
Bàn phím che form|Thiết bị màn hình nhỏ; form hành khách|Focus trường gần cuối; mở bàn phím; cuộn và tiếp tục|Đọc được lỗi; thao tác được nút; không mất dữ liệu
Chữ lớn|Cỡ chữ hệ thống tăng trên thiết bị test|Mở Home; Login; PassengerInfo; kiểm tra nút|Thông tin chính đọc được; không chồng nút hoặc mất khả năng thao tác
Giảm chuyển động|Bật Reduce Motion theo OS hỗ trợ|Mở và chuyển các màn chính|Hiệu ứng xét thiết lập; chức năng và điều hướng vẫn đúng
'''),
'MOCK': ('Màn dữ liệu mẫu', 'README.md; fe/src/screens', '''
Tab yêu thích mẫu|Build hiện tại dùng dữ liệu mẫu|Mở tab Yêu thích; đối chiếu với API chi tiết|Ghi rõ dữ liệu mẫu; không dùng tab làm bằng chứng đồng bộ backend
Danh sách và chi tiết vé mẫu|Chưa có booking thật|Mở Vé của tôi rồi chi tiết vé|Điều hướng và hiển thị mẫu ổn định; không coi là vé đã phát hành
Thông báo trong phiên|Danh sách thông báo mẫu|Lọc; mở chi tiết; đánh dấu đã đọc; quay lại|Bộ lọc và trạng thái trong phiên nhất quán; chưa yêu cầu lưu server
Check-in chưa tích hợp|Màn check-in giao diện hiện tại|Nhập thông tin giả lập; thao tác nút nếu có|Không tuyên bố check-in thành công hoặc boarding pass thật khi chưa có xử lý
'''),
'FUT': ('Booking và thanh toán tương lai', 'README.md; exports/create_schedule.py — đề xuất, chưa phải hợp đồng đã duyệt', '''
Tạo booking idempotent|Sandbox; cùng idempotency key|Gửi hai yêu cầu đặt cùng hành trình|Một booking duy nhất; giá được tính lại server; cần duyệt API trước khi chạy
Tranh chấp cùng ghế|Hai tài khoản; một ghế còn trống|Gửi đồng thời yêu cầu giữ cùng ghế|Tối đa một giữ chỗ thành công; không bán trùng
Hết hạn giữ ghế|Hold có TTL test ngắn|Giữ ghế; chờ hết hạn; đặt lại từ phiên khác|Giải phóng theo TTL; phiên cũ không thanh toán bằng hold hết hạn
Webhook thanh toán lặp|Webhook sandbox chữ ký đúng; cùng event ID|Gửi lại webhook thành công hai lần|Chỉ cập nhật và phát hành một lần
Webhook giả mạo|Payload thay đổi hoặc chữ ký sai|Gửi webhook tới sandbox|Từ chối; không đổi trạng thái booking
Thanh toán thất bại|Booking pending; gateway sandbox trả thất bại|Thanh toán; quay về app; tải lại booking|Không phát hành vé; trạng thái đúng; xử lý hold theo chính sách
Truy cập vé người khác|Vé A đã phát hành; token B|B đọc API vé A sau khi endpoint có|Từ chối; không lộ dữ liệu hành khách
'''),
}

def build_report(base_cases, sheet_xml, styles):
    out = Path(__file__).with_name('SkyJourney_Test_Report_2026-11-01_v2.xlsx')
    requirements = {}
    cases = []
    def add(cid, group, title, priority, readiness, source, pre, data, steps, expected, kind='Functional'):
        req = 'REQ-' + group
        requirements.setdefault(req, (title if group not in GROUPS else GROUPS[group][0], source))
        scope = 'In' if readiness == 'Hiện có' else 'Out'
        cases.append([cid, req, group, title, kind, priority, readiness, scope, 'ENV-01', pre, data, steps, expected,
                      '', 'Not Run', '', '', '', '', '', '', ''])
    for cid, title, priority, readiness, pre, steps, expected in base_cases:
        group = cid.split('-')[0]
        source = {'UI':'fe/src/screens/home/Home.tsx', 'AUTH':'be/src/routes/auth.route.ts',
                  'SRCH':'be/src/validators/flight.validator.ts', 'BOOK':'fe/src/screens/booking/PassengerInfo.tsx; fe/src/utils/seatMap.ts',
                  'FAV':'be/src/routes/flight.route.ts', 'CACHE':'exports/create_schedule.py — kế hoạch',
                  'PERF':'exports/create_schedule.py — mục tiêu cần chốt', 'REG':'README.md'}[group]
        add(cid, group, title, 'P1' if priority=='Cao' else 'P2', readiness, source, pre,
            'TD-USER-A; TD-FLIGHT; TD-SEARCH theo tình huống. Ghi ID/giá trị fixture thực tế trước chạy.',
            '\n'.join(f'{i}. {step.strip()}' for i,step in enumerate(steps.split(';'),1)), expected,
            'Performance' if group=='PERF' else 'Functional')
    for group, (label, source, text) in GROUPS.items():
        # Separate registration from the legacy REG regression case.
        prefix = 'SIGNUP' if group=='REG' else group
        for i, line in enumerate(text.strip().splitlines(),1):
            title, data, steps, expected = line.split('|')
            add(f'{prefix}-{i:02}', prefix, title, 'P1' if group not in ('NAV','MOCK') else 'P2',
                'Sau triển khai' if group=='FUT' else 'Hiện có', source,
                'ENV-01 đã sẵn sàng; fixture được đối chiếu trong Dữ liệu test; ' +
                ('chưa chạy đến khi API và quy tắc được bàn giao.' if group=='FUT' else 'cô lập dữ liệu test; khôi phục dữ liệu sau ca có thay đổi.'),
                data, '\n'.join(f'{j}. {s.strip()}' for j,s in enumerate(steps.split(';'),1)), expected,
                'Security' if group=='SEC' else ('UI / Compatibility' if group=='NAV' else 'Functional'))
        requirements['REQ-'+prefix] = (label,source)
    # Legacy regression has its own requirement label.
    requirements['REQ-REG'] = ('Hồi quy sau tích hợp', 'README.md; fe/tests/navigation.test.cjs')
    for group,label in {'UI':'Khởi động và Home','AUTH':'Đăng nhập, khôi phục phiên và đăng xuất',
                        'SRCH':'Tìm kiếm chuyến bay qua giao diện','BOOK':'Lựa chọn hành trình và giới hạn booking hiện tại',
                        'FAV':'Yêu thích: API hiện có và tích hợp tương lai','CACHE':'Cache: kế hoạch tối ưu chờ bàn giao',
                        'PERF':'Đo hiệu năng trước/sau, chờ baseline'}.items():
        req='REQ-'+group
        requirements[req]=(label,requirements[req][1])
    end = len(cases)+4
    def f(expr): return ('formula',expr)
    def count(status): return f'COUNTIFS(\'Test cases\'!H5:H{end},"In",\'Test cases\'!O5:O{end},"{status}")'
    summary = [
        ['Report ID','SJ-QA-20261101-v2','Kế hoạch kiểm thử 01/11/2026; lập theo ngày Việt Nam 31/10/2026.'],
        ['Loại tài liệu','Test execution report — chưa thực thi','Bộ test thiết kế từ mã nguồn; chưa có bằng chứng runtime hoặc kết luận chất lượng.'],
        ['Test cycle / release','','Điền mã cycle và release trước khi chạy.'],
        ['Build / commit / môi trường','','Bắt buộc chốt trong Môi trường. Không lấy phiên bản package thay commit.'],
        ['QA owner / thời gian bắt đầu-kết thúc','','Điền người chịu trách nhiệm và thời gian thực tế UTC+7.'],
        ['Tổng case thiết kế',len(cases),'Bao gồm case tương lai nằm ngoài cycle mặc định.'],
        ['Trong phạm vi',f(f'COUNTIF(\'Test cases\'!H5:H{end},"In")'),'Cột H là phạm vi cycle; Out không tính tỷ lệ.'],
        ['Ngoài phạm vi',f(f'COUNTIF(\'Test cases\'!H5:H{end},"Out")'),'Chờ triển khai hoặc chốt baseline/tiêu chí.'],
    ]
    for status in ['Not Run','Pass','Fail','Blocked','N/A']:
        summary.append([status,f(count(status)),'Chỉ đếm case In; không đếm số lần retest.'])
    summary += [
        ['Đã thực thi',f(f'{count("Pass")}+{count("Fail")}'),'Pass + Fail; Blocked chưa có kết quả thực thi.'],
        ['Tỷ lệ hoàn thành (%)',f(f'IF(({count("Not Run")}+{count("Pass")}+{count("Fail")}+{count("Blocked")})=0,"",ROUND(100*({count("Pass")}+{count("Fail")})/({count("Not Run")}+{count("Pass")}+{count("Fail")}+{count("Blocked")}),2))'),'Mẫu số: In trừ N/A. Chưa chạy = 0%; mẫu số 0 = trống.'],
        ['Pass rate (%)',f(f'IF(({count("Pass")}+{count("Fail")})=0,"",ROUND(100*{count("Pass")}/({count("Pass")}+{count("Fail")}),2))'),'Pass / (Pass + Fail); chưa chạy để trống, không coi 100%.'],
        ['Lỗi còn mở',f('COUNTIFS(\'Bug log\'!A5:A104,"<>",\'Bug log\'!J5:J104,"Open")+COUNTIFS(\'Bug log\'!A5:A104,"<>",\'Bug log\'!J5:J104,"In Progress")+COUNTIFS(\'Bug log\'!A5:A104,"<>",\'Bug log\'!J5:J104,"Ready for Retest")+COUNTIFS(\'Bug log\'!A5:A104,"<>",\'Bug log\'!J5:J104,"Reopened")'),'Không đếm dòng chưa có Bug ID.'],
        ['Rủi ro / blocker cần quyết định','','Tổng hợp từ Rủi ro và Bug log, ghi người xử lý và hạn.'],
        ['Khuyến nghị QA','Chưa đánh giá','Chỉ điền sau execution; KPI tự tính không thay quyết định phát hành.'],
        ['Quyết định phát hành','','Người phê duyệt; ngày; điều kiện và rủi ro chấp nhận trong Phê duyệt.'],
    ]
    sheets = []
    def sheet(name, subtitle, headers, rows, widths=None):
        sheets.append((name,'SKYJOURNEY — '+name.upper(),subtitle,headers,rows,widths or [24]*len(headers)))
    sheet('Tổng hợp','Chưa thực thi • Công thức cập nhật khi Excel/LibreOffice tính lại • Đọc Hướng dẫn trước sử dụng.',
          ['Chỉ số / thông tin','Giá trị','Định nghĩa / cách điền'],summary,[32,58,105])
    sheet('Kiểm soát tài liệu','Quản lý phiên bản và baseline; không thay thế báo cáo bằng dữ liệu ước đoán.',
          ['Phiên bản','Ngày','Người sửa','Nội dung','Trạng thái / baseline'],[
              ['v1','31/10/2026','','35 case; 5 sheet','Bản đầu; giữ nguyên file gốc.'],
              ['v2','31/10/2026','','Mở rộng thiết kế case, traceability, execution, defect, risk và sign-off','Draft; chưa thực thi; chưa phê duyệt tiêu chí.']], [14,20,24,80,70])
    scope=[]
    for req,(label,source) in requirements.items():
        related=[c for c in cases if c[1]==req]
        readiness=', '.join(sorted({c[6] for c in related}))
        scope.append([req,label,readiness,source,'Hiện trạng mã nguồn / tiêu chí ứng viên; QA và PO cần duyệt',
                      'Không suy ra hoàn thành nghiệp vụ chỉ từ giao diện hoặc schema.'])
    sheet('Phạm vi yêu cầu','REQ là mã truy vết nội bộ của báo cáo, chưa phải requirement ID đã được PO phê duyệt.',
          ['REQ ID','Chức năng / mục tiêu','Mức sẵn sàng','Nguồn đối chiếu trong repo','Cơ sở chấp nhận','Giới hạn'],scope,[20,42,28,85,65,70])
    sheet('Chiến lược','Đề xuất cho cycle; người phụ trách phải chốt ngưỡng và thiết bị trước thực thi.',
          ['Mục','Nội dung','Bằng chứng / người xác nhận'],[
              ['Mục tiêu','Xác nhận tìm chuyến → gói vé → hành khách → chọn ghế và quyền tài khoản; xác định lỗi chặn luồng.',''],
              ['Cấp độ','Unit/logic hiện có; API integration có fixture; UI trên thiết bị; regression sau sửa.','Kết quả mỗi cấp ghi riêng; unit pass không suy ra E2E pass.'],
              ['Kỹ thuật','Phân vùng tương đương; biên 1/18 khách, 31 ngày, 2/12 tuổi; chuyển trạng thái; lỗi mạng; cách ly tài khoản.',''],
              ['Thứ tự','Smoke P1 → API/negative → UI/thiết bị → regression → performance có baseline.',''],
              ['Entry criteria','Chốt commit FE/BE; ENV-01 reachable; fixture sẵn; API contract và quyền dữ liệu xác nhận; có công cụ lưu evidence.','Chưa xác nhận'],
              ['Exit criteria đề xuất','100% P1 In thực thi và Pass; không còn Critical/High mở; case còn lại đã chạy hoặc có ngoại lệ được duyệt.','Chưa phê duyệt; không tự dùng làm release gate chính thức.'],
              ['Tạm dừng','Build không khởi động; mất DB test; sai fixture; lỗi làm sai dữ liệu nhiều ca. Ghi Blocked và ticket môi trường.',''],
              ['Tiếp tục','Blocker được xử lý; ghi build mới; kiểm tra smoke trước khi tiếp tục.',''],
              ['Không thuộc cycle mặc định','Booking/hold/payment/vé thật; Redis/RTK Query tối ưu chưa bàn giao; đo hiệu năng chưa có baseline.','Chuyển In sau bàn giao và duyệt tiêu chí.'],
              ['Ràng buộc','Màn vé/thông báo/yêu thích mẫu chỉ kiểm tra UI; không dùng làm bằng chứng dữ liệu server.',''],
          ],[28,115,70])
    sheet('Môi trường','Mỗi build/thiết bị cần một ENV ID; sao chép workbook cho matrix độc lập nếu cần.',
          ['ENV ID','Mục đích','FE commit / version','BE commit / version','Thiết bị / model','OS / phiên bản','Dev / Release','API base URL','DB dataset / snapshot','Redis / cấu hình','Mạng / latency','Công cụ / version','Người chuẩn bị','Kiểm tra sẵn sàng / ngày'],
          [['ENV-01','Cycle chính']+['']*12,['ENV-02','Thiết bị thứ hai / regression']+['']*12], [18,35]+[30]*12)
    sheet('Dữ liệu test','Mọi giá trị là fixture đề xuất; thay bằng ID thật của DB test, không dùng danh tính thật.',
          ['Data ID','Dữ liệu / hợp đồng','Giá trị đề xuất','Chuẩn bị / kiểm chứng','Giá trị thực tế / nguồn evidence','Khôi phục'],[
              ['TD-USER-A','Tài khoản A riêng cho QA','qa.a@example.test; họ Nguyễn Văn An','Tạo qua luồng cho phép; mật khẩu lưu ngoài report; A/B khác ID','','Khôi phục hồ sơ/mật khẩu sau test'],
              ['TD-USER-B','Tài khoản B kiểm tra cách ly','qa.b@example.test','Khác danh bạ và yêu thích A; ghi ID ẩn danh','','Xóa dữ liệu tạo thêm qua luồng được cấp quyền'],
              ['TD-SEARCH','Payload tìm kiếm cơ sở','{"departureCode":"SGN","arrivalCode":"HAN","departDate":"2026-11-01","passengers":1,"seatClass":"Phổ thông"}','Xác nhận fixture có chuyến; đổi ngày nếu test cycle khác','','Không thay ngày máy để ép dữ liệu'],
              ['TD-FLIGHT','Flight ID có thật và đủ tồn kho','UUID lấy từ API; có chặng về độc lập','Ghi ID đi/về, giá, khoang và tồn kho trước chạy','','Khôi phục trạng thái test đã thay đổi'],
              ['TD-SEAT','Sơ đồ có ghế trống/đặt và hai khoang','Ghế test có phí X/Y; geometry một và hai lối đi','Đối chiếu DB test hoặc response snapshot','','Không tác động booking thật'],
              ['TD-PAX','Tuổi tại ngày bay 01/11/2026','Adult sinh 01/11/2014; child 02/11/2014; infant 02/11/2024','Ngày sinh phải xét lại khi đổi ngày bay','','Giấy tờ/SĐT giả lập được môi trường chấp nhận'],
              ['TD-NET','Mô phỏng lỗi','500; timeout; offline; response đảo thứ tự','Chỉ môi trường test; ghi cách mock/proxy','','Tắt mock và khôi phục mạng sau ca'],
          ],[20,45,85,80,60,65])
    headers=['Test ID','REQ ID','Module','Tên / mục tiêu','Loại test','Ưu tiên','Sẵn sàng','Scope cycle','ENV ID','Điều kiện trước','Dữ liệu đầu vào','Bước thực hiện','Kết quả mong đợi','Kết quả thực tế','Trạng thái','Người test','Thời gian UTC+7','Build / commit','Evidence ID / link','Bug ID','Execution ID mới nhất','Ghi chú / lý do']
    sheet('Test cases','Một dòng là kết quả mới nhất của một case trong một cycle/ENV. Lịch sử mỗi lần chạy lưu tại Execution log.',
          headers,cases,[18,20,18,46,24,12,25,15,18,65,72,80,90,75,18,24,28,35,48,20,30,65])
    matrix=[]
    for req,(label,_) in requirements.items():
        row=[req,label,', '.join(c[0] for c in cases if c[1]==req)]
        for status in ['All','In','Pass','Fail','Blocked','Not Run','N/A']:
            crit=f'\'Test cases\'!B5:B{end},"{req}"'
            if status!='All': crit+=f',\'Test cases\'!H5:H{end},"In"'
            if status not in ('All','In'): crit+=f',\'Test cases\'!O5:O{end},"{status}"'
            row.append(f('COUNTIFS('+crit+')'))
        matrix.append(row)
    sheet('Traceability','Thiết kế case không đồng nghĩa đã kiểm chứng yêu cầu; xem kết quả thực thi theo từng REQ.',
          ['REQ ID','Yêu cầu','Test IDs','Tổng thiết kế','In','Pass','Fail','Blocked','Not Run','N/A'],matrix,[20,45,95]+[16]*7)
    sheet('Execution log','Một dòng mỗi lần chạy. Giữ lần Fail gốc khi retest Pass; cập nhật kết quả mới nhất sang Test cases.',
          ['Execution ID','Test ID','Cycle','ENV ID','Build / commit','Bắt đầu UTC+7','Kết thúc UTC+7','Người test','Input thực tế / Data ID','Actual result','Status','Evidence ID','Bug ID','Loại chạy / lý do','Execution trước'],
          [['']*15 for _ in range(100)],[25,20,24,20,35,28,28,24,65,85,18,30,22,55,25])
    sheet('Bug log','100 dòng nhập sẵn; không có lỗi được khẳng định khi chưa có bằng chứng.',
          ['Bug ID','Test IDs','Tiêu đề','Severity','Priority','Điều kiện / dữ liệu','Bước tái hiện','Expected','Actual','Status','ENV / build phát hiện','Evidence IDs','Tần suất','Người báo / ngày','Assignee','Build sửa','Execution retest','Root cause / resolution','Ngày đóng'],
          [['']*19 for _ in range(100)],[20,25,55,18,15,65,80,70,70,25,40,35,20,30,28,30,30,65,25])
    sheet('Retest regression','Retest xác nhận lỗi cụ thể; regression xác nhận phần liên quan không bị ảnh hưởng.',
          ['Retest ID','Bug ID','Test ID','Build lỗi','Build sửa','ENV ID','Bước / phạm vi regression','Execution ID','Actual / evidence','Kết quả','Người test / thời gian','Quyết định bug'],
          [['']*12 for _ in range(50)],[22,20,22,30,30,20,85,28,80,18,35,45])
    sheet('Bằng chứng','Không lưu token, mật khẩu hoặc giấy tờ thật. Dùng đường dẫn được chia sẻ và có quyền truy cập.',
          ['Evidence ID','Execution / Bug ID','Loại','Tên file / URL','Build / ENV','Thời gian UTC+7','Bước / kết luận chứng minh','Dữ liệu đã che','Người thu thập'],
          [['']*9 for _ in range(60)],[25,30,25,90,40,30,90,35,28])
    perf=[]
    for metric in ['Cold start → Home thao tác được','Home cache lạnh','Home cache ấm','API tìm chuyến','API danh mục Redis miss','API danh mục Redis hit']:
        for build in ['Trước tối ưu','Sau tối ưu']:
            r=len(perf)+5
            perf.append([metric,build,'','','','','','','','',f(f'IF(COUNT(F{r}:J{r})=5,MEDIAN(F{r}:J{r}),"")'),'',
                         f(f'IF(AND(COUNT(F{r}:J{r})=5,ISNUMBER(L{r}),L{r}>0),IF(K{r}<=L{r},"Đạt ngưỡng","Vượt ngưỡng"),"Chưa đủ dữ liệu / ngưỡng")'),'','',''])
    sheet('Đo hiệu năng','ms; cùng ENV, dataset, release, mạng và cache; 5 lần chỉ phục vụ so sánh sơ bộ, chưa đủ kết luận tải lớn.',
          ['Chỉ số','Baseline / build','ENV / thiết bị','Mạng / dữ liệu / cache','Cách đo / tool','Lần 1','Lần 2','Lần 3','Lần 4','Lần 5','Median ms','Ngưỡng ms đã duyệt','Đánh giá sơ bộ','Số request','Evidence IDs','Ghi chú / người duyệt'],perf,[44,30,35,65,55]+[16]*5+[20,25,45,20,35,65])
    sheet('Rủi ro','Rủi ro/gap thiết kế không tự động là defect runtime. Chỉ tạo Bug ID khi có kết quả tái hiện.',
          ['Risk ID','Rủi ro / gap','Khả năng','Tác động','Biện pháp / điều kiện đóng','Owner','Hạn','Trạng thái','Evidence / quyết định'],[
              ['R-01','Chưa có môi trường, build và thiết bị được chốt','Cao','Không tái lập kết quả','Hoàn tất ENV-01 và entry checklist','','','Open',''],
              ['R-02','Booking/giữ ghế/thanh toán chưa tích hợp','Chắc chắn theo phạm vi hiện tại','Chưa thể kết luận E2E đặt vé','Giới hạn kết luận ở lựa chọn hành trình; chờ bàn giao nghiệp vụ','','','Open','README.md'],
              ['R-03','Màn dữ liệu mẫu có thể bị hiểu là dữ liệu thật','Cao','Kết luận sai về đồng bộ hoặc vé đã phát hành','Phân biệt UI mẫu và API thật trong execution','','','Open','README.md'],
              ['R-04','Chưa duyệt ngưỡng hiệu năng và exit criteria','Cao','Không có cơ sở quyết định đạt','QA/PO duyệt baseline trước đo','','','Open',''],
              ['R-05','Token lỗi/hết hạn trả 403; blacklist Redis có fallback','Cần kiểm chứng','Hành vi hết phiên/logout có thể chưa đúng kỳ vọng','Test SEC và sự cố Redis; duyệt chính sách phiên trước release','','','Open','be/src/middlewares/auth.middleware.ts'],
              ['R-06','Nhiều thay đổi chưa commit tại thời điểm thiết kế','Cao','Commit riêng không tái tạo được build test','Ghi diff/artifact hash hoặc commit build thực tế','','','Open',''],
          ],[20,85,28,70,100,28,24,22,75])
    sheet('Phê duyệt','Quyết định do người được giao trách nhiệm ghi; để trống khi chưa thực thi.',
          ['Vai trò / hạng mục','Người chịu trách nhiệm','Kết luận / điều kiện','Ngày UTC+7','Bằng chứng / ngoại lệ được chấp nhận'],[
              ['QA xác nhận kết quả','','Chưa đánh giá','',''],['Development xác nhận build / lỗi còn mở','','','',''],
              ['Product Owner xác nhận phạm vi / tiêu chí','','','',''],['Release owner quyết định','','','',''],
              ['Ngoại lệ còn mở','','Ghi Risk/Bug/Test ID, lý do, owner, hạn xử lý','',''],
          ],[45,35,90,30,100])
    sheet('Hướng dẫn','Các ô trống là dữ liệu cần ghi khi kiểm thử, không phải bằng chứng đã đạt.',
          ['Mục','Quy tắc','Ví dụ / kiểm tra'],[
              ['1. Chốt baseline','Điền ENV, build, cycle, người test, fixture; duyệt phạm vi và tiêu chí.','Mặc định chỉ Hiện có là In; chức năng tương lai Out.'],
              ['2. Thực thi','Mỗi biến thể input là một lượt execution; ghi input thật, actual, thời gian và evidence.','Case chứa nhiều biến thể chỉ Pass khi tất cả biến thể đã đạt; có thể tách ID trước chạy.'],
              ['3. Trạng thái','Not Run: chưa chạy; Pass: đã chạy đạt; Fail: có sai lệch; Blocked: không thể chạy; N/A: không áp dụng có lý do.','Blocked/N/A bắt buộc ghi lý do và người duyệt; không coi là Pass.'],
              ['4. Scope','In/Out là phạm vi cycle, tách khỏi readiness và kết quả.','Out không tính completion/pass rate. Không đổi Out để che Fail.'],
              ['5. Actual và evidence','Ghi quan sát cụ thể, mã HTTP/response đã che dữ liệu; không chép Expected làm Actual.','Ví dụ cách ghi, KHÔNG phải kết quả: “HTTP 400; message=...; response ở EV-...”.'],
              ['6. Defect','Fail cần Bug ID hoặc liên kết lỗi đã biết. Severity và priority là hai trường độc lập.','Critical: mất/sai dữ liệu nghiêm trọng; High: chặn luồng chính; Medium: có cách vòng; Low: lỗi nhỏ.'],
              ['7. Ưu tiên','P1: smoke/luồng chính/bảo vệ dữ liệu; P2: chức năng thường dùng và biên; P3: ít ảnh hưởng.','Người phụ trách có thể đổi sau phân tích rủi ro.'],
              ['8. Vòng đời bug','Open → In Progress → Ready for Retest → Closed; retest lỗi → Reopened; Rejected phải có lý do.','Chỉ đóng khi có build sửa và evidence retest.'],
              ['9. Lịch sử','Execution log giữ toàn bộ lượt chạy; Test cases giữ kết quả mới nhất trong cùng cycle/ENV.','Không xóa lần Fail khi retest Pass; liên kết Execution ID trước.'],
              ['10. KPI','Completion=(Pass+Fail)/(In trừ N/A); pass rate=Pass/(Pass+Fail).','Chưa có execution thì pass rate để trống; lỗi mở không đồng nghĩa tổng lượt Fail.'],
              ['11. Capacity','Bug log KPI có phạm vi hàng 5-104; case KPI được tạo đúng số case lúc generate.','Nếu thêm case/bug ngoài phạm vi, mở rộng công thức, filter và validation trước dùng.'],
              ['12. Multi ENV','Một case có một kết quả mới nhất cho một cycle/ENV; copy workbook nếu cần từng nền tảng.','Không ghi Pass Android đè lên Fail iOS rồi kết luận đa nền tảng đạt.'],
              ['13. Hiệu năng','Giữ điều kiện đo; có baseline và ngưỡng được duyệt; lưu 5 lần, median và số request.','Chưa có số đo/threshold thì không kết luận nhanh hơn hoặc đạt SLO.'],
              ['14. An toàn dữ liệu','Dùng DB test; fixture giả; không seed tổng/xóa dữ liệu chung để chuẩn bị report.','Chỉ xóa key cache test; không FLUSHALL; che token và thông tin cá nhân trong evidence.'],
              ['15. Phát hành','Đối chiếu exit criteria, P1, bug Critical/High, Blocked và rủi ro chấp nhận; ký ở Phê duyệt.','Workbook không tự cấp trạng thái sẵn sàng phát hành.'],
              ['16. Nguồn tài liệu','Nguồn là mã nguồn repo và README hiện tại; REQ nội bộ và tiêu chí đề xuất cần được phê duyệt.','Chưa thực hiện UI/API/unit test trong quá trình tạo tài liệu này.'],
          ],[26,115,105])
    write_workbook(out,sheets,sheet_xml,styles)
    validate(out,sheets,cases,requirements)
    print(f'Created and validated: {out} ({len(cases)} cases; {len(sheets)} sheets; all Not Run)')
    return out

def write_workbook(out,sheets,sheet_xml,styles):
    def render(s):
        name,title,subtitle,headers,rows,widths=s
        assert all(len(row)==len(headers) for row in rows), name
        root=ET.fromstring(sheet_xml(title,subtitle,headers,rows,widths))
        data=root.find(f'{{{NS}}}sheetData')
        nodes={int(row.attrib['r']):row for row in data}
        for r,values in enumerate(rows,5):
            node=nodes[r]
            # Detailed steps need visible space; avoid the old fixed 82pt row clipping.
            node.set('ht',str(180 if name=='Test cases' else 100))
            for c,value in enumerate(values):
                if isinstance(value,tuple) and value[0]=='formula':
                    cell=node[c]
                    cell.attrib.pop('t',None)
                    for child in list(cell): cell.remove(child)
                    ET.SubElement(cell,f'{{{NS}}}f').text=value[1]
        if name=='Test cases':
            pane=root.find(f'{{{NS}}}sheetViews')[0][0]
            pane.attrib.update(xSplit='4',ySplit='4',topLeftCell='E5',activePane='bottomRight')
        validations=[]
        n=len(rows)+4
        if name=='Test cases': validations=[('F','P1,P2,P3'),('H','In,Out'),('O','Not Run,Pass,Fail,Blocked,N/A')]
        elif name=='Bug log': validations=[('D','Critical,High,Medium,Low'),('E','P1,P2,P3'),('J','Open,In Progress,Ready for Retest,Closed,Rejected,Reopened')]
        elif name=='Execution log': validations=[('K','Not Run,Pass,Fail,Blocked,N/A')]
        elif name=='Retest regression': validations=[('J','Not Run,Pass,Fail,Blocked,N/A')]
        if validations:
            dv=ET.Element(f'{{{NS}}}dataValidations',count=str(len(validations)))
            for col,options in validations:
                v=ET.SubElement(dv,f'{{{NS}}}dataValidation',type='list',allowBlank='1',showErrorMessage='1',errorStyle='stop',
                                errorTitle='Giá trị không hợp lệ',error='Chọn giá trị trong danh sách.',sqref=f'{col}5:{col}{n}')
                ET.SubElement(v,f'{{{NS}}}formula1').text='"'+options+'"'
            root.insert(list(root).index(root.find(f'{{{NS}}}pageMargins')),dv)
        # Fit width for printing; filters, wrap, stripes and frozen headers provided by shared renderer.
        root.find(f'{{{NS}}}pageSetup').set('fitToWidth','1')
        root.find(f'{{{NS}}}pageSetup').set('fitToHeight','0')
        pr=ET.Element(f'{{{NS}}}sheetPr')
        ET.SubElement(pr,f'{{{NS}}}pageSetUpPr',fitToPage='1')
        root.insert(0,pr)
        return ET.tostring(root,encoding='utf-8',xml_declaration=True)
    with ZipFile(out,'w',ZIP_DEFLATED) as z:
        overrides=''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(1,len(sheets)+1))
        z.writestr('[Content_Types].xml',f'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>{overrides}</Types>')
        z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        entries=''.join(f'<sheet name="{escape(s[0])}" sheetId="{i}" r:id="rId{i}"/>' for i,s in enumerate(sheets,1))
        z.writestr('xl/workbook.xml',f'<workbook xmlns="{NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>{entries}</sheets><calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>')
        rels=''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1,len(sheets)+1))
        z.writestr('xl/_rels/workbook.xml.rels',f'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{rels}<Relationship Id="rId{len(sheets)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr('xl/styles.xml',styles)
        for i,s in enumerate(sheets,1): z.writestr(f'xl/worksheets/sheet{i}.xml',render(s))

def validate(out,sheets,cases,requirements):
    ids=[c[0] for c in cases]
    assert len(ids)==len(set(ids)), 'Duplicate test IDs'
    assert all(c[1] in requirements and c[14]=='Not Run' and not c[13] for c in cases)
    assert all(c[10] and c[11] and c[12] for c in cases)
    assert len({s[0] for s in sheets})==len(sheets)
    assert all(len(s[0])<=31 for s in sheets)
    with ZipFile(out) as z:
        assert z.testzip() is None
        for part in z.namelist(): ET.fromstring(z.read(part))
        for i,s in enumerate(sheets,1):
            root=ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml'))
            assert len(root.find(f'{{{NS}}}sheetData'))==len(s[4])+3
            if s[0] in ('Test cases','Execution log','Bug log','Retest regression'):
                assert root.find(f'{{{NS}}}dataValidations') is not None
        actual_formulas=sum(len(ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml')).findall(f'.//{{{NS}}}f')) for i in range(1,len(sheets)+1))
        expected_formulas=sum(isinstance(v,tuple) for s in sheets for row in s[4] for v in row)
        assert actual_formulas==expected_formulas
    print('Validation: unique IDs, traceability, row widths, XML/ZIP, formulas and dropdowns OK.')
    print('Scope:',dict(Counter(c[7] for c in cases)))
