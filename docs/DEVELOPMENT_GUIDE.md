# Hướng dẫn phát triển SkyJourney

Tài liệu này quy định cách tuân thủ coding standard và chạy dự án sau khi clone
repository. Dự án gồm hai phần độc lập:

- `be/`: Backend API Node.js, Express, TypeScript, PostgreSQL, Prisma và Redis.
- `fe/`: Ứng dụng mobile/web Expo, React Native và TypeScript.

## 1. Coding standard

### 1.1. Quy tắc chung

- Dùng TypeScript cho mã nguồn mới; không dùng `any` nếu có thể biểu diễn kiểu
  cụ thể hơn.
- Giữ thay đổi nhỏ và đúng phạm vi. Không đưa secret, file `.env`,
  `node_modules/`, `dist/` hoặc dữ liệu cá nhân vào Git.
- Tên biến, hàm và file dùng tiếng Anh, mô tả đúng mục đích.
- Dùng `camelCase` cho biến và hàm, `PascalCase` cho component, type, interface
  và class; hằng số dùng `UPPER_SNAKE_CASE` khi thực sự là hằng số cấp module.
- Ưu tiên `const`, early return và các hàm nhỏ có một trách nhiệm.
- Không nuốt lỗi bằng `catch` rỗng. Lỗi phải được log hoặc chuyển tiếp theo
  cơ chế xử lý lỗi hiện có.
- Comment chỉ dùng cho lý do hoặc quy tắc nghiệp vụ không hiển nhiên; không
  comment lại những dòng code tự giải thích.

### 1.2. Backend

- Đặt code theo đúng trách nhiệm:
  - `routes/`: khai báo endpoint và middleware.
  - `controllers/`: nhận request, gọi service và tạo response.
  - `services/`: xử lý nghiệp vụ.
  - `models/`: truy vấn dữ liệu.
  - `validators/`: kiểm tra dữ liệu đầu vào.
  - `middlewares/`: xác thực, giới hạn tốc độ và xử lý lỗi dùng chung.
  - `config/`: cấu hình PostgreSQL, Redis và CORS.
- Controller không chứa truy vấn SQL hoặc logic nghiệp vụ dài.
- Endpoint mới phải có validation cho `body`, `params` hoặc `query` phù hợp.
  Lỗi validation dùng `AppError` và đi qua `errorHandler`.
- Dùng parameterized query khi gọi PostgreSQL; không nối chuỗi dữ liệu người
  dùng trực tiếp vào SQL.
- Với thay đổi schema, cập nhật `be/prisma/schema.prisma`, kiểm tra Prisma và
  ghi rõ ảnh hưởng dữ liệu. Không chạy seed tổng trên database có dữ liệu cần
  giữ.
- Response API cần giữ format nhất quán với endpoint cùng nhóm, thường gồm
  `status`, `message` và `data`.
- Không hard-code secret JWT, chuỗi kết nối database hoặc URL môi trường.

### 1.3. Frontend

- Dùng Expo Router cho điều hướng; route nằm trong `fe/src/app/`. Code dùng
  chung đặt ngoài thư mục route.
- Component dùng `PascalCase`, hook bắt đầu bằng `use`, Redux slice đặt trong
  `fe/src/store/slices/`.
- Tách API client/API function khỏi screen. URL backend lấy từ
  `EXPO_PUBLIC_API_URL`, không hard-code URL production trong component.
- Dùng Redux cho state dùng chung và local state cho state chỉ thuộc một màn
  hình. Xử lý loading, empty state và error state khi gọi API.
- Ưu tiên component và module Expo tương thích với Expo SDK 57. Khi thêm
  package native, kiểm tra lại yêu cầu development build.
- Giữ khả năng chạy trên web, Android và iOS; không dùng API chỉ có trên một
  nền tảng nếu chưa có nhánh xử lý thay thế.
- Chạy lint và typecheck trước khi mở pull request.

### 1.4. Kiểm tra trước khi commit

Backend:

```powershell
cd be
npx prisma validate
npm run build
```

Frontend:

```powershell
cd fe
npm run typecheck
npm run lint
npm run test:navigation
```

