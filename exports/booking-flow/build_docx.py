from pathlib import Path
from collections import defaultdict
import hashlib
import json
from zipfile import ZipFile

from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).resolve().parent
OUT = ROOT / 'docs' / 'Luong_FE_Booking_Chi_Tiet.docx'
inventory = json.loads((WORK / 'source-index.json').read_text(encoding='utf-8'))

# Mỗi mục: tên hàm | đầu vào / tác nhân | xử lý thực tế | kết quả / nơi nhận.
rows = r'''
Home|Expo Router render route /; state lựa chọn của người dùng|Khởi tạo loại hành trình, sân bay, ngày, cơ cấu khách và hạng ghế; gọi useAirport; dựng các modal và nút tìm kiếm.|JSX trang chủ; các lựa chọn còn ở state cục bộ, chưa có booking draft.
getFormattedDate|offsetDays mặc định 0|Lấy ngày hiện tại, cộng số ngày và ghép chuỗi năm-tháng-ngày; được dùng để đặt ngày đi và ngày về mặc định.|Chuỗi YYYY-MM-DD cho departDateRaw/returnDateRaw.
handleSwapAirports|Bấm nút đổi chiều|Giữ departure vào biến tạm; gán departure = arrival và arrival = giá trị tạm.|Cập nhật selectedDeparture/selectedArrival; không gọi API.
handleOpenSelectAirport|type = departure hoặc arrival|Lưu loại sân bay đang chọn vào selectingType rồi bật modalVisible.|AirportSelectModal mở đúng mục chọn.
handleSelectAirport|Airport do modal trả về|Cập nhật sân bay theo selectingType; nếu trùng đầu còn lại thì đổi sân bay đầu kia về giá trị trước đó; đóng modal.|State sân bay mới trong Home.
formatDateVN|dateString|Chuyển ngày sang chuỗi có thứ, ngày và tháng để trình bày; chuỗi rỗng trả chuỗi rỗng.|Nhãn ngày trên Home; không phải định dạng gửi API.
handleSearch|Bấm Tìm kiếm|Từ chối thiếu sân bay, hai mã trùng nhau hoặc ngày về trước ngày đi; gọi navigate('SearchFlightResult', payload).|SearchFlightParams gồm tripType, sân bay, ngày, passengers, passengerSummary và seatClass.
openPicker|Ref HTMLInputElement của date input|Nếu có ref thì ưu tiên showPicker(), nếu trình duyệt không hỗ trợ thì gọi click().|Mở lịch của trình duyệt; không dùng trên native.
handleOpenDepartPicker|Bấm chọn ngày đi|Web gọi openPicker(departInputRef); native bật showDepartPicker.|Lịch ngày đi hiện ra, callback chọn ngày cập nhật departDateRaw.
handleOpenReturnPicker|Bấm chọn ngày về|Nếu đang một chiều thì đổi sang khứ hồi; web gọi openPicker(returnInputRef), native bật showReturnPicker.|Mở lịch ngày về và cập nhật chế độ hành trình nếu cần.
SearchFlightResultScreen|Route /SearchFlightResult có query data|Đọc và kiểm tra tham số; quản lý step đi/về, ngày, lựa chọn chuyến, danh sách, lịch giá, lọc và sắp xếp; các effect tải dữ liệu và hủy request cũ.|JSX kết quả; tham số sai thì hiển thị quay lại tìm chuyến, không dựng lựa chọn giả.
changeStep|step = depart hoặc return|Không làm gì nếu step không đổi; nếu đổi thì bật loading và calendarLoading trước khi cập nhật currentStep.|Effect truy vấn chạy lại với đúng hướng sân bay và ngày của step mới.
fetchFlights|dateToFetch, depCode, arrCode, AbortSignal|Không truy vấn nếu tham số tìm kiếm sai hoặc đã hủy; gọi searchFlights với tổng khách/hạng ghế; cập nhật flights và giữ lựa chọn nếu getFlightKey còn tồn tại; lỗi thì xóa danh sách/lựa chọn của chiều hiện tại.|Promise; cập nhật flights, flightError và loading. Mọi callback kiểm tra signal.aborted.
formatTime|ISO datetime có thể thiếu|Thiếu giá trị trả --:--; dùng getHours/getMinutes của Date và thêm số 0 đầu để hiển thị trên danh sách.|Chuỗi giờ HH:mm của thẻ chuyến bay, theo múi giờ môi trường chạy; khác helper flightTime cố định Asia/Ho_Chi_Minh.
formatDuration|Số phút có thể thiếu|Thiếu hoặc không hữu hạn trả --; còn lại floor phút/60 và phần dư phút.|Chuỗi thời lượng dạng 2h 15m trên kết quả tìm kiếm.
formatDateShort|ISO date có thể thiếu|Tách ngày và tháng từ Date, thêm số 0 ở đầu nếu cần.|Nhãn DD/MM.
formatDateWithDay|ISO date có thể thiếu|Tính thứ trong tuần theo bảng DAY_SHORT_NAMES, ghép ngày/tháng.|Nhãn thứ và DD/MM cho chuyến đã chọn.
handleSelectFlight|FlightItem được bấm|Nếu chiều đi thì setSelectedDepartFlight; khứ hồi tự changeStep('return'); nếu chiều về thì setSelectedReturnFlight.|Chọn chuyến trong state cục bộ. Hàm này chưa điều hướng sang FlightDetail.
FlightDetail|data hoặc flightId trên URL|Dùng readRouteData rồi parseFlightDetail; sai dữ liệu thì hiển thị lỗi; hợp lệ thì render FlightDetails với key theo route.|Điểm vào màn chi tiết; key thay đổi khiến state màn con được tạo lại.
FlightDetails|FlightDetailParams|Tạo danh sách chặng từ departureFlight và returnFlight; tính count; gọi useFareSelection để đọc giá/điều kiện mới; useFlightFavorite cho chặng đang xem.|JSX chi tiết chuyến và nút tiếp tục; giá snapshot URL không được dùng làm báo giá hiện hành.
proceed|Bấm tiếp tục ở FlightDetail|Nếu fares.total là null thì dừng; ngược lại navigate('FareSelection', params).|Chuyển nguyên FlightDetailParams sang màn chọn gói.
FareSelection|data hoặc flightId trên URL|Đọc/kiểm tra params; lỗi hiển thị thông báo và nút tìm chuyến; hợp lệ render FareSelectionScreen với key route.|Màn chọn gói vé được reset khi route đổi.
FareSelectionScreen|FlightDetailParams|Tạo counts và legs; dùng useFareSelection; chọn activeLeg; truyền fares.select cho FareOptionCard; mở sheet trợ giúp/so sánh.|JSX các gói, lựa chọn theo từng chặng và thanh tổng giá vé.
handleContinue|Bấm tiếp tục tại FareSelection|Chỉ chạy khi fares.status ready và total khác null. Khứ hồi ở chặng đi thì setActiveLeg(1); khi hoàn tất map selected thành flightId/fareClassId và navigate PassengerInfo.|PassengerInfoParams chỉ chứa flights và passengers, không chứa giá hoặc dữ liệu cá nhân.
PassengerInfo|Query data của route /PassengerInfo|readRouteData rồi parsePassengerInfo; sai hiển thị quay lại; hợp lệ render PassengerForm key=data.|Điểm vào form hành khách.
PassengerForm|PassengerInfoParams|Khởi tạo form khách rỗng bằng createPassengerDrafts; contact lấy từ tài khoản; tải lại gói qua useFareSelection; tải thuế/phí; giữ form và ghế trong state; mở picker khi hợp lệ.|JSX nhập khách/liên hệ; sau xác nhận ghế mới dispatch startBooking và chuyển AdditionalServices.
updatePassenger|index, field của PassengerDraft, value|Map mảng passengers, chỉ thay field của khách đúng index; các khách khác giữ nguyên.|State form khách mới; không gửi server và không đưa PII lên URL.
updateContact|field của ContactDraft, value|Nếu sửa tên liên hệ thì tắt mainContact; gộp field mới vào contact.|State contact mới; effectiveContact sẽ ghép mã điện thoại và tên khách chính khi phù hợp.
openSaved|Bấm danh sách khách đã lưu|Mở sheet saved, xóa lỗi cũ; chưa đăng nhập thì dừng; đã đăng nhập thì gọi getSavedPassengers, lưu saved và xử lý loading/lỗi.|Danh sách SavedPassenger cho sheet; GET /auth/passengers dùng token từ clientApi.
applySaved|SavedPassenger và target trong state|Đối chiếu passengerType với kind tại target; không khớp thì báo lỗi; khớp thì chuyển ngày sinh ISO sang DD/MM/YYYY, tách tên và chép identityNumber vào form.|Cập nhật một hành khách và đóng sheet. Giới tính/quốc tịch vẫn cần đúng theo validation của form.
continueToSeats|Bấm Tiếp tục chọn ghế|Chặn khi gói chưa hợp lệ, thiếu chuyến hoặc thuế chưa ready; validatePassengerForm với ngày bay đầu tiên; lưu errors; không có lỗi thì bật seatPicker.|Hiển thị FlightSeatPicker trong modal, chưa có route mới.
AdditionalServices|Redux state.booking.draft|Thiếu draft thì MissingBooking; chọn chặng/khách đang chỉnh; lấy dịch vụ theo serviceKey; tải thuế/phí bằng useTaxAndFee; tính bookingTotals.|Màn dịch vụ với các lựa chọn độc lập theo khách/chặng.
update|Partial ServiceSelection từ lựa chọn dịch vụ|dispatch updateServices kèm flightId của chặng hiện tại và passengerIndex hiện tại.|bookingSlice cập nhật draft.services; tổng tiền được tính lại khi render.
next|Bấm tiếp tục hoặc callback bỏ qua dịch vụ|Chỉ navigate('BookingConfirmation') khi taxes.status ready.|Chuyển sang tóm tắt, không truyền PII qua URL.
ServiceToggle|label, price, value, onChange|Hiển thị giá dịch vụ và Switch; onValueChange gọi onChange của màn cha.|Callback boolean để cập nhật insurance/priority/meal.
BookingConfirmation|Redux booking draft|Đọc fares/passengers/contact/seats/services; tải lại thuế/phí; dùng bookingTotals; trình bày thông tin và cho sửa khách/dịch vụ hoặc xem sheet chi tiết.|Tóm tắt booking; nút thanh toán chỉ mở sheet thông báo chưa hỗ trợ, chưa POST tạo đơn.
editPassengers|Bấm Sửa tại hành khách hoặc liên hệ|navigate('PassengerInfo', draft.params).|Mở lại form theo mã chuyến/gói và số khách. Code hiện tại khởi tạo form mới, chưa nạp lại PII/ghế từ draft cũ vào form.
ContactRow|label, value, blue|Render một dòng thông tin liên hệ; giá trị cho phép chọn/copy; blue chỉ đổi màu.|JSX dòng họ tên, email hoặc điện thoại.
navigate|name thuộc RootStackParamList và params tùy route|Tra paths[name]; có params thì JSON.stringify vào query data; gọi router.navigate.|Điều hướng Expo Router. AdditionalServices/BookingConfirmation không có params.
readRouteData|string hoặc string[] hoặc undefined|Chỉ nhận một string; JSON.parse trong try/catch; kiểu sai hoặc JSON lỗi trả undefined.|unknown để các hàm parse tiếp tục kiểm tra cấu trúc.
goBack|Bấm quay lại|router.canGoBack() thì router.back(); không có history thì router.replace('/').|Quay lại màn trước hoặc về Home khi mở bằng deep link.
object|unknown|Kiểm tra typeof object, khác null và không phải array.|Type guard Record<string, unknown> cho các hàm parse.
airport|unknown|Phải là object, code gồm 3 chữ hoa A-Z, city và name là string.|boolean/type guard Airport; không kiểm tra sự tồn tại trên database.
date|unknown|Yêu cầu YYYY-MM-DD; parse UTC và so lại toISOString để loại ngày không tồn tại.|boolean/type guard ngày hợp lệ cho navigation.
parseSearchParams|unknown từ readRouteData|Kiểm tra sân bay khác nhau, ngày, tripType; khứ hồi có ngày về không trước ngày đi; cơ cấu khách là số nguyên không âm, người lớn >=1 và em bé <= người lớn; seatClass là string.|SearchFlightParams chuẩn hóa hoặc undefined. Hàm này không áp trần tổng 18 như parsePassengerInfo.
flight|unknown|Kiểm tra các trường cơ bản của FlightItem, hai điểm có airportCode/time; ticket.price là số hữu hạn không âm.|boolean/type guard dùng khi kiểm tra selection từ URL.
parseFlightDetail|unknown|flightId phải là chuỗi không rỗng; cho phép chỉ có flightId; nếu có selection thì kiểm tra departureFlight, search, chuyến về khi khứ hồi và ID chiều đi khớp.|FlightDetailParams hợp lệ hoặc undefined.
parsePassengerInfo|unknown|Chỉ 1-2 chặng; flightId/fareClassId không rỗng, không trùng flightId; cơ cấu khách nguyên không âm, người lớn >=1, em bé <= người lớn và tổng <=18.|PassengerInfoParams chỉ giữ trường cần thiết hoặc undefined.
useAirport|Home mount|Effect chạy fetchAirports và fetchDestinations; đọc destination từ Redux, trả danh sách sân bay và trạng thái tải/lỗi của cả hai nhóm.|airports, loading, error, destinations, destinationsLoading, destinationsError.
fetchAirports|Effect của useAirport|Bật loading; await getAirportList; lưu result.data vào airports; lỗi lưu Error; finally tắt loading.|State sân bay dùng bởi Home và AirportSelectModal.
fetchDestinations|Effect của useAirport|Bật tải/xóa lỗi; gọi getDestinations rồi dispatch setDestinations(data.data); lỗi gán thông báo; finally tắt tải.|Redux danh sách điểm đến trên Home; dữ liệu phụ này không nằm trong booking draft.
useFareSelection|legs gồm flightId/preferredFareId, count|Effect Promise.all getFlightFares cho các chặng; hủy khi đổi deps/unmount; resolveSelectedFare chọn gói theo lựa chọn; quản lý choices/version; trả tổng chỉ khi ready.|status, options, error, selected, select, reload, total; các màn chi tiết/chọn gói/hành khách dùng chung hook này.
select|FlightFare do FareOptionCard chọn|Gộp choices[flightId] = fareClassId.|Lần render sau resolveSelectedFare ưu tiên gói vừa chọn; không lưu Redux booking ở bước này.
useTaxAndFee|FlightFare[] và tổng khách|Tạo key từ tập airline.id duy nhất đã sort; effect tải một request/hãng, truyền signal; loại response cũ; tính calculateLegTaxAndFee cho từng chặng; thiếu ID/cấu hình hoặc lỗi tính thì status error và total null.|status, error, legs, total, reload. Cấu hình ở state hook, không lưu vào draft Redux.
useFlightFavorite|flightId và authenticated|Đã đăng nhập thì effect GET trạng thái, lưu riêng từng ID; khi đổi chặng hủy request; expose toggle và busy/error.|Trạng thái yêu thích của chặng hiện tại; nhánh phụ, không thay đổi giá hoặc dữ liệu booking.
toggle|Bấm trái tim tại FlightDetail|Chưa xác thực hoặc busy thì dừng; bật busy; setFavorite với giá trị đảo; thành công lưu server result, lỗi giữ giá trị trước và thông báo.|favorite/busy/error trong hook; PUT hoặc DELETE endpoint favorite.
getFlightKey|FlightItem|Ghép flightId với fareClassId; nếu thiếu ID gói thì dùng fareClassName.|Khóa nhận diện kết quả tìm kiếm; cùng flightId nhưng khác gói vẫn là hai lựa chọn.
searchFlights|FlightSearchRequest và signal tùy chọn|POST /flights/conditions với body tìm kiếm; yêu cầu status success và data là array; sai cấu trúc ném Error.|Promise<FlightItem[]>; lỗi mạng/backend truyền về màn kết quả.
getFlightCalendar|FlightCalendarRequest và signal|POST /flights/calendar; kiểm tra status success và array.|Promise<FlightCalendarDay[]> gồm date, minPrice có thể null, flightCount.
getFlightFares|flightId, passengers, signal|GET /flights/:flightId/fares với query passengers; encode ID; kiểm tra status success và array.|Promise<FlightFare[]> gồm điều kiện vé/changeFee; nguồn giá mới cho luồng chọn gói.
getAirportList|Home/useAirport gọi|GET /airports; trả response.data của Axios; catch ném lại lỗi.|Envelope AirportResponse, bên trong data là Airport[].
getTaxAndFee|airlineId và signal|GET /airlines/:airlineId/tax-and-fee; encode ID, truyền signal; yêu cầu status 200 và data.airline_id khớp ID yêu cầu.|Envelope TaxAndFeeResponse; tính hợp lệ từng khoản tiền được kiểm tra tiếp ở calculateLegTaxAndFee.
getSavedPassengers|signal tùy chọn|GET /auth/passengers; kiểm tra data.data là array.|SavedPassenger[] cho sheet chọn khách đã lưu; yêu cầu xác thực backend.
getFlightSeats|flightId, signal|GET /flights/:flightId/seats; kiểm tra array.|FlightSeat[] theo hợp đồng cũ. FlightSeatPicker hiện dùng getFlightSeatMap thay vì hàm này.
getFavorite|flightId, signal|GET /flights/:flightId/favorite.|boolean data.data.favorite cho useFlightFavorite.
getFlightSeatMap|flightId, signal|GET /flights/:flightId/seat-map; kiểm tra aircraft, seats array, columnGroups không rỗng, từng nhóm/cột hợp lệ chữ A-Z.|FlightSeatMap gồm hình học cột và tồn ghế; cấu hình sai ném Error.
setFavorite|flightId, favorite boolean|favorite true gọi PUT /flights/:id/favorite; false gọi DELETE cùng URL.|boolean được server trả về; không phải thao tác đặt ghế.
getBaseUrl|Môi trường chạy và EXPO_PUBLIC_API_URL|Ưu tiên URL env, nối /api/v1 nếu cần; web dùng localhost:3000; native tìm hostUri Expo, fallback Android 10.0.2.2 hoặc localhost.|baseURL cho Axios; chỉ mô tả logic, tài liệu không chép giá trị biến môi trường riêng tư.
formatFareMoney|Số tiền|toLocaleString('vi-VN') rồi thêm ký hiệu đồng.|Chuỗi hiển thị VND; không thực hiện quy đổi tiền tệ.
isBusinessFare|FlightFare|Regex business hoặc thương gia trên fareClassName.|boolean để chọn khoang BUSINESS hoặc ECONOMY và nhãn gói.
passengerCount|PassengerCounts|Cộng adults + children + infants.|Tổng khách dùng tải giá và tính vé/thuế; em bé vẫn được tính trong tổng này.
resolveSelectedFare|options, preferredId, count|Lọc gói có availableSeats >= count; ưu tiên ID yêu cầu; nếu không còn thì chọn giá thấp nhất trong nhóm còn đủ chỗ.|FlightFare hoặc undefined. PassengerInfo kiểm tra lại ID trùng gói route, nên không cho lặng lẽ đổi gói.
calculateFareTotal|Mảng fare có thể undefined và count|Mảng rỗng hoặc thiếu bất kỳ chặng nào trả null; còn lại cộng price * count từng chặng.|Tổng giá vé, chưa có ghế, dịch vụ hoặc thuế/phí.
flightTime|ISO datetime|Định dạng giờ/phút với locale vi-VN và timezone Asia/Ho_Chi_Minh.|Chuỗi giờ thống nhất ở các màn chi tiết/booking.
flightDate|ISO datetime|toLocaleDateString với locale vi-VN và timezone Asia/Ho_Chi_Minh.|Chuỗi ngày hiển thị của chuyến bay.
flightDuration|durationMinutes|floor(minutes/60) và minutes%60.|Chuỗi thời lượng giờ/phút.
createPassengerDrafts|PassengerCounts|Tạo đủ form theo thứ tự adult, child, infant; tên/ngày sinh/giấy tờ rỗng, nationality mặc định VN.|PassengerDraft[] mới, không phải dữ liệu lấy từ draft cũ.
fullPassengerName|PassengerDraft|Nếu có surname hoặc givenName thì ghép hai trường rồi trim; nếu chỉ có name thì trim name để tương thích cấu trúc cũ.|Tên đầy đủ cho liên hệ, validation, ghế và tóm tắt.
splitPassengerName|name string từ hồ sơ|Trim và tách theo khoảng trắng; từ đầu là surname, các từ còn lại ghép thành givenName.|Object {surname, givenName}; người dùng cần rà lại theo giấy tờ.
parseBirthday|Chuỗi DD/MM/YYYY|Regex đúng định dạng, đổi sang ISO, parse UTC và so ngược để loại ngày không tồn tại.|YYYY-MM-DD hoặc undefined.
ageOnDate|birthday ISO và travelDate|Tách năm/tháng/ngày; lấy chênh lệch năm và trừ 1 nếu chưa đến sinh nhật.|Tuổi tại ngày bay, phục vụ phân loại khách.
validatePassengerForm|passengers, contact, travelDate|Kiểm tra tên và các field mới, giới tính/quốc tịch, giấy tờ người lớn, ngày sinh/tuổi; adult >=12, child 2-11, infant <2; kiểm tra contact name/email/phone.|Record lỗi theo passengers.i.field hoặc contact.field; rỗng nghĩa là qua validation FE.
seatPosition|FlightSeat|Regex tách số hàng và chữ cột từ seatNumber như 12A.|{row, column} hoặc null nếu số ghế không đúng định dạng.
buildSeatRows|seats và groups cột|Bỏ số ghế sai hoặc cột không thuộc geometry; nhóm theo hàng, sort số tăng; giữ vị trí thiếu bằng null và đánh dấu hàng EXIT_ROW.|Mảng hàng/các nhóm ghế cho CabinSeatMap, không làm dịch chuyển lối đi.
assignSeat|choices, leg, passengerIndex, seat|Từ chối ghế không available, sai khoang hoặc người khác đã chọn trong cùng chặng; bỏ lựa chọn cũ của khách; bấm lại chính ghế đó thì bỏ chọn.|SeatChoice[] mới; giá lấy seat.priceModifier từ dữ liệu ghế.
reconcileSeatChoices|choices, maps mới, legs, passengerIndices|Đối chiếu đúng chặng/ID/khoang, geometry, khách hợp lệ, ghế còn trống; chống trùng ghế và trùng khách/chặng; cập nhật số ghế và giá từ inventory mới.|SeatChoice[] còn hợp lệ; không khóa ghế và không ghi booking server.
seatSelectionComplete|choices, legs, danh sách khách cần ghế|Yêu cầu có chặng và khách; mọi cặp chặng-khách đều có lựa chọn.|boolean dùng khóa nút tiếp tục và xác nhận cuối picker.
seatLocation|seat và groups|Ưu tiên EXIT_ROW; cột ngoài cùng là cửa sổ; rìa nhóm ở lối đi là lối đi; còn lại ghế giữa.|Nhãn vị trí theo geometry hiện tại của máy bay.
emptyServices|Không có tham số|Tạo baggageKg 0, insurance/priority/meal false.|ServiceSelection mặc định mới; không tự thêm dịch vụ tính tiền.
serviceKey|flightId, passengerIndex|Ghép `${flightId}:${passengerIndex}`.|Khóa draft.services cho đúng khách và chặng.
servicePrice|ServiceSelection|Tra giá hành lý trong BAGGAGE_OPTIONS (không tìm thấy về 0); cộng insurance/priority/meal theo SERVICE_PRICES nếu bật.|Giá dịch vụ một khách/một chặng, hiện là danh mục minh họa tại FE.
bookingTotals|BookingDraft, taxAndFees number hoặc null mặc định 0|Cộng giá gói mỗi chặng * tổng khách, tổng giá ghế, dịch vụ của khách không phải infant và chặng hợp lệ; thêm thuế/phí được truyền vào.|{fare,seats,services,taxAndFees,total}; total null khi taxAndFees null. Các màn đã tích hợp đều truyền taxes.total.
calculateLegTaxAndFee|FlightFare, count, TaxAndFee|Kiểm tra ID hãng khớp, currency VND, bốn phí/VAT là số nguyên an toàn không âm, VAT <=100, count/giá vé hợp lệ; VAT làm tròn trên giá vé mỗi khách rồi cộng phí và nhân count.|{flightId,config,count,fixedPerPassenger,vatPerPassenger,total}; thiếu/null hoặc vượt giới hạn thì throw Error.
startBooking|Payload không gồm services của BookingDraft|So JSON params với draft cũ; thay payload mới; cùng params giữ services cũ, khác params reset services {}.|state.booking.draft mới sau khi ghế đã được kiểm tra. Giữ services không có nghĩa PassengerForm tự nạp lại PII cũ.
updateServices|flightId, passengerIndex, changes|Không có draft thì dừng; từ chối index không có, infant, hoặc flightId ngoài fares; gộp changes vào lựa chọn hiện có hoặc emptyServices.|Cập nhật draft.services[serviceKey] bằng reducer Redux Toolkit.
skipServices|Bấm Bỏ qua ở AdditionalServices|Nếu có draft thì gán services = {}.|Xóa toàn bộ dịch vụ bổ sung trước khi next sang tóm tắt.
FlightSeatPicker|fares, passengers, initial, fareTotal, onClose, onConfirm|Lọc infant khỏi danh sách cần ghế; xác định khoang mỗi chặng; tải seat-map; giữ activeLeg/activePassenger/choices; dựng CabinSeatMap; kiểm tra lại trước xác nhận.|Modal chọn ghế; fareTotal do PassengerInfo truyền đã gồm vé và thuế/phí, picker chỉ cộng thêm seatTotal.
choose|FlightSeat được bấm|Đang loading/checking hoặc không có fare thì dừng; xóa lỗi; gọi assignSeat với chặng/khách hiện tại.|State choices mới trong picker.
confirm|Bấm tiếp tục trong picker|Chặn khi chưa complete/đang kiểm tra/tải; GET lại maps mọi chặng; reconcile; thiếu ghế thì báo lỗi và chuyển đến khách/chặng còn thiếu; giá đổi thì yêu cầu rà soát; ổn mới onConfirm(valid).|Callback về PassengerInfo; lỗi mạng hiển thị thử lại; AbortController ngăn cập nhật sau unmount.
Legend|label và variant selected/available/booked/exit/assigned|Chọn icon và style theo variant; render ký hiệu kèm chú giải trạng thái ghế.|JSX chú giải sơ đồ, không tác động lựa chọn.
CabinSeatMap|seats, groups, choices, flightId, passengerIndex, disabled, onChoose|buildSeatRows; tính chiều rộng và lối đi từ groups; cho cuộn ngang khi thiếu chỗ; phân biệt ghế của khách hiện tại, ghế khách khác, ghế không trống.|Bấm ghế khả dụng gọi onChoose(seat), được nối tới choose của FlightSeatPicker.
PassengerField|Props TextInput, label, error, icon, children|Render nhãn, TextInput, icon và thông báo lỗi; chuyển các props/handler tới input.|JSX field dùng chung; callback onChangeText do cha truyền.
BirthdayField|value, onChange, error, travelDate|parseBirthday để đồng bộ lịch; web dùng date input max ngày bay, native dùng DateTimePicker; đổi ngày gọi changeDate/onChange.|Ngày sinh DD/MM/YYYY đưa về PassengerForm.
changeDate|Date từ native picker|Ghép ngày/tháng/năm có số 0 đầu, gọi onChange.|Cập nhật field birthday qua callback cha.
PassengerCard|passenger, index, errors, travelDate, onChange, onNationality|Dựng trường họ/tên/ngày sinh/giới tính/quốc tịch/giấy tờ; lỗi tra theo prefix passengers.index; từng callback phát field và value.|JSX form cho một khách; không tự gọi API, không tự lưu Redux.
countryLabel|Mã quốc tịch|Tra danh mục countries; hiển thị nhãn tương ứng hoặc fallback của mã.|Tên quốc tịch dùng trong field; không xác thực hồ sơ server.
BookingLayout|title, step, total có thể null, count, onContinue, children, footer, label|Dựng header, BookingProgress, vùng nội dung cuộn và FareCheckoutBar; ghi chú tổng chờ thuế nếu total null.|Khung chung AdditionalServices/BookingConfirmation; total null khiến thanh checkout vô hiệu nút.
BookingCard|title, icon, action, children|Render khối nội dung thống nhất và phần tiêu đề tùy chọn.|JSX card trình bày, không quản lý dữ liệu nghiệp vụ.
BookingLink|children text, onPress|Render nút dạng chữ với vùng bấm tối thiểu và accessibilityRole button.|Bấm gọi onPress của cha, ví dụ sửa khách, sửa dịch vụ hoặc thử lại.
PriceRow|label, value, strong|Dùng formatFareMoney hiển thị một dòng giá; strong đổi trọng số font/màu.|JSX dòng phí/tổng; không tự tính tiền.
MissingBooking|Mở màn dịch vụ/tóm tắt khi Redux draft null|Hiển thị thiếu hành trình và nút gọi navigate('Home').|Hướng người dùng tìm lại vé; thường gặp khi reload/deep link trực tiếp.
BookingProgress|active index|Render năm nhãn Hành khách, Chọn ghế, Dịch vụ, Tóm tắt, Thanh toán; tô trạng thái theo index.|Thanh tiến trình chỉ trình bày trạng thái, các bước không tự là link.
TaxAndFeeCard|taxes từ useTaxAndFee và fares|Loading hiện thông báo; error hiện taxes.error và nút taxes.reload; ready render bốn phí/VAT từng chặng nhân count cùng tổng.|JSX chi tiết thuế/phí; không gửi request trực tiếp.
AirportSelectModal|visible, title, airports, excludeCode, onSelect, onClose|Ẩn sân bay có code trùng excludeCode; render danh sách; bấm một sân bay phát onSelect(item).|Home.handleSelectAirport nhận lựa chọn; đóng modal do cha xử lý.
formatPassengerSummary|PassengerCounts|Ghép các nhóm có số lượng >0 thành chuỗi tiếng Việt, fallback 1 Người lớn khi không có nhóm.|Nhãn tóm tắt trên Home và payload tìm kiếm; parseSearchParams không giữ passengerSummary.
PassengerSelectModal|visible, value, onApply, onClose|Không visible trả null; visible render content với key JSON của value.|Mỗi lần mở/đổi giá trị tạo state lựa chọn đúng giá trị cha truyền.
PassengerSelectModalContent|PassengerSelectModalProps|Giữ counts cục bộ; dựng nút tăng/giảm; giới hạn adult+child tối đa 9, người lớn ít nhất 1, infant <= adult.|Chỉ onApply khi xác nhận; đổi nút trong modal chưa lập tức sửa Home.
handleUpdate|Loại khách và delta|Tăng/giảm có ràng buộc; giảm adult có thể hạ infant về adult mới; không cho số âm hoặc vượt hạn mức.|counts mới trong modal số khách.
FlightFilterModal|visible, value, availableAirlines, totalMatchesCount, onApply, onClose|Ẩn trả null; hiện render content với key JSON của value.|Lựa chọn lọc được tạo lại theo state đã áp dụng trước đó.
FlightFilterModalContent|Props bộ lọc|Giữ localFilters; render sắp xếp, hãng, khung giờ, hành lý; onApply chỉ gọi khi xác nhận.|Bộ lọc áp dụng tại SearchFlightResult qua processedFlights, không gọi endpoint lọc riêng.
handleToggleAirline|Tên hãng string|Nếu đã có trong selectedAirlines thì loại bỏ; chưa có thì thêm vào bản sao.|localFilters mới trong modal lọc.
handleReset|Bấm Đặt lại ở modal lọc|Gán localFilters = DEFAULT_FILTER_STATE.|Mới reset bản nháp bộ lọc; cần xác nhận để cập nhật màn kết quả.
FareCheckoutBar|total number/null, count, disabled, label, onContinue, note|Render tổng tạm tính, ghi chú và nút; total null hiển thị dấu gạch; disabled hoặc null khóa nút.|Bấm hợp lệ gọi onContinue do từng màn truyền; component không tự điều hướng.
Benefit|icon, label, value, positive|Render một hàng quyền lợi trong card gói vé.|JSX quyền lợi; không suy đoán giá hoặc gọi API.
FareOptionCard|fare, selected, onSelect|Render giá/quyền lợi API, điều kiện đổi vé; bấm card gọi onSelect(fare); state expanded chỉ mở thêm điều kiện.|FareSelectionScreen nhận lựa chọn qua fares.select.
FareSheet|visible, title, onClose, children|Dựng modal sheet và nút đóng; children do cha quyết định.|JSX sheet dùng cho điều kiện gói, trợ giúp và thông báo thanh toán.
FareComparison|FlightFare[]|Render các cột so sánh giá, hành lý, đổi/hoàn và tồn chỗ từ cùng dữ liệu gói đang xem.|JSX so sánh, không tạo lựa chọn hoặc tính tổng.
FlightSummary|Prop flight có kiểu FlightFare|Render thông tin tóm tắt chuyến, thời gian, sân bay và hãng từ flight.|Component trình bày trong luồng chọn gói; dữ liệu do màn cha tải.
'''
descriptions = {}
for row in rows.strip().splitlines():
    name, inp, logic, output = row.split('|')
    descriptions[name] = (inp, logic, output)

