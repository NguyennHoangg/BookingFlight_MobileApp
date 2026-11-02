from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
from datetime import datetime
import xml.etree.ElementTree as ET

OUT = Path(__file__).parent / 'SkyJourney_Ke_hoach_2026-11-01.xlsx'
NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

schedule = [
['08:30','09:00','Đo hiện trạng','Đo mở app, tải Home, tìm chuyến; đếm request khi chuyển tab rồi quay lại. Ghi thiết bị và điều kiện mạng.','React Native DevTools; Network Inspector; Postman CLI','Có bảng số đo ban đầu và danh sách điểm chậm.','Cao'],
['09:00','09:30','Chuẩn hóa lớp gọi API','Tách sân bay và điểm đến khỏi hook useAirport; thống nhất kiểu response, lỗi và địa chỉ backend.','TypeScript; Axios clientApi','Hai nguồn dữ liệu tải và báo lỗi độc lập.','Cao'],
['09:30','10:30','Cache phía ứng dụng','Tạo API slice sân bay/điểm đến; chuyển Home sang query hook; chống request trùng; cấu hình độ mới; thêm thử lại.','RTK Query; Redux Toolkit; Axios baseQuery tùy chỉnh','Quay lại Home khi dữ liệu còn mới không gọi API thừa.','Cao'],
['10:30','11:15','Cache phía backend','Dùng getOrSet cho sân bay và điểm đến; key có phiên bản, TTL; ghi cache hit/miss; fallback database khi Redis lỗi.','Redis; Express; PostgreSQL','Lần gọi sau dùng cache; Redis tắt vẫn trả dữ liệu.','Cao'],
['11:15','11:30','Kiểm thử cache','Kiểm tra miss, hit, hết hạn, lỗi Redis; xác nhận dữ liệu lỗi không được lưu cache.','Postman CLI; Node.js test runner','Các tình huống cache đúng và có kết quả kiểm tra.','Cao'],
['11:30','13:00','Nghỉ trưa','Nghỉ trưa.','—','—','—'],
['13:00','13:45','API danh sách Yêu thích','Thêm endpoint theo tài khoản; trả dữ liệu chuyến bay cho card; kiểm tra quyền và thứ tự hiển thị.','Express; JWT middleware; PostgreSQL pg; TypeScript','API trả đúng danh sách của từng tài khoản.','Vừa'],
['13:45','14:30','Kết nối tab Yêu thích','Thay dữ liệu mẫu; thêm loading/empty/error; đồng bộ sau lưu/bỏ lưu; xóa cache cá nhân khi logout.','React Native; RTK Query tags/invalidation; Expo Router','Lưu ở chi tiết xuất hiện trong tab; bỏ lưu cập nhật cả hai nơi.','Vừa'],
['14:30','15:00','Tối ưu khởi động','Đo ảnh hưởng splash cố định 3,2 giây; rút ngắn chờ sau khôi phục phiên; tránh tải không cần thiết trước Home.','React hooks; Redux auth; Expo','Có số đo cải thiện; điều hướng đăng nhập vẫn đúng.','Cao'],
['15:00','15:30','Tối ưu ảnh và danh sách','Kiểm tra dung lượng, placeholder và cache ảnh; đo render Home; chỉ memo/chỉnh FlatList khi có bằng chứng.','React Native DevTools; FlatList; Expo Image nếu cần','Vuốt card ổn định; ảnh không tải lại không cần thiết.','Cao'],
['15:30','16:00','Tối ưu truy vấn chậm','Chọn truy vấn từ số đo; xem kế hoạch thực thi, cột trả về và index; chỉ thêm index khi có bằng chứng.','PostgreSQL EXPLAIN ANALYZE; SQL; Prisma schema/migration','Có số đo trước/sau hoặc kết luận chưa cần thay đổi.','Vừa'],
['16:00','16:45','Kiểm thử tổng thể','Thử mạng chậm, mất/kết nối lại mạng, Redis tắt, đổi tài khoản; kiểm tra Home và Yêu thích.','Thiết bị Android; bản release; Postman CLI; test runner','Không lẫn dữ liệu tài khoản; lỗi có thông báo và phục hồi được.','Cao'],
['16:45','17:00','Chốt kết quả','Chạy lint/typecheck/build và test liên quan; tổng hợp số đo, việc xong và việc còn lại.','ESLint; TypeScript; Git','Có báo cáo ngắn; thay đổi sẵn sàng review.','Cao'],
]
rows = []
for i, (start, end, task, detail, tech, done, priority) in enumerate(schedule, 1):
    minutes = int((datetime.strptime(end,'%H:%M') - datetime.strptime(start,'%H:%M')).total_seconds()/60)
    rows.append([i,start,end,minutes,task,detail,tech,done,priority,'Chưa bắt đầu' if task != 'Nghỉ trưa' else '—'])

