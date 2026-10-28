# SkyJourney

SkyJourney là dự án ứng dụng đặt vé máy bay, gồm ứng dụng React Native và backend API sử dụng Node.js. Dự án tập trung vào tìm kiếm chuyến bay, lựa chọn gói vé, nhập thông tin hành khách và chọn ghế theo sơ đồ tàu bay.

Ứng dụng đang trong quá trình phát triển. Một số màn hình sử dụng dữ liệu mẫu; luồng đặt chỗ và thanh toán chưa được tích hợp hoàn chỉnh.

## Chức năng

| Nhóm chức năng | Phạm vi hiện tại |
| --- | --- |
| Tài khoản | Đăng ký, đăng nhập bằng email hoặc số điện thoại, đăng xuất, xem và cập nhật hồ sơ, đổi mật khẩu. |
| Tìm kiếm chuyến bay | Tra cứu sân bay, tìm chuyến một chiều hoặc khứ hồi, lọc kết quả và xem lịch giá qua API. |
| Gói vé | Tải giá vé, hạn mức chỗ và điều kiện hành lý, hoàn đổi theo từng chuyến bay. |
| Hành khách | Nhập và kiểm tra thông tin hành khách, thông tin liên hệ; chọn nhanh từ danh bạ đã lưu. |
| Chọn ghế | Hiển thị sơ đồ ghế theo tàu bay, ghế đã đặt và phụ phí; kiểm tra lựa chọn cho từng hành khách, từng chặng. |
| Yêu thích | Thao tác lưu và bỏ lưu tại màn chi tiết chuyến bay đã kết nối API; danh sách tại tab Yêu thích còn dùng dữ liệu mẫu. |
| Vé và thông báo | Danh sách vé, chi tiết vé và hộp thông báo dùng dữ liệu mẫu. Thông báo hỗ trợ bộ lọc, xem chi tiết và đánh dấu đã đọc trong phiên sử dụng. |
| Check-in | Đã có giao diện nhập thông tin; chưa tích hợp xử lý làm thủ tục trực tuyến. |
| Điều hướng | Expo Router, phân quyền theo trạng thái đăng nhập, header dùng chung và hiệu ứng chuyển màn có xét tùy chọn giảm chuyển động. |

Việc chọn ghế và xem lại hành trình hiện chưa tạo đơn đặt chỗ, giữ ghế hoặc thực hiện thanh toán. Các bảng thanh toán, khuyến mãi, hoàn hủy và thuế phí đã được mô hình hóa trong database nhưng chưa tương ứng với một luồng nghiệp vụ hoàn chỉnh trên ứng dụng.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Ứng dụng | Expo SDK 57, React 19, React Native 0.86, TypeScript |
| Điều hướng và giao diện | Expo Router, NativeWind 4, Tailwind CSS 3, React Native Reanimated |
| Quản lý trạng thái | Redux Toolkit, React Redux, AsyncStorage |
| Giao tiếp API | Axios |
| Backend | Node.js, Express 5, TypeScript |
| Dữ liệu | PostgreSQL, thư viện `pg`, Prisma 6 |
| Xác thực | JSON Web Token, bcryptjs |
| Bộ nhớ đệm | Redis |

Backend sử dụng `pg` cho các truy vấn nghiệp vụ. Prisma quản lý mô hình dữ liệu, sinh client và phục vụ các tác vụ seed.

## Cấu trúc mã nguồn

```text
BookingFlight_MobileApp/
  be/
    prisma/          Schema và các script seed
    src/
      config/        Kết nối PostgreSQL, Redis và cấu hình dịch vụ
      controllers/   Xử lý yêu cầu HTTP
      middlewares/   Xác thực, kiểm tra dữ liệu và xử lý lỗi
      models/        Truy vấn dữ liệu
      routes/        Khai báo các endpoint
      services/      Xử lý nghiệp vụ
      validators/    Kiểm tra đầu vào API
      utils/         Tiện ích dùng chung
      server.ts      Điểm khởi chạy backend
    tests/           Kiểm thử backend
  fe/
    assets/          Ảnh và tài nguyên ứng dụng
    src/
      app/           Route và layout của Expo Router
      api/           API client và các hàm gọi backend
      components/    Thành phần giao diện dùng chung
      hook/          Các React hook
      navigation/    Kiểu dữ liệu và tiện ích điều hướng
      screens/       Nội dung các màn hình
      store/         Redux store và các slice
      utils/         Xử lý dữ liệu giao diện
    tests/           Kiểm thử điều hướng và logic ứng dụng
    index.ts         Điểm khởi chạy Expo Router
  docker-compose.yml Cấu hình Redis cho môi trường phát triển
  README.md
```