def describe(item):
    name, file = item['name'], item['file']
    if name == 'reload':
        if 'useFareSelection' in file:
            return ('Bấm thử lại tải gói vé', 'Đặt state loading/options rỗng; tăng version để effect getFlightFares chạy lại.', 'Tải lại giá và tồn gói; selections được resolve theo dữ liệu mới.')
        if 'useTaxAndFee' in file:
            return ('Bấm thử lại thuế/phí', 'Đặt state loading với key rỗng rồi tăng attempt; effect tải cấu hình lại.', 'total null trong lúc tải; không giữ tổng hoàn chỉnh khi dữ liệu chưa sẵn sàng.')
        return ('Bấm thử lại sơ đồ ghế', 'Đặt loading, xóa loadError và tăng attempt.', 'Effect tải lại toàn bộ seat-map và reconcile các ghế còn hợp lệ.')
    if name == 'handleConfirm':
        if 'PassengerSelectModal' in file:
            return ('Bấm xác nhận số khách', 'onApply(counts), sau đó onClose().', 'Home nhận passengerCounts mới để dùng cho tìm kiếm.')
        return ('Bấm áp dụng bộ lọc', 'onApply(localFilters), sau đó onClose().', 'SearchFlightResult cập nhật filterState và processedFlights được tính lại.')
    if name not in descriptions:
        raise ValueError(f'Thiếu mô tả: {file}::{name}')
    return descriptions[name]