sheets = [
('Lịch ngày mai','SKYJOURNEY — LỊCH NGÀY 01/11/2026','Chủ nhật • Giờ Việt Nam (UTC+7) • 7 giờ làm việc, nghỉ trưa 90 phút • Chỉ là kế hoạch',
 ['STT','Bắt đầu','Kết thúc','Phút','Task','Cần làm gì','Công nghệ / công cụ','Điều kiện hoàn thành','Ưu tiên','Trạng thái'],rows,[7,11,11,9,28,68,48,62,12,19]),
('Chính sách cache','CHÍNH SÁCH CACHE DỰ KIẾN','Cấu hình khởi đầu; phân biệt thời gian giữ cache và thời điểm cần lấy lại dữ liệu.',
 ['Dữ liệu','Cache phía app','Cache backend','Khi nào làm mới','Lưu ý'],[
 ['Sân bay','RTK Query; ngưỡng dữ liệu cũ 24 giờ','Redis TTL 24 giờ','Vượt ngưỡng hoặc yêu cầu tải lại','Định nghĩa riêng thời gian giữ cache và độ mới.'],
 ['Điểm đến','RTK Query; ngưỡng dữ liệu cũ 30 phút','Redis TTL 30 phút','Vượt ngưỡng hoặc cập nhật danh mục','Backend cần cơ chế xóa cache khi danh mục đổi.'],
 ['Yêu thích','RTK Query; tách theo tài khoản','Chưa cần Redis','Sau lưu/bỏ lưu; xóa cache khi logout','Không dùng chung cache cá nhân giữa tài khoản.'],
 ['Giá vé và ghế','Chưa thêm cache trong ngày này','Chưa thêm cache','Lấy mới khi vào bước chọn','Backend kiểm tra lại giá và ghế lúc đặt.'],
 ],[24,60,31,57,65]),
('Việc tiếp theo','CÁC PHẦN CÒN THIẾU — THỨ TỰ ƯU TIÊN','Xếp sau ngày 01/11/2026; chưa ấn định ngày hoàn thành. Mỗi task phụ thuộc các bước trước.',
 ['Thứ tự','Task','Cần làm gì','Công nghệ dự kiến','Phụ thuộc'],[
 [1,'Tạo booking và giữ ghế','Tính lại giá ở server; giữ ghế có thời hạn; chống đặt trùng ghế và tạo đơn trùng.','Express; PostgreSQL transaction/locking; ràng buộc database; idempotency key','Luồng chọn chuyến, giá vé, hành khách và ghế'],
 [2,'Thanh toán sandbox','Tạo giao dịch; xác minh webhook; xử lý webhook lặp; cập nhật trạng thái đơn.','SDK/API cổng thanh toán được chọn; webhook; PostgreSQL','Booking và cơ chế giữ ghế'],
 [3,'Vé thật','API danh sách/chi tiết vé; kiểm tra chủ sở hữu; thay dữ liệu mẫu.','Express; PostgreSQL; RTK Query','Booking và thanh toán thành công'],
 [4,'Thông báo thật','Lưu/tải thông báo; đánh dấu đã đọc; đồng bộ số chưa đọc.','PostgreSQL; Express; RTK Query','Sự kiện nghiệp vụ và tài khoản'],
 [5,'Check-in','Chốt quy tắc thời gian, điều kiện vé, chọn ghế và cấp boarding pass.','Backend nghiệp vụ; PostgreSQL; React Native','Vé thật và quy tắc check-in'],
 ],[10,29,77,66,49]),
('Kiểm tra và ghi chú','TIÊU CHÍ HOÀN THÀNH VÀ TÀI LIỆU','Nếu trễ lịch: chuyển API/tab Yêu thích sang buổi kế tiếp; giữ thời gian kiểm thử cache và đo hiệu năng.',
 ['Nhóm','Nội dung','Kết quả / nguồn'],[
 ['Cache app','Quay lại Home khi dữ liệu còn mới không gọi request sân bay/điểm đến thừa.','Chưa kiểm tra'],
 ['Cache backend','Redis tắt, cache miss, cache hết hạn đều có hành vi đúng.','Chưa kiểm tra'],
 ['Tài khoản','Danh sách Yêu thích không lẫn giữa hai tài khoản.','Chưa kiểm tra'],
 ['Hiệu năng','Lưu số đo trước/sau: mở app, tải Home, tìm chuyến, cuộn danh sách.','Đo trên cùng thiết bị và điều kiện mạng; dùng bản release.'],
 ['Kiểm tra code','Lint, typecheck, backend build và test liên quan.','Chưa chạy cho các task tương lai'],
 ['RTK Query','Cache được chia sẻ theo endpoint/tham số; cấu hình retention và refetch riêng.','https://redux.js.org/toolkit/rtk-query/usage/cache-behavior'],
 ['React Native','Đánh giá hiệu năng trên bản release vì development ảnh hưởng số đo.','https://reactnative.dev/docs/performance'],
 ['Phạm vi','Đây là lịch đề xuất; chưa triển khai, chưa tạo nhắc việc tự động.','Ngày lập kế hoạch: 31/10/2026'],
 ],[24,88,87]),
]