Nếu thay đổi logic backend, chạy thêm các test liên quan:

```powershell
cd be
node --import tsx --test tests/seatLayout.test.ts tests/flight.validator.test.ts
```

## 2. Hướng dẫn chạy dự án

### 2.1. Yêu cầu

- Git.
- Node.js 24.x (khuyến nghị từ 24.3.0) và npm.
- PostgreSQL đang chạy và có database cho ứng dụng.
- Docker Desktop nếu muốn chạy Redis bằng `docker compose`.
- Expo Go, Android Emulator hoặc môi trường iOS phù hợp. Build iOS cục bộ
  yêu cầu macOS và Xcode.

### 2.2. Cài dependency

Từ thư mục gốc repository:

```powershell
cd be
npm ci

cd ..\fe
npm ci
```

### 2.3. Cấu hình backend

Tạo file `be/.env`:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?schema=public
ACCESS_TOKEN_SECRET=<random-secret>
REFRESH_TOKEN_SECRET=<different-random-secret>
REDIS_URL_DEV=redis://localhost:6379
```

Không commit file này. Backend mặc định dùng port `5000` nếu không đặt `PORT`;
frontend trong tài liệu này dùng `3000`, vì vậy nên đặt `PORT=3000` hoặc cập
nhật URL frontend cho khớp.

Kiểm tra và chuẩn bị Prisma:

```powershell
cd be
npx prisma validate
npm run prisma:generate
npx prisma db push
```

`db push` phù hợp cho database phát triển mới. Với database đã có dữ liệu,
kiểm tra schema trước và không dùng lệnh reset nếu chưa được phê duyệt.

### 2.4. Chạy Redis và seed dữ liệu

Từ thư mục gốc:

```powershell
docker compose up -d redis
```

Seed dữ liệu phát triển (có thể xóa và tạo lại dữ liệu hiện có):

```powershell
cd be
npm run seed
```

Kiểm tra/bổ sung sơ đồ ghế:

```powershell
npm run seed:seat-layouts
npm run seed:seat-layouts -- --apply
```

Chỉ dùng `--apply` trên database đúng môi trường.

### 2.5. Chạy backend

```powershell
cd be
npm run dev
```

Backend chạy tại `http://localhost:3000` với cấu hình ở trên. Kiểm tra tiến
trình bằng:

```text
GET http://localhost:3000/health
```

API nghiệp vụ dùng tiền tố `/api/v1`.

### 2.6. Cấu hình và chạy frontend

Tạo `fe/.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Chạy Expo:

```powershell
cd fe
npm start
```

Hoặc chạy trực tiếp trên web:

```powershell
npm run web
```

Khi chạy trên điện thoại thật, thay `localhost` bằng IP LAN của máy chạy
backend, ví dụ `http://192.168.1.10:3000`. Android Emulator dùng
`10.0.2.2` để trỏ về `localhost` của máy tính. Sau khi đổi `.env`, khởi động
lại Expo.

Các lệnh native:

```powershell
npm run android
npm run ios
```

`npm run ios` chỉ chạy được trên macOS với Xcode. Nếu chỉ phát triển bằng Expo
Go, dùng `npm start` và quét QR code.

## 3. Quy trình làm việc đề nghị

1. Tạo branch riêng từ branch chính.
2. Cài dependency bằng `npm ci` trong cả `be` và `fe`.
3. Đọc module liên quan trước khi sửa và giữ đúng boundary của module.
4. Cập nhật schema, environment hoặc API documentation nếu thay đổi contract.
5. Chạy kiểm tra backend/frontend tương ứng.
6. Kiểm tra thủ công luồng UI trên web hoặc thiết bị phù hợp.
7. Tạo pull request, mô tả thay đổi, cách kiểm thử và ảnh hưởng dữ liệu.

## 4. Tài liệu liên quan

- [README tổng quan và API](../README.md)
- [Tài liệu luồng booking](../fe/docs/booking-flow.md)
- [Tài liệu sơ đồ ghế](../be/docs/seat-layouts.md)
- [Schema Prisma](../be/prisma/schema.prisma)