for item in inventory:
    describe(item)

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin = sec.bottom_margin = Cm(1.7)
sec.left_margin = sec.right_margin = Cm(1.8)
sec.header_distance = sec.footer_distance = Cm(.8)
normal = doc.styles['Normal']
normal.font.name = 'Arial'
normal.font.size = Pt(10)
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.line_spacing = 1.12
for style in ['Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3']:
    doc.styles[style].font.name = 'Arial'
for name, size, color in [('Heading 1', 17, '17365D'), ('Heading 2', 13, '245A81'), ('Heading 3', 11, '17365D')]:
    st = doc.styles[name]
    st.font.size = Pt(size)
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.keep_with_next = True
    st.paragraph_format.space_before = Pt(10)
    st.paragraph_format.space_after = Pt(5)
header = sec.header.paragraphs[0]
header.text = 'BOOKING FLIGHT APP  /  LUỒNG FRONTEND'
header.style = 'Caption'
header.runs[0].font.color.rgb = RGBColor.from_string('536F97')
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
footer.add_run('Đối chiếu mã nguồn 01/11/2026  •  Trang ')
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)
for r in footer.runs: r.font.size = Pt(8)

def p(text='', bold_label=None):
    para = doc.add_paragraph()
    if bold_label:
        para.add_run(bold_label + ' ').bold = True
    para.add_run(text)
    return para

