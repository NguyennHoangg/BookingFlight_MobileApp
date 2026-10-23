# ✈️ Flight Booking Mobile App (Đặt Vé Máy Bay)

Hệ thống ứng dụng đặt vé máy bay toàn diện gồm **Backend API** (Node.js, Express, TypeScript, Prisma) và **Mobile Application** (React Native, Expo, Tailwind CSS / NativeWind).

---

## 📌 Công nghệ sử dụng (Tech Stack)

### Backend (`/be`)
- **Runtime & Ngôn ngữ**: Node.js, TypeScript
- **Framework**: Express.js
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: JSON Web Token (JWT), Bcrypt.js
- **Development Tools**: `tsx` (TypeScript execute & watch mode), `dotenv`, `cors`

### Frontend Mobile App (`/fe`)
- **Framework**: React Native (Expo SDK 58, TypeScript)
- **Styling**: Tailwind CSS (NativeWind v4)
- **Icons**: Lucide React Native, Expo Vector Icons
- **Quản lý chuyển động & Layout**: React Native Reanimated, Safe Area Context

---

## 📂 Cấu trúc thư mục (Project Structure)

```text
BookingFlight_App/
├── be/                          # BACKEND API
│   ├── prisma/
│   │   └── schema.prisma        # Schema 20 bảng cơ sở dữ liệu (User, Flight, Ticket, Booking...)
│   ├── src/
│   │   ├── config/              # Cấu hình env, kết nối Prisma
│   │   ├── controllers/         # Bộ điều hướng API (Auth, Flight, Booking...)
│   │   ├── middlewares/         # Middleware xác thực JWT, bắt lỗi
│   │   ├── routes/              # Khai báo các endpoint API
│   │   ├── services/            # Xử lý logic nghiệp vụ, transaction vé, email
│   │   ├── utils/               # Tiện ích sinh mã PNR, IATA Ticket, format tiền tệ
│   │   └── server.ts            # Entry point chạy Express server
│   ├── .env                     # File biến môi trường (Database, Secret...)
│   ├── tsconfig.json
│   └── package.json
│
├── fe/                          # FRONTEND MOBILE APP (EXPO)
│   ├── assets/                  # Hình ảnh, logo hãng hàng không, splash screen, icon
│   ├── src/
│   │   ├── api/                 # Cấu hình Axios client và gọi API
│   │   ├── components/          # Components tái sử dụng (common, flight, ticket)
│   │   ├── navigation/          # React Navigation (Bottom Tabs, Stacks)
│   │   ├── screens/             # Màn hình chức năng (auth, home, booking, tickets, profile)
│   │   ├── store/               # State management (Zustand / Redux)
│   │   └── utils/               # Hàm tiện ích giao diện
│   ├── App.tsx                  # Giao diện chính của ứng dụng
│   ├── global.css               # Chỉ thị Tailwind CSS
│   ├── tailwind.config.js       # Cấu hình Tailwind cho NativeWind
│   ├── metro.config.js          # Metro bundler tích hợp NativeWind
│   ├── nativewind-env.d.ts      # Khai báo TypeScript cho Tailwind className
│   └── package.json
│
├── .gitignore                   # Git ignore chuẩn cho Monorepo
└── README.md                    # Hướng dẫn cài đặt và sử dụng
```

---

## 🛠️ Yêu cầu môi trường (Prerequisites)

- **Node.js**: Phiên bản `>= 18.x` (khuyến nghị Node 20 LTS trở lên).
- **Git**: Đã cài đặt trên máy.
- **PostgreSQL**: Đang chạy trên máy cục bộ hoặc dịch vụ Cloud (Supabase, Neon, Render).
- **Thiết bị chạy thử ứng dụng**:
  - Điện thoại thông minh đã cài ứng dụng **Expo Go** (tải trên App Store hoặc Google Play Store).
  - Hoặc Android Emulator / iOS Simulator trên máy tính.

---

## 🚀 Hướng dẫn cài đặt chi tiết

### 1. Clone mã nguồn dự án

```bash
git clone https://github.com/NguyennHoangg/BookingFlight_MobileApp.git
cd BookingFlight_MobileApp
```

---

### 2. Cài đặt và chạy Backend (`be`)

#### Bước 2.1: Di chuyển vào thư mục backend và cài đặt thư viện
```bash
cd be
npm install
```

#### Bước 2.2: Tạo file `.env`
Tạo file `.env` tại thư mục `be/` và điền thông số kết nối Database:
```env
PORT=5000
NODE_ENV=development

# Chuỗi kết nối PostgreSQL (Thay user, password, host, port và tên database của bạn)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flight_booking?schema=public"

# Mã bí mật JWT
JWT_SECRET="your_super_secret_jwt_key_here_flight_app_2026"
JWT_EXPIRES_IN="7d"
```

#### Bước 2.3: Sinh Prisma Client và chạy Migration
```bash
# Sinh Prisma Client
npm run prisma:generate

# Tạo bảng trong Database theo schema
npm run prisma:migrate
```

#### Bước 2.4: Khởi chạy Backend Server
```bash
# Chế độ phát triển (tự động reload khi sửa file)
npm run dev

# Hoặc chế độ production
npm run build
npm start
```
Server sẽ chạy tại: **`http://localhost:5000`**  
Endpoint kiểm tra sức khỏe: `http://localhost:5000/health`

---

### 3. Cài đặt và chạy Frontend Mobile App (`fe`)

Mở một cửa sổ Terminal mới:

#### Bước 3.1: Di chuyển vào thư mục frontend và cài đặt thư viện
```bash
cd fe
npm install
```

#### Bước 3.2: Khởi động ứng dụng Expo
```bash
npm start
# hoặc: npx expo start
```

#### Bước 3.3: Trải nghiệm ứng dụng
- **Trên điện thoại thật**: Mở ứng dụng **Expo Go**, quét mã QR hiển thị trên màn hình Terminal.
- **Trên trình duyệt Web**: Bấm phím `w` trong cửa sổ Terminal.
- **Trên Android Emulator**: Bấm phím `a` trong cửa sổ Terminal.
- **Trên iOS Simulator** (chỉ dành cho macOS): Bấm phím `i` trong cửa sổ Terminal.

---

## 📋 Danh sách các lệnh thường dùng (Useful Scripts)

### Backend (`/be`)
| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev` | Chạy dev server với `tsx watch` |
| `npm run build` | Biên dịch TypeScript sang JavaScript trong thư mục `dist` |
| `npm start` | Chạy code đã build bằng Node |
| `npm run prisma:generate` | Sinh lại TypeScript types cho Prisma Client |
| `npm run prisma:migrate` | Chạy migration cập nhật bảng vào Database |
| `npm run prisma:studio` | Mở giao diện Web trực quan quản lý dữ liệu Prisma |

### Frontend (`/fe`)
| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm start` | Khởi chạy Expo Dev Server và hiển thị mã QR |
| `npm run android` | Mở ứng dụng trực tiếp trên Android Emulator |
| `npm run ios` | Mở ứng dụng trực tiếp trên iOS Simulator (macOS) |
| `npm run web` | Chạy ứng dụng trên nền tảng Web |

---

## 🔒 Bản quyền & Đóng góp (License)
Dự án được xây dựng phục vụ học tập và phát triển ứng dụng đặt vé máy bay.  
Tác giả: [NguyennHoangg](https://github.com/NguyennHoangg)