def col(n):
    result = ''
    while n:
        n, r = divmod(n-1,26)
        result = chr(65+r)+result
    return result

def cell(r,c,value,style):
    ref = f'{col(c)}{r}'
    if isinstance(value,(int,float)):
        return f'<c r="{ref}" s="{style}"><v>{value}</v></c>'
    return f'<c r="{ref}" s="{style}" t="inlineStr"><is><t xml:space="preserve">{escape(str(value))}</t></is></c>'

def sheet_xml(title,subtitle,headers,data,widths):
    last = col(len(headers))
    columns = ''.join(f'<col min="{i}" max="{i}" width="{w}" customWidth="1"/>' for i,w in enumerate(widths,1))
    body = '<row r="1" ht="32" customHeight="1">'+cell(1,1,title,1)+'</row>'
    body += '<row r="2" ht="38" customHeight="1">'+cell(2,1,subtitle,2)+'</row>'
    body += '<row r="4" ht="30" customHeight="1">'+''.join(cell(4,i,v,3) for i,v in enumerate(headers,1))+'</row>'
    for r,values in enumerate(data,5):
        style = 4 if r%2 else 5
        body += f'<row r="{r}" ht="82" customHeight="1">'+''.join(cell(r,i,v,style) for i,v in enumerate(values,1))+'</row>'
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="{NS}"><dimension ref="A1:{last}{len(data)+4}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="20"/><cols>{columns}</cols><sheetData>{body}</sheetData><autoFilter ref="A4:{last}{len(data)+4}"/><mergeCells count="2"><mergeCell ref="A1:{last}1"/><mergeCell ref="A2:{last}2"/></mergeCells><pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9"/></worksheet>'''

styles = f'''<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="{NS}">
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="18"/><color rgb="FF17365D"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF526477"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFDBE4EF"/></left><right style="thin"><color rgb="FFDBE4EF"/></right><top style="thin"><color rgb="FFDBE4EF"/></top><bottom style="thin"><color rgb="FFDBE4EF"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'''

with ZipFile(OUT,'w',ZIP_DEFLATED) as z:
    overrides = ''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(1,len(sheets)+1))
    z.writestr('[Content_Types].xml',f'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>{overrides}</Types>')
    z.writestr('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    entries = ''.join(f'<sheet name="{escape(s[0])}" sheetId="{i}" r:id="rId{i}"/>' for i,s in enumerate(sheets,1))
    z.writestr('xl/workbook.xml',f'<workbook xmlns="{NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>{entries}</sheets></workbook>')
    rels = ''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in range(1,len(sheets)+1))
    z.writestr('xl/_rels/workbook.xml.rels',f'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{rels}<Relationship Id="rId{len(sheets)+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
    z.writestr('xl/styles.xml',styles)
    for i,(_,title,subtitle,headers,data,widths) in enumerate(sheets,1):
        z.writestr(f'xl/worksheets/sheet{i}.xml',sheet_xml(title,subtitle,headers,data,widths))

with ZipFile(OUT) as z:
    assert z.testzip() is None
    for name in z.namelist():
        ET.fromstring(z.read(name))
    assert len(ET.fromstring(z.read('xl/workbook.xml')).find(f'{{{NS}}}sheets')) == 4
assert sum(row[3] for row in rows if row[4] != 'Nghỉ trưa') == 420
print(f'Created and validated: {OUT} ({OUT.stat().st_size} bytes; 4 sheets; 420 working minutes)')