def code(text):
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(4)
    para.paragraph_format.space_after = Pt(7)
    pr = para._p.get_or_add_pPr()
    shade = OxmlElement('w:shd'); shade.set(qn('w:fill'), 'F0F4FA'); pr.append(shade)
    run = para.add_run(text)
    run.font.name = 'Consolas'; run.font.size = Pt(8.2)
    return para

def table(headers, data):
    t = doc.add_table(rows=1, cols=len(headers)); t.style = 'Light Shading Accent 1'
    t.autofit = False
    if len(headers) == 4:
        widths = [.8, 4.5, 10.7, 1.2]
    elif len(headers) == 3:
        widths = [3.1, 6.0, 8.1]
    elif 'SHA-256' in headers[-1]:
        widths = [12.4, 4.8]
    elif headers[0] == 'Chương':
        widths = [1.6, 15.6]
    else:
        widths = [5.2, 12.0]
    for col, width in zip(t.columns, widths): col.width = Cm(width)
    for cell, text in zip(t.rows[0].cells, headers): cell.text = text
    repeat = OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for values in data:
        cells = t.add_row().cells
        for c, text in zip(cells, values):
            c.text = str(text)
            for para in c.paragraphs:
                para.paragraph_format.space_after = Pt(4)
                for run in para.runs: run.font.size = Pt(8.5)
        trpr = t.rows[-1]._tr.get_or_add_trPr()
        trpr.append(OxmlElement('w:cantSplit'))
    for row in t.rows:
        for cell, width in zip(row.cells, widths): cell.width = Cm(width)
    doc.add_paragraph()
    return t