## Yêu cầu môi trường

- Node.js 24.x, từ phiên bản 24.3.0, và npm.
- Git.
- PostgreSQL có thể truy cập từ máy chạy backend.
- Docker Compose nếu sử dụng cấu hình Redis đi kèm.
- Trình duyệt, thiết bị di động có môi trường Expo phù hợp, hoặc trình giả lập Android/iOS.

Lệnh `npm run android` và `npm run ios` tạo hoặc chạy bản native, cần môi trường phát triển tương ứng. Chạy iOS Simulator và build iOS cục bộ yêu cầu macOS và Xcode.

## Cài đặt và cấu hình

### 1. Lấy mã nguồn

```bash
git clone https://github.com/NguyennHoangg/BookingFlight_MobileApp.git
cd BookingFlight_MobileApp
```

Backend và frontend có `package.json` và lockfile riêng. Chạy các lệnh cài đặt trong đúng thư mục của từng phần.

### 2. Cấu hình backend

```bash
cd be
npm ci
```

Tạo file `be/.env` với cấu hình dành cho môi trường của bạn:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/flight_booking?schema=public"
ACCESS_TOKEN_SECRET="REPLACE_WITH_A_RANDOM_ACCESS_TOKEN_SECRET"
REFRESH_TOKEN_SECRET="REPLACE_WITH_A_DIFFERENT_RANDOM_REFRESH_TOKEN_SECRET"
REDIS_URL_DEV="redis://localhost:6379"
```

Luồng xác thực hiện tại sử dụng `ACCESS_TOKEN_SECRET` và `REFRESH_TOKEN_SECRET`. `REDIS_URL_PROD` được dùng thay cho `REDIS_URL_DEV` khi `NODE_ENV` khác `development`.

Pool PostgreSQL trong [db.config.ts](be/src/config/db.config.ts) hiện bật SSL. Nếu dùng PostgreSQL cục bộ chưa hỗ trợ SSL, cần điều chỉnh cấu hình kết nối cho phù hợp trước khi chạy backend.

Không đưa file `.env` hoặc thông tin kết nối thật vào Git.

### 3. Chuẩn bị database

Kiểm tra schema và sinh Prisma Client:

```bash
npx prisma validate
npm run prisma:generate
```

Với database phát triển mới, chưa có dữ liệu, có thể tạo cấu trúc bảng từ schema:

```bash
npx prisma db push
```

Repository hiện chưa có lịch sử migration trong `be/prisma/migrations`. Với database đã tồn tại, cần đối chiếu cấu trúc và lập phương án thay đổi trước khi đồng bộ; không dùng lệnh reset cho database cần giữ dữ liệu.

Schema hiện có 25 model, bao gồm `TaxAndFee` liên kết với `Airline`. Các cột phí trong bảng này sử dụng kiểu `BigInt` và cho phép giá trị rỗng.

### 4. Khởi chạy Redis và backend

Nếu sử dụng Redis, chạy lệnh sau tại thư mục gốc repository:

```bash
docker compose up -d redis
```

File Compose chỉ cung cấp Redis; PostgreSQL được cấu hình riêng. Backend vẫn khởi động khi Redis chưa sẵn sàng và sẽ thử kết nối lại trong nền.

Chạy backend tại thư mục `be`:

```bash
npm run dev
```

Với cấu hình trên, địa chỉ backend là `http://localhost:3000`, tiền tố API là `/api/v1`. Endpoint `GET /health` trả về trạng thái tiến trình API, không kiểm tra kết nối PostgreSQL hoặc Redis.

Nếu không đặt `PORT`, backend mặc định chạy ở cổng `5000`. Frontend mặc định tìm API ở cổng `3000`, vì vậy cần cấu hình hai phía thống nhất.

### 5. Cấu hình và chạy frontend

Mở terminal khác tại thư mục gốc repository:

```bash
cd fe
npm ci
```

Tạo file `fe/.env` để chỉ định địa chỉ backend:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
```

API client tự thêm `/api/v1` nếu URL chưa có hậu tố này. Khi chạy trên điện thoại thật, thay `localhost` bằng địa chỉ LAN của máy chạy backend, chẳng hạn `http://192.168.1.10:3000`; hai thiết bị cần truy cập được nhau qua mạng.

Nếu không đặt biến môi trường, ứng dụng sử dụng `localhost` trên web, thử lấy địa chỉ máy chạy Expo trên thiết bị di động, hoặc dùng `10.0.2.2` làm địa chỉ dự phòng trên Android Emulator. Các địa chỉ tự động này đều dùng cổng `3000`.