chapter_count = 0
def chapter(title):
    global chapter_count
    if chapter_count: doc.add_page_break()
    chapter_count += 1
    doc.add_heading(title, level=1)

doc.add_heading('LUỒNG FRONTEND\nTỪ TÌM VÉ ĐẾN TÓM TẮT BOOKING', 0)
doc.add_paragraph('Tài liệu tra cứu theo từng file, từng hàm và callback', 'Subtitle')
p('Dự án: BookingFlight_App | Nền tảng: Expo / React Native | Ngày đối chiếu: 01/11/2026, Asia/Saigon.')
p(f'Phân tích {len(set(x["file"] for x in inventory))} file nghiệp vụ/UI và {len(inventory)} hàm có tên trong phạm vi. Các effect, callback JSX và phép tính useMemo quan trọng được giải thích riêng; không coi setter React hay callback map/filter là hàm nghiệp vụ độc lập.')
p('Tài liệu mô tả code đang có, không khẳng định mọi nghiệp vụ đã kết nối backend. Dịch vụ bổ sung còn giá minh họa; chọn ghế chưa khóa chỗ; bước tóm tắt chưa tạo đơn và chưa thanh toán.')
doc.add_heading('Cách đọc', 1)
p('Đọc chương 1–3 để hiểu đường đi và dữ liệu; chương 4–10 để theo từng màn/hook/API; chương 11 để hiểu quy tắc tính tiền và lỗi; phụ lục để kiểm tra lại vị trí mã nguồn.')
p('Mỗi mục hàm có: vị trí file và dòng, đầu vào/tác nhân, xử lý, đầu ra/tác động. Dải dòng là snapshot tại lúc xuất tài liệu; sẽ thay đổi khi sửa code. Các đường dẫn tính từ thư mục gốc dự án.')
table(['Chương', 'Nội dung'], [
 ('1', 'Sơ đồ tổng thể và đường dẫn route'), ('2', 'Hợp đồng dữ liệu và nơi lưu state'),
 ('3', 'Chuỗi gọi hàm từ đầu đến cuối'), ('4', 'Home, modal tìm kiếm và useAirport'),
 ('5', 'Kết quả tìm kiếm và bộ lọc'), ('6', 'Chi tiết chuyến, chọn gói, hook giá'),
 ('7', 'Thông tin hành khách và kiểm tra form'), ('8', 'Chọn ghế, sơ đồ và đối soát tồn ghế'),
 ('9', 'Dịch vụ, Redux draft, tóm tắt'), ('10', 'Thuế/phí, API, navigation và khung UI'),
 ('11', 'Công thức, tình huống lỗi và giới hạn hiện tại'), ('12', 'Danh mục hàm và đối chiếu nguồn')
])

chapter('1. Sơ đồ tổng thể và route')
font_path = 'C:/Windows/Fonts/arial.ttf'
font = ImageFont.truetype(font_path, 23)
small = ImageFont.truetype(font_path, 18)
img = Image.new('RGB', (1350, 770), '#FFFFFF'); draw = ImageDraw.Draw(img)
boxes = [
 ('Home', 'handleSearch()'), ('SearchFlightResult', 'fetchFlights() / handleSelectFlight()'),
 ('FlightDetail', 'FlightDetails() / proceed()'), ('FareSelection', 'fares.select() / handleContinue()'),
 ('PassengerInfo', 'PassengerForm() / continueToSeats()'), ('FlightSeatPicker (modal)', 'choose() / confirm() / onConfirm()'),
 ('AdditionalServices', 'update() / next()'), ('BookingConfirmation', 'bookingTotals() / render')
]
positions = [(35,30),(710,30),(35,215),(710,215),(35,400),(710,400),(35,585),(710,585)]
for (title, sub), (x,y) in zip(boxes,positions):
    draw.rounded_rectangle((x,y,x+600,y+135),radius=16,fill='#F0F5FF',outline='#2864FF',width=3)
    draw.text((x+20,y+24),title,font=font,fill='#17365D')
    draw.text((x+20,y+73),sub,font=small,fill='#536F97')
for i in [0,2,4,6]:
    x,y=positions[i]; draw.line((x+600,y+65,x+660,y+65),fill='#2864FF',width=4)
    draw.polygon([(x+660,y+65),(x+647,y+57),(x+647,y+73)],fill='#2864FF')
for i in [1,3,5]:
    x,y=positions[i]; target_y=positions[i+1][1]
    draw.line([(x+300,y+135),(x+300,y+160),(15,y+160),(15,target_y+65),(35,target_y+65)],fill='#536F97',width=3)
    draw.polygon([(35,target_y+65),(23,target_y+57),(23,target_y+73)],fill='#536F97')
diagram = WORK/'flow.png'; img.save(diagram)
doc.add_picture(str(diagram),width=Cm(17.2))
p('FlightSeatPicker là modal bên trong PassengerInfo, không có file route src/app/FlightSeatPicker.tsx. Màn tóm tắt thực tế mang tên BookingConfirmation.')
route_rows=[]
for route, wrapper, screen in [
 ('/', 'app/(tabs)/index.tsx', 'screens/home/Home.tsx'),
 ('/SearchFlightResult','app/SearchFlightResult.tsx','screens/search/SearchFlightResult.tsx'),
 ('/FlightDetail','app/FlightDetail.tsx','screens/flight/FlightDetail.tsx'),
 ('/FareSelection','app/FareSelection.tsx','screens/flight/FareSelection.tsx'),
 ('/PassengerInfo','app/PassengerInfo.tsx','screens/booking/PassengerInfo.tsx'),
 ('/AdditionalServices','app/AdditionalServices.tsx','screens/booking/AdditionalServices.tsx'),
 ('/BookingConfirmation','app/BookingConfirmation.tsx','screens/booking/BookingConfirmation.tsx')]:
    route_rows.append((route,'fe/src/'+wrapper,'fe/src/'+screen))
table(['Route', 'File điểm vào', 'File xử lý màn hình'],route_rows)
p('Phần lớn wrapper re-export default từ screen. SearchRoute ở app/SearchFlightResult.tsx đọc data và gắn key=data để tạo lại state màn kết quả khi tìm hành trình khác. Root layout/provider là hạ tầng bao các màn, không phải một bước chọn vé.')

chapter('2. Dữ liệu truyền và nơi lưu')
table(['Giai đoạn','Dữ liệu chính','Nơi lưu / cách chuyển'],[
 ('Home → kết quả','SearchFlightParams: tripType, departure, arrival, departDate, returnDate, passengers, seatClass','State Home → navigate() → JSON trong query data'),
 ('Kết quả → chi tiết → gói','FlightDetailParams: flightId; selection chứa chuyến đi/về và search','URL có snapshot chuyến; màn sau dùng ID tải giá mới'),
 ('Chọn gói → hành khách','PassengerInfoParams: flights[{flightId,fareClassId}], passengers','URL chỉ có mã chuyến/gói và số khách'),
 ('Nhập form / chọn ghế','PassengerDraft[], ContactDraft, SeatChoice[]','useState trong PassengerForm/FlightSeatPicker'),
 ('Xác nhận ghế → dịch vụ','BookingDraft: params, fares, passengers, contact, seats, services','dispatch(startBooking()) → state.booking.draft trong RAM'),
 ('Dịch vụ → tóm tắt','Cùng BookingDraft; services theo flightId:passengerIndex','Đọc/ghi Redux; route không có payload'),
 ('Thuế/phí','Cấu hình từng airlineId, tổng theo chặng','State của useTaxAndFee tại từng màn; không phải field của Redux draft')])
code('BookingDraft = {\n  params: { flights: [{ flightId, fareClassId }], passengers: counts },\n  fares: FlightFare[],\n  passengers: PassengerDraft[],\n  contact: { name, email, phone },\n  seats: [{ flightId, passengerIndex, seatId, seatNumber, price }],\n  services: { "flightId:passengerIndex": { baggageKg, insurance, priority, meal } }\n}')
p('PassengerDraft gồm kind, name, surname, givenName, gender, nationality, birthday và identity. birthday của form là DD/MM/YYYY. FlightFare bao gồm dữ liệu FlightItem và ticket.fareClassId/changeFee. airline.id được backend thêm để tra thuế/phí theo hãng.')
p('Redux không lưu riêng một total cố định. bookingTotals tính lại từ draft và taxes.total để tránh tổng bị lệch khi sửa dịch vụ. Reload app làm mất booking draft. Logout auth/resetAuth cũng reset draft về null.')
p('Luồng Sửa từ tóm tắt quay về PassengerInfo bằng draft.params. Hiện PassengerForm tạo form mới từ số khách/tài khoản, chưa hydrate passengers/contact/seats từ draft. Vì vậy không nên hiểu nút Sửa là khôi phục đầy đủ dữ liệu nhập trước đó.')

chapter('3. Chuỗi gọi hàm theo thao tác người dùng')
chains = [
 ('3.1 Khởi động tìm kiếm','Home() → useAirport() → effect → fetchAirports() → getAirportList() → clientApi.get("/airports"). Nhánh song song fetchDestinations() phục vụ nội dung điểm đến trên Home.'),
 ('3.2 Gửi tiêu chí','Home.handleSearch() → navigate("SearchFlightResult", payload) → router.navigate() → SearchRoute() → SearchFlightResultScreen() → readRouteData() → parseSearchParams().'),
 ('3.3 Lấy kết quả','effect theo activeDate/currentStep → fetchFlights() → searchFlights() → POST /flights/conditions → setFlights(). Effect lịch giá gọi getFlightCalendar() → POST /flights/calendar.'),
 ('3.4 Chọn chuyến','onPress thẻ chuyến → handleSelectFlight(flight) → lưu chiều đi; khứ hồi chuyển return và tải chiều về. Bấm Tiếp tục sau khi đủ chặng → callback JSX tại màn kết quả → navigate("FlightDetail", selection).'),
 ('3.5 Xem chi tiết','FlightDetail() → FlightDetails() → useFareSelection() → getFlightFares() → resolveSelectedFare(). Bấm tiếp tục → proceed() → navigate("FareSelection", params).'),
 ('3.6 Chọn gói','FareSelection() → FareSelectionScreen() → useFareSelection(). FareOptionCard.onPress → onSelect(fare) → fares.select(). Tiếp tục → handleContinue() → nếu cần chuyển chặng về; cuối cùng navigate("PassengerInfo", IDs/counts).'),
 ('3.7 Nhập khách','PassengerInfo() → PassengerForm() → createPassengerDrafts(). PassengerCard.onChange → updatePassenger(); contact.onChangeText → updateContact(). useFareSelection() tải gói đã chọn và useTaxAndFee() tải cấu hình phí.'),
 ('3.8 Mở chọn ghế','FareCheckoutBar.onContinue → continueToSeats() → validatePassengerForm() → setSeatPicker(true) → FlightSeatPicker().'),
 ('3.9 Chọn/xác nhận ghế','FlightSeatPicker effect → getFlightSeatMap(). CabinSeatMap.onChoose → choose() → assignSeat(). FareCheckoutBar.onContinue → confirm() → getFlightSeatMap() lần nữa → reconcileSeatChoices() → seatSelectionComplete() → onConfirm(valid).'),
 ('3.10 Tạo draft','Callback onConfirm trong PassengerInfo → setSeatChoices()/đóng modal → dispatch(startBooking({params,fares,passengers,contact,seats})) → navigate("AdditionalServices").'),
 ('3.11 Chọn dịch vụ','AdditionalServices() đọc draft → onPress/onValueChange → update(changes) → dispatch(updateServices()) → serviceKey()/emptyServices() → draft.services mới → bookingTotals().'),
 ('3.12 Tóm tắt','next() → navigate("BookingConfirmation") → BookingConfirmation() đọc draft → useTaxAndFee() → bookingTotals(draft,taxes.total) → render. Bấm thanh toán chỉ setSheet("payment").')]
for title,text in chains:
    doc.add_heading(title,2); p(text)

# Các chương chi tiết dùng inventory AST để vị trí hàm khớp source thực tế.
groups = [
 ('4. Home và các lựa chọn tìm kiếm', ['screens/home/Home.tsx','hook/useAirport.ts','components/flight/AirportSelectModal.tsx','components/flight/PassengerSelectModal.tsx']),
 ('5. Kết quả tìm kiếm và bộ lọc', ['screens/search/SearchFlightResult.tsx','components/flight/FlightFilterModal.tsx']),
 ('6. Chi tiết chuyến và chọn gói vé', ['screens/flight/FlightDetail.tsx','screens/flight/FareSelection.tsx','hook/useFareSelection.ts','hook/useFlightFavorite.ts','utils/fare.ts','components/flight/fares/FareOptionCard.tsx','components/flight/fares/FareSheet.tsx','components/flight/fares/FlightSummary.tsx']),
 ('7. Hành khách, liên hệ và validation', ['screens/booking/PassengerInfo.tsx','utils/passengerForm.ts','components/booking/PassengerFields.tsx']),
 ('8. Chọn ghế và kiểm tra tồn ghế', ['components/booking/FlightSeatPicker.tsx','components/booking/CabinSeatMap.tsx','utils/seatMap.ts']),
 ('9. Dịch vụ, Redux draft và tóm tắt', ['screens/booking/AdditionalServices.tsx','store/slices/bookingSlice.ts','utils/booking.ts','screens/booking/BookingConfirmation.tsx']),
 ('10. Thuế/phí, API, navigation và UI dùng chung', ['hook/useTaxAndFee.ts','utils/taxAndFee.ts','api/flight.api.ts','api/airport.api.ts','api/bookingOptions.api.ts','api/clientApi.ts','navigation/routes.ts','navigation/validation.ts','components/booking/BookingLayout.tsx','components/booking/BookingProgress.tsx','components/booking/TaxAndFeeCard.tsx','components/flight/fares/FareCheckoutBar.tsx'])
]