Khởi động Expo và chọn nền tảng phù hợp trong terminal:

```bash
npm start
```

Hoặc chạy trực tiếp trên trình duyệt:

```bash
npm run web
```

Khởi động lại Expo sau khi thay đổi cấu hình môi trường. Giá trị có tiền tố `EXPO_PUBLIC_` được đưa vào mã ứng dụng, vì vậy chỉ sử dụng cho cấu hình công khai.

## Dữ liệu seed

[be/prisma/seed.ts](be/prisma/seed.ts) tạo dữ liệu phát triển cho tài khoản, sân bay, hãng hàng không, tàu bay, gói vé, chuyến bay và các bảng liên quan. Danh mục `Airline` gồm 14 hãng với ID và logo đã được cập nhật theo bộ dữ liệu cung cấp.

**Lưu ý:** script seed tổng xóa dữ liệu hiện có trước khi tạo lại. Chỉ chạy trên database phát triển có thể thay thế dữ liệu:

```bash
cd be
npm run seed
```

Phần seed tổng hiện chưa tạo hoặc dọn dữ liệu `TaxAndFee`. Nếu bảng này đã có bản ghi tham chiếu tới `Airline`, ràng buộc khóa ngoại sẽ chặn bước xóa hãng bay trong script.

Để kiểm tra và bổ sung ghế còn thiếu trên các chuyến bay đã có sơ đồ, dùng script riêng:

```bash
npm run seed:seat-layouts
```

Lệnh trên mặc định chỉ báo cáo. Thêm `--apply` để ghi các ghế còn thiếu:

```bash
npm run seed:seat-layouts -- --apply
```

Script bổ sung ghế không seed lại toàn bộ database và không ghi đè các ghế đã tồn tại.

## API hiện có

Các endpoint dưới đây dùng tiền tố `/api/v1`, ngoại trừ `/health`. Những endpoint yêu cầu đăng nhập sử dụng header `Authorization: Bearer <access_token>`.

| Phương thức | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/health` | Kiểm tra tiến trình API |
| POST | `/auth/register` | Đăng ký tài khoản |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/logout` | Đăng xuất và xử lý token được gửi kèm |
| GET, PUT | `/auth/profile` | Xem và cập nhật hồ sơ |
| PUT | `/auth/change-password` | Đổi mật khẩu |
| GET | `/auth/passengers` | Lấy hành khách đã lưu |
| GET | `/airports` | Lấy danh sách sân bay |
| POST | `/flights/conditions` | Tìm chuyến bay theo điều kiện |
| POST | `/flights/calendar` | Lấy lịch giá chuyến bay |
| GET | `/flights/:flightId/fares` | Lấy gói vé và tình trạng chỗ |
| GET | `/flights/:flightId/seats` | Lấy danh sách ghế |
| GET | `/flights/:flightId/seat-map` | Lấy sơ đồ ghế theo tàu bay |
| GET, PUT, DELETE | `/flights/:flightId/favorite` | Xem trạng thái, lưu hoặc bỏ yêu thích |

Các endpoint hồ sơ, đổi mật khẩu, hành khách đã lưu và yêu thích yêu cầu đăng nhập. Chi tiết đầu vào và xử lý nằm trong [routes](be/src/routes), [controllers](be/src/controllers) và [validators](be/src/validators).

## Kiểm tra mã nguồn

Chạy tại thư mục `fe`:

```bash
npm run typecheck
npm run lint
npm run test:navigation
```

Chạy tại thư mục `be`:

```bash
npx prisma validate
npm run build
node --import tsx --test tests/seatLayout.test.ts tests/flight.validator.test.ts
```

Các kiểm tra tự động bao phủ điều hướng, xác thực, dữ liệu tìm kiếm, lựa chọn gói vé, biểu mẫu hành khách và logic sơ đồ ghế. Việc kiểm tra biên dịch hoặc tạo bundle không thay thế kiểm tra giao diện, cử chỉ và độ mượt trên thiết bị thật.

## Đóng góp

Tạo nhánh riêng cho từng nhóm thay đổi và viết commit message mô tả rõ hành vi được bổ sung hoặc sửa lỗi. Chạy các kiểm tra liên quan trước khi gửi pull request; ghi rõ thay đổi schema, yêu cầu cấu hình và ảnh hưởng đến dữ liệu nếu có.

Tác giả: [NguyennHoangg](https://github.com/NguyennHoangg).