special = {
 'screens/search/SearchFlightResult.tsx': [
  ('Callback effect tải chuyến', 'Phụ thuộc activeDate, currentStep, cặp sân bay hiện tại, fetchFlights và reloadVersion. Tạo AbortController; gọi fetchFlights; cleanup abort. Ngày/hướng thay đổi luôn tải dữ liệu của chiều hiện tại.'),
  ('Callback effect lịch giá', 'nearbyDates tạo dải -2 đến +4 ngày quanh activeDate. Effect gọi getFlightCalendar với khoảng này, tổng khách và hạng ghế. Lỗi lịch không tự thay thế danh sách chuyến bằng dữ liệu giả.'),
  ('processedFlights / callback useMemo', 'Lọc theo hãng, khung giờ và có hành lý ký gửi; sắp giá tăng hoặc giờ tăng/giảm. quickSort direct không có nhánh lọc nối chuyến riêng trong phép tính này; không suy diễn có xử lý chuyến nối.'),
  ('Callback onPress đổi ngày', 'Bật tải; xóa lựa chọn liên quan. Đổi ngày đi sẽ xóa cả chuyến về đã chọn; nếu ngày đi mới vượt ngày về thì đẩy ngày về theo ngày đi.'),
  ('Callback onPress Tiếp tục', 'Nếu khứ hồi và vẫn ở depart thì changeStep(return). Ngược lại kiểm tra loading/error/đủ chuyến rồi navigate FlightDetail với selection và search cập nhật. Đây là callback JSX, không có tên handleContinue trong file này.')],
 'screens/booking/PassengerInfo.tsx': [
  ('validFares / loadedFares / effectiveContact', 'validFares yêu cầu hook ready và từng fareClassId đúng ID route. loadedFares bỏ phần tử undefined. effectiveContact lấy tên khách đầu khi mainContact bật và ghép dialCode nếu phone chưa có dấu +.'),
  ('Callback onConfirm của FlightSeatPicker', 'Nhận choices đã đối soát; lưu seatChoices, đóng picker, dispatch startBooking với params/loadedFares/passengers/effectiveContact/seats; sau đó navigate AdditionalServices. Đây là điểm gom dữ liệu booking vào Redux.'),
  ('Callback chọn mã nước/quốc tịch/khách đã lưu', 'Các callback cập nhật dialCode hoặc updatePassenger theo target và đóng sheet. Chọn khách lưu gọi applySaved, vẫn cần rà giới tính/quốc tịch theo form.')],
 'components/booking/FlightSeatPicker.tsx': [
  ('Effect tải và reconcile ban đầu', 'Promise.all getFlightSeatMap cho mọi fare; khi hoàn tất lưu inventory và reconcileSeatChoices(initial/current choices). Cleanup hủy request. Một effect riêng hủy confirmRequest khi unmount.'),
  ('Callback chọn chặng/khách', 'setActiveLeg hoặc setActivePassenger để chỉnh đúng cặp; infant bị loại khỏi seatedPassengers. Khoang được xác định bằng isBusinessFare. Các cặp đã chọn vẫn giữ trong choices.'),
  ('Callback onChoose của CabinSeatMap', 'Được truyền từ FlightSeatPicker là choose; ô ghế kiểm tra disabled, available và quyền chọn trước khi phát seat. Nút chọn trong vùng chi tiết cũng gọi choose(currentSeat).')],
 'screens/booking/AdditionalServices.tsx': [
  ('Callbacks dịch vụ', 'Bấm hành lý gọi update({baggageKg}); Switch bảo hiểm/ưu tiên/suất ăn phát boolean qua ServiceToggle rồi update({insurance/priority/meal}). Giá lấy BAGGAGE_OPTIONS/SERVICE_PRICES tại FE.'),
  ('Callback Bỏ qua dịch vụ', 'Chỉ hiển thị khi taxes ready. dispatch(skipServices()) xóa tất cả extras rồi next(). Không xóa vé, khách, ghế, liên hệ hoặc thuế/phí.')],
 'screens/booking/BookingConfirmation.tsx': [
  ('Callback sửa dịch vụ', 'navigate AdditionalServices không truyền tham số; màn dịch vụ đọc lại cùng draft Redux.'),
  ('Callback Chi tiết chuyến', 'setDetail(fare) mở FareSheet với dữ liệu chặng; onClose setDetail(null). Không phải route FlightDetail ở giai đoạn trước.'),
  ('Callback Tiếp tục thanh toán', 'Chỉ khi taxes ready mới setSheet(payment). Modal cho biết chưa tạo booking, giữ ghế hoặc trừ tiền; không gọi API thanh toán.'),
  ('Callbacks điều khoản/bảo mật', 'setSheet(terms/privacy) mở nội dung; onClose setSheet(null). Không thay đổi draft.')],
 'hook/useFareSelection.ts': [
  ('Effect tải gói', 'Deps legs/count/version. Promise.all tải từng flightId; ready giữ options. Lỗi đặt error/options rỗng. Cleanup abort và mọi callback bỏ qua signal đã hủy.'),
  ('selected / callback useMemo', 'Mỗi leg gọi resolveSelectedFare với choices[flightId] ưu tiên hơn preferredFareId; resolve có fallback gói giá thấp nhất. total chỉ tính khi state ready.')],
 'hook/useTaxAndFee.ts': [
  ('Effect tải cấu hình', 'Deps key/attempt; key dựa trên tập hãng duy nhất nên thay dịch vụ hoặc số khách không tự gọi lại cấu hình. Promise.all GET từng hãng với chung signal. Khi đổi hãng/unmount thì abort, response cũ không ghi đè state.'),
  ('Tính dẫn xuất lúc render', 'Nếu state.key không khớp key hiện tại thì coi loading. Thiếu mã hãng thì error. Ready map fares qua calculateLegTaxAndFee rồi cộng tổng; lỗi/null/số không an toàn đưa total về null. Cùng hãng nhiều chặng vẫn tính phí trên từng chặng.')],
 'api/clientApi.ts': [
  ('Khởi tạo clientApi', 'axios.create với baseURL từ getBaseUrl, timeout 10000 ms và Content-Type application/json. Các đường dẫn API trong tài liệu được ghi tương đối với /api/v1.'),
  ('Callback request interceptor', 'Lazy require store, đọc auth.token; có token thì gắn Authorization: Bearer token. Nếu đọc state thất bại vẫn trả request; callback lỗi trả Promise.reject.'),
  ('Callback response interceptor', 'Thành công trả response. Với 401 ngoài login/logout, chỉ resetAuth khi token request đúng token đang dùng, rồi clearAuth. 401 của token cũ không đăng xuất phiên mới; 403 không tự reset. Sau xử lý vẫn Promise.reject(error).')],
 'store/slices/bookingSlice.ts': [
  ('Callback extraReducers', 'builder.addCase(auth/resetAuth, () => initialState) xóa draft khi đăng xuất/hết phiên. startBooking và updateServices là reducers đồng bộ; không phải network request.')]
}

documented = []
for chapter_title, files in groups:
    chapter(chapter_title)
    for file in files:
        items = [x for x in inventory if x['file'] == 'fe/src/'+file]
        doc.add_heading(file, 2)
        for idx, item in enumerate(items, 1):
            inp, logic, output = describe(item)
            documented.append((item['file'],item['name'],item['start']))
            doc.add_heading(f'{item["name"]}()', 3)
            loc = p(f'{item["file"]}:{item["start"]}–{item["end"]}')
            for run in loc.runs: run.font.size = Pt(8); run.font.color.rgb = RGBColor.from_string('667085')
            p(inp, 'Đầu vào / khi chạy:')
            p(logic, 'Xử lý:')
            p(output, 'Đầu ra / tác động:')
            # Calls được lấy tự động; loại React/render helpers thông thường để dễ lần luồng.
            calls = [c for c in item['calls'] if not c.startswith(('set','use','Math.','Number.','JSON.','Object.','Array.')) and '.' not in c and c not in ('Date','Error','String','Boolean','Promise','require')]
            if calls:
                p(', '.join(calls[:12]) + (f' (và {len(calls)-12} lời gọi khác)' if len(calls)>12 else ''), 'Hàm xuất hiện trong thân/callback:')
        for title, text in special.get(file,[]):
            doc.add_heading(title,3); p(text)

assert len(documented) == len(inventory), (len(documented),len(inventory))

chapter('11. Công thức, kiểm soát lỗi và giới hạn')
doc.add_heading('11.1 Cách cộng tiền qua từng bước',2)
table(['Bước', 'Tổng tiền đang hiển thị'],[
 ('Kết quả / chi tiết / chọn gói','Chỉ giá vé các chặng × tổng khách; chưa cộng thuế/phí.'),
 ('Thông tin hành khách','Giá vé + thuế/phí + ghế đã chọn nếu có.'),
 ('Modal chọn ghế','fareTotal cha truyền = giá vé + thuế/phí; picker cộng seatTotal.'),
 ('Dịch vụ / tóm tắt','bookingTotals(draft, taxes.total) = vé + ghế + dịch vụ + thuế/phí.')])
code('fixedPerPassenger = admin_fee + airport_fee + security_fee + fuel_surcharge\nvatPerPassenger   = round(ticket.price * vat_percent / 100)\ntaxPerLeg         = (fixedPerPassenger + vatPerPassenger) * passengerCount\ntaxAndFees        = tổng taxPerLeg của mọi chặng\ntotal             = fare + seats + services + taxAndFees')
p('Công thức áp dụng cùng phí và VAT cho người lớn/trẻ em/em bé theo lựa chọn đã thống nhất. Giá vé hiện cũng nhân tổng khách gồm infant; dịch vụ bổ sung và ghế riêng loại infant. Đây là hành vi hiện tại, chưa có bảng giá/miễn giảm theo nhóm tuổi từ hãng.')
p('Ví dụ kiểm tra số học (không phải báo giá thực): vé 1.000.000 VND, bốn phí cộng 200.000 VND, VAT 8%, 3 khách một chặng → VAT mỗi khách 80.000; thuế/phí chặng 840.000; vé + thuế = 3.840.000 trước ghế và dịch vụ. Với vé 1.000.007, VAT mỗi khách round(80.000,56) = 80.001, rồi mới nhân số khách.')
p('Các trường phí/VAT phải đủ số nguyên an toàn, không âm, VAT không quá 100 và tiền tệ VND. null nghĩa chưa cấu hình, không được tự coi bằng 0. Hai cấu hình cùng airline ở backend trả 409; không có/không hoạt động trả 404.')
doc.add_heading('11.2 Các điểm chặn chuyển bước',2)
table(['Tình huống','Hành vi FE'],[
 ('Tham số URL sai hoặc thiếu','Parser trả undefined; màn hiện lỗi/quay lại, không dựng dữ liệu giả.'),
 ('Không tải được chuyến/gói','Hiện error và thử lại; thiếu gói làm total null.'),
 ('Gói được chọn không còn đúng ID ở PassengerInfo','validFares false, không mở picker.'),
 ('Thông tin khách/liên hệ sai','validatePassengerForm trả lỗi field, không mở chọn ghế.'),
 ('Thuế/phí lỗi hoặc thiếu','TaxAndFeeCard hiện lỗi/thử lại; tổng hoàn chỉnh là null; checkout khóa nút, skip dịch vụ ẩn.'),
 ('Ghế vừa hết hoặc bị khóa','confirm loại ghế sai bằng reconcile; báo lỗi và hướng về cặp chặng-khách còn thiếu.'),
 ('Phụ phí ghế vừa thay đổi','Cập nhật choices theo giá mới; yêu cầu người dùng xem lại và bấm tiếp tục lần nữa.'),
 ('Đi thẳng dịch vụ/tóm tắt mà draft null','MissingBooking yêu cầu quay lại tìm vé.'),
 ('Thay chặng khi request còn chạy','Các hook giá/thuế/ghế dùng AbortController để bỏ qua response cũ.'),
 ('401 của phiên hiện tại','clientApi resetAuth; bookingSlice extraReducers xóa draft; lỗi request vẫn trả về nơi gọi.')])
doc.add_heading('11.3 Dữ liệu nào đã thật, phần nào còn thiếu',2)
p('Đã nối backend: tìm chuyến, lịch giá, gói vé, sân bay, sơ đồ/tồn ghế, khách đã lưu, yêu thích và cấu hình thuế/phí. Giá dịch vụ bổ sung BAGGAGE_OPTIONS/SERVICE_PRICES vẫn được định nghĩa tại FE; chưa có thao tác mua dịch vụ thật.')
p('Chưa có trong luồng này: API tạo booking, transaction kiểm tra giá/tồn chỗ cuối, giữ ghế, tạo mã đặt chỗ, thanh toán hoặc phát hành vé. Các lần GET kiểm tra ghế không chống được người khác đặt ghế ngay sau đó; backend tạo booking phải chịu trách nhiệm xác nhận cuối.')
p('Cần lưu ý khi dùng chức năng Sửa: draft còn trong Redux nhưng PassengerForm hiện tạo mới dữ liệu nhập; việc giữ services của startBooking chỉ dựa vào params trùng JSON. Tài liệu không thay đổi hành vi này.')
p('Mức kiểm chứng của tài liệu: đọc và lập chỉ mục source snapshot; nội dung mô tả chức năng từ source. Đây không phải biên bản chạy thử UI trên điện thoại hoặc xác nhận dữ liệu production.')

chapter('12. Danh mục tra cứu và đối chiếu nguồn')
p(f'Tổng số hàm có tên đã mô tả: {len(inventory)}. Cùng tên reload hoặc handleConfirm có thể xuất hiện ở các file khác nhau; luôn tra kèm đường dẫn. Chỉ mục AST lấy cả hàm lồng nhau và reducer methods; effect/callback JSX quan trọng được mô tả tại chương tương ứng.')
index_rows = [(str(i),x['name']+'()',x['file'].replace('fe/src/',''),str(x['start'])) for i,x in enumerate(inventory,1)]
table(['STT','Hàm','File trong fe/src','Dòng đầu'],index_rows)
doc.add_heading('12.1 File hợp đồng/hạ tầng đọc kèm',2)
table(['File','Vai trò'],[
 ('fe/src/navigation/types.ts','SearchFlightParams, FlightDetailParams, PassengerInfoParams, RootStackParamList.'),
 ('fe/src/store/index.ts','configureStore gắn booking reducer; useAppDispatch() bọc useDispatch; useAppSelector là typed alias của useSelector.'),
 ('fe/src/app/_layout.tsx','Hạ tầng layout/provider bao route; không phải nơi gom booking payload.'),
 ('fe/src/app/SearchFlightResult.tsx','SearchRoute đọc data và key màn kết quả; các route booking khác re-export screen.'),
 ('fe/src/api/destination.api.ts','Nhánh phụ lấy điểm đến trên Home, không tham gia giá booking.'),
 ('fe/tests/navigation.test.cjs','Có test route, lựa chọn gói, form, ghế, Redux booking, công thức thuế, API và hủy/retry request thuế.'),
 ('be/src/models/flight.model.ts','Nguồn phía server bổ sung airline.id trong dữ liệu chuyến/gói vé.'),
 ('be/docs/tax-and-fee.md','Hợp đồng endpoint cấu hình thuế/phí theo hãng và công thức FE đã chọn.')])
doc.add_heading('12.2 Snapshot các file chính',2)
hash_rows=[]
for file in dict.fromkeys(x['file'] for x in inventory):
    raw=(ROOT/file).read_bytes()
    hash_rows.append((file.replace('fe/src/',''),hashlib.sha256(raw).hexdigest()[:16]))
table(['File trong fe/src','SHA-256 rút gọn (16 ký tự)'],hash_rows)
p('Hash giúp xác định source đã thay đổi sau lúc xuất. Muốn cập nhật tài liệu: chạy node exports/booking-flow/index-functions.cjs rồi python exports/booking-flow/build_docx.py. Nội dung diễn giải được biên soạn theo source; khi thay nghiệp vụ cần cập nhật phần mô tả trong script, không chỉ chạy lại chỉ mục.')

doc.core_properties.title = 'Luồng FE Booking – Chi tiết từng hàm'
doc.core_properties.subject = 'Tìm kiếm vé → Chọn chuyến/gói → Hành khách → Ghế → Dịch vụ → Tóm tắt'
doc.core_properties.author = 'BookingFlight_App'
doc.core_properties.keywords = 'frontend, booking, Expo, React Native, luồng dữ liệu, tax and fee'
doc.save(OUT)

# Kiểm tra tệp Word và độ phủ nội dung sau khi xuất.
reopened = Document(OUT)
text = '\n'.join(p.text for p in reopened.paragraphs)
for required in ['handleSearch()', 'fetchFlights()', 'continueToSeats()', 'confirm()', 'startBooking()', 'updateServices()', 'calculateLegTaxAndFee()', 'BookingConfirmation()']:
    assert required in text, required
with ZipFile(OUT) as archive:
    assert archive.testzip() is None
    assert 'word/media/image1.png' in archive.namelist()
summary = {'output': str(OUT), 'bytes': OUT.stat().st_size, 'functions':len(inventory),
           'source_files':len(set(x['file'] for x in inventory)), 'paragraphs':len(reopened.paragraphs),
           'tables':len(reopened.tables), 'word_count_approx':len(text.split())}
(WORK/'validation.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
