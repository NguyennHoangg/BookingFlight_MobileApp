import {
  PrismaClient,
  Role,
  MembershipTier,
  FlightStatus,
  SeatClass,
  SeatType,
  PassengerType,
  FlightDirection,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  DiscountType,
  ServiceType,
  BaggageStatus,
  RefundStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const TicketStatus = {
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  BOARDED: 'BOARDED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

const prisma = new PrismaClient();
const db = prisma as any;

async function main() {
  console.log('🚀 Bắt đầu seed dữ liệu mở rộng cho 8 tháng tới (mỗi ngày 10 chuyến HAN <-> SGN)...');

  // =====================================================
  // 1. DỌN DẸP DỮ LIỆU CŨ (CLEANUP)
  // =====================================================
  console.log('🧹 Xóa dữ liệu cũ theo thứ tự quan hệ...');
  await prisma.notification.deleteMany();
  await prisma.luggageCheckIn.deleteMany();
  await prisma.ticketAddon.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.refundCancelRequest.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.userCoupon.deleteMany();
  await prisma.promotion.deleteMany();
  await db.flightReview?.deleteMany();
  await db.favoriteFlight?.deleteMany();
  await db.priceAlert?.deleteMany();
  await db.destination?.deleteMany();
  await prisma.flightFareInventory.deleteMany();
  await prisma.flightSeat.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.fareClass.deleteMany();
  await prisma.seatTemplate.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.ancillaryService.deleteMany();
  await prisma.airline.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.savedPassenger.deleteMany();
  await prisma.user.deleteMany();

  // =====================================================
  // 2. USERS & DANH BẠ HÀNH KHÁCH
  // =====================================================
  console.log('👤 Tạo Users & Danh bạ hành khách...');
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const [adminUser, normalUser, user2, userVIP, userIntl] = await Promise.all([
    db.user.create({
      data: {
        email: 'admin@flightapp.vn',
        passwordHash,
        fullName: 'Nguyễn Huy Hoàng (Admin)',
        phone: '0901234567',
        role: Role.ADMIN,
        membershipTier: MembershipTier.PLATINUM,
        loyaltyPoints: 98000,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        gender: true,
        dateOfBirth: new Date('1990-01-01'),
      },
    }),
    db.user.create({
      data: {
        email: 'user@gmail.com',
        passwordHash,
        fullName: 'Trần Thị Bích Ngọc',
        phone: '0912345678',
        role: Role.USER,
        membershipTier: MembershipTier.GOLD,
        loyaltyPoints: 18500,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        gender: false,
        dateOfBirth: new Date('1995-06-15'),
      },
    }),
    db.user.create({
      data: {
        email: 'khach@gmail.com',
        passwordHash,
        fullName: 'Lê Văn Minh',
        phone: '0923456789',
        role: Role.USER,
        membershipTier: MembershipTier.SILVER,
        loyaltyPoints: 4500,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        gender: true,
        dateOfBirth: new Date('1992-08-20'),
      },
    }),
    db.user.create({
      data: {
        email: 'hoang.vip@flightapp.vn',
        passwordHash,
        fullName: 'Phạm Nhật Hoàng',
        phone: '0988888999',
        role: Role.USER,
        membershipTier: MembershipTier.PLATINUM,
        loyaltyPoints: 152000,
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        gender: true,
        dateOfBirth: new Date('1988-08-18'),
      },
    }),
    db.user.create({
      data: {
        email: 'david.smith@gmail.com',
        passwordHash,
        fullName: 'David Alexander Smith',
        phone: '0934567890',
        role: Role.USER,
        membershipTier: MembershipTier.MEMBER,
        loyaltyPoints: 1200,
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
        isActive: true,
        gender: true,
        dateOfBirth: new Date('1990-04-25'),
      },
    }),
  ]);

  await prisma.savedPassenger.createMany({
    data: [
      {
        userId: normalUser.id,
        fullName: 'TRAN THI BICH NGOC',
        passengerType: PassengerType.ADULT,
        dateOfBirth: new Date('1995-06-15'),
        identityNumber: '079195012345',
        isActive: true,
      },
      {
        userId: normalUser.id,
        fullName: 'TRAN MINH KHOI',
        passengerType: PassengerType.CHILD,
        dateOfBirth: new Date('2018-03-20'),
        identityNumber: null,
        isActive: true,
      },
      {
        userId: normalUser.id,
        fullName: 'NGUYEN HOANG LONG',
        passengerType: PassengerType.ADULT,
        dateOfBirth: new Date('1993-10-12'),
        identityNumber: '079193088992',
        isActive: true,
      },
      {
        userId: userVIP.id,
        fullName: 'PHAM NHAT HOANG',
        passengerType: PassengerType.ADULT,
        dateOfBirth: new Date('1988-08-18'),
        identityNumber: '001088019988',
        isActive: true,
      },
      {
        userId: userIntl.id,
        fullName: 'DAVID ALEXANDER SMITH',
        passengerType: PassengerType.ADULT,
        dateOfBirth: new Date('1990-04-25'),
        identityNumber: 'USA982341029',
        isActive: true,
      },
    ],
  });

  // =====================================================
  // 3. SÂN BAY (AIRPORTS) - 50+ SÂN BAY (VIỆT NAM, HÀN QUỐC, NHẬT BẢN...)
  // =====================================================
  console.log('🛫 Tạo danh mục 50+ Sân bay (Việt Nam, Hàn Quốc, Nhật Bản, Châu Á, Quốc tế)...');

  const airportsRaw = [
    // --- 1. SÂN BAY VIỆT NAM (22 SÂN BAY) ---
    { code: 'SGN', name: 'Sân bay Quốc tế Tân Sơn Nhất', city: 'TP. Hồ Chí Minh', country: 'Việt Nam' },
    { code: 'HAN', name: 'Sân bay Quốc tế Nội Bài', city: 'Hà Nội', country: 'Việt Nam' },
    { code: 'DAD', name: 'Sân bay Quốc tế Đà Nẵng', city: 'Đà Nẵng', country: 'Việt Nam' },
    { code: 'CXR', name: 'Sân bay Quốc tế Cam Ranh', city: 'Nha Trang', country: 'Việt Nam' },
    { code: 'PQC', name: 'Sân bay Quốc tế Phú Quốc', city: 'Phú Quốc', country: 'Việt Nam' },
    { code: 'HPH', name: 'Sân bay Quốc tế Cát Bi', city: 'Hải Phòng', country: 'Việt Nam' },
    { code: 'VDO', name: 'Sân bay Quốc tế Vân Đồn', city: 'Quảng Ninh', country: 'Việt Nam' },
    { code: 'HUI', name: 'Sân bay Quốc tế Phú Bài', city: 'Huế', country: 'Việt Nam' },
    { code: 'VCA', name: 'Sân bay Quốc tế Cần Thơ', city: 'Cần Thơ', country: 'Việt Nam' },
    { code: 'VII', name: 'Sân bay Quốc tế Vinh', city: 'Vinh', country: 'Việt Nam' },
    { code: 'DLI', name: 'Sân bay Liên Khương', city: 'Đà Lạt', country: 'Việt Nam' },
    { code: 'UIH', name: 'Sân bay Phù Cát', city: 'Quy Nhơn', country: 'Việt Nam' },
    { code: 'BMV', name: 'Sân bay Buôn Ma Thuột', city: 'Buôn Ma Thuột', country: 'Việt Nam' },
    { code: 'PXU', name: 'Sân bay Pleiku', city: 'Pleiku', country: 'Việt Nam' },
    { code: 'TBB', name: 'Sân bay Tuy Hòa', city: 'Tuy Hòa', country: 'Việt Nam' },
    { code: 'THD', name: 'Sân bay Thọ Xuân', city: 'Thanh Hóa', country: 'Việt Nam' },
    { code: 'VCL', name: 'Sân bay Chu Lai', city: 'Quảng Nam', country: 'Việt Nam' },
    { code: 'VDH', name: 'Sân bay Đồng Hới', city: 'Đồng Hới', country: 'Việt Nam' },
    { code: 'DIN', name: 'Sân bay Điện Biên Phủ', city: 'Điện Biên', country: 'Việt Nam' },
    { code: 'VCS', name: 'Sân bay Côn Đảo', city: 'Côn Đảo', country: 'Việt Nam' },
    { code: 'VKG', name: 'Sân bay Rạch Giá', city: 'Rạch Giá', country: 'Việt Nam' },
    { code: 'CAH', name: 'Sân bay Cà Mau', city: 'Cà Mau', country: 'Việt Nam' },

    // --- 2. HÀN QUỐC (6 SÂN BAY) ---
    { code: 'ICN', name: 'Sân bay Quốc tế Incheon', city: 'Seoul', country: 'Hàn Quốc' },
    { code: 'GMP', name: 'Sân bay Quốc tế Gimpo', city: 'Seoul', country: 'Hàn Quốc' },
    { code: 'PUS', name: 'Sân bay Quốc tế Gimhae', city: 'Busan', country: 'Hàn Quốc' },
    { code: 'CJU', name: 'Sân bay Quốc tế Jeju', city: 'Đảo Jeju', country: 'Hàn Quốc' },
    { code: 'TAE', name: 'Sân bay Quốc tế Daegu', city: 'Daegu', country: 'Hàn Quốc' },
    { code: 'CJJ', name: 'Sân bay Quốc tế Cheongju', city: 'Cheongju', country: 'Hàn Quốc' },

    // --- 3. NHẬT BẢN (8 SÂN BAY) ---
    { code: 'NRT', name: 'Sân bay Quốc tế Narita', city: 'Tokyo', country: 'Nhật Bản' },
    { code: 'HND', name: 'Sân bay Quốc tế Haneda', city: 'Tokyo', country: 'Nhật Bản' },
    { code: 'KIX', name: 'Sân bay Quốc tế Kansai', city: 'Osaka', country: 'Nhật Bản' },
    { code: 'ITM', name: 'Sân bay Quốc tế Osaka Itami', city: 'Osaka', country: 'Nhật Bản' },
    { code: 'NGO', name: 'Sân bay Quốc tế Chubu Centrair', city: 'Nagoya', country: 'Nhật Bản' },
    { code: 'FUK', name: 'Sân bay Fukuoka', city: 'Fukuoka', country: 'Nhật Bản' },
    { code: 'CTS', name: 'Sân bay New Chitose', city: 'Sapporo (Hokkaido)', country: 'Nhật Bản' },
    { code: 'OKA', name: 'Sân bay Naha', city: 'Okinawa', country: 'Nhật Bản' },

    // --- 4. ĐÔNG NAM Á & CHÂU Á KHÁC (10 SÂN BAY) ---
    { code: 'BKK', name: 'Sân bay Quốc tế Suvarnabhumi', city: 'Bangkok', country: 'Thái Lan' },
    { code: 'DMK', name: 'Sân bay Quốc tế Don Mueang', city: 'Bangkok', country: 'Thái Lan' },
    { code: 'HKT', name: 'Sân bay Quốc tế Phuket', city: 'Phuket', country: 'Thái Lan' },
    { code: 'CNX', name: 'Sân bay Quốc tế Chiang Mai', city: 'Chiang Mai', country: 'Thái Lan' },
    { code: 'SIN', name: 'Sân bay Quốc tế Changi', city: 'Singapore', country: 'Singapore' },
    { code: 'KUL', name: 'Sân bay Quốc tế Kuala Lumpur', city: 'Kuala Lumpur', country: 'Malaysia' },
    { code: 'TPE', name: 'Sân bay Quốc tế Đào Viên', city: 'Đài Bắc', country: 'Đài Loan' },
    { code: 'KHH', name: 'Sân bay Quốc tế Cao Hùng', city: 'Cao Hùng', country: 'Đài Loan' },
    { code: 'HKG', name: 'Sân bay Quốc tế Hồng Kông', city: 'Hồng Kông', country: 'Hồng Kông' },
    { code: 'MFM', name: 'Sân bay Quốc tế Ma Cao', city: 'Ma Cao', country: 'Ma Cao' },

    // --- 5. TRUNG ĐÔNG, CHÂU ĐẠI DƯƠNG & CHÂU ÂU (6 SÂN BAY) ---
    { code: 'DXB', name: 'Sân bay Quốc tế Dubai', city: 'Dubai', country: 'Các Tiểu Vương quốc Ả Rập' },
    { code: 'DOH', name: 'Sân bay Quốc tế Hamad', city: 'Doha', country: 'Qatar' },
    { code: 'SYD', name: 'Sân bay Sydney Kingsford Smith', city: 'Sydney', country: 'Úc' },
    { code: 'MEL', name: 'Sân bay Melbourne', city: 'Melbourne', country: 'Úc' },
    { code: 'CDG', name: 'Sân bay Quốc tế Paris Charles de Gaulle', city: 'Paris', country: 'Pháp' },
    { code: 'LHR', name: 'Sân bay Quốc tế London Heathrow', city: 'London', country: 'Vương Quốc Anh' },
  ];

  await prisma.airport.createMany({
    data: airportsRaw.map((a) => ({ ...a, isActive: true })),
  });

  const allAirports = await prisma.airport.findMany();
  const airportMap = new Map(allAirports.map((a) => [a.code, a]));

  // =====================================================
  // 4. HÃNG HÀNG KHÔNG (14 HÃNG BAY VIỆT NAM & QUỐC TẾ)
  // =====================================================
  console.log('✈️ Tạo 14 Hãng hàng không (Việt Nam, Hàn Quốc, Nhật Bản, Singapore, Trung Đông...)...');

  const airlinesRaw = [
    // 4 Hãng nội địa
    { code: 'VN', name: 'Vietnam Airlines', logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietnam-Airlines-VNA.png' },
    { code: 'VJ', name: 'VietJet Air', logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietjet-Air.png' },
    { code: 'QH', name: 'Bamboo Airways', logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Bamboo-Airways.png' },
    { code: 'VU', name: 'Vietravel Airlines', logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietravel-Airlines.png' },
    // 10 Hãng quốc tế thêm mới
    { code: 'KE', name: 'Korean Air', logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-Korean-Air.png' },
    { code: 'OZ', name: 'Asiana Airlines', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Asiana_Airlines_logo.svg/1200px-Asiana_Airlines_logo.svg.png' },
    { code: 'JL', name: 'Japan Airlines', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Japan_Airlines_logo_%282011%29.svg/1200px-Japan_Airlines_logo_%282011%29.svg.png' },
    { code: 'NH', name: 'All Nippon Airways (ANA)', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/All_Nippon_Airways_Logo.svg/1200px-All_Nippon_Airways_Logo.svg.png' },
    { code: 'SQ', name: 'Singapore Airlines', logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-Singapore-Airlines.png' },
    { code: 'CX', name: 'Cathay Pacific', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Cathay_Pacific_logo.svg/1200px-Cathay_Pacific_logo.svg.png' },
    { code: 'BR', name: 'EVA Air', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/EVA_Air_logo.svg/1200px-EVA_Air_logo.svg.png' },
    { code: 'QR', name: 'Qatar Airways', logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-Qatar-Airways.png' },
    { code: 'EK', name: 'Emirates', logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/05/Logo-Emirates.png' },
    { code: 'TG', name: 'Thai Airways', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Thai_Airways_Logo.svg/1200px-Thai_Airways_Logo.svg.png' },
  ];

  await prisma.airline.createMany({
    data: airlinesRaw.map((al) => ({ ...al, isActive: true })),
  });

  const allAirlines = await prisma.airline.findMany();
  const airlineMap = new Map(allAirlines.map((al) => [al.code, al]));

  // =====================================================
  // 5. ĐỘI TÀU BAY & HẠNG VÉ
  // =====================================================
  console.log('🛩️ Tạo Đội tàu bay hiện đại cho 14 hãng...');

  const aircraftList: {
    airlineCode: string;
    registrationCode: string;
    model: string;
    seatLayout: string;
    totalSeats: number;
  }[] = [
    // Vietnam Airlines
    { airlineCode: 'VN', registrationCode: 'VN-A879', model: 'Boeing 787-10 Dreamliner', seatLayout: '3-3-3', totalSeats: 367 },
    { airlineCode: 'VN', registrationCode: 'VN-A868', model: 'Airbus A321neo', seatLayout: '3-3', totalSeats: 203 },
    // Vietjet Air
    { airlineCode: 'VJ', registrationCode: 'VJ-A811', model: 'Airbus A330-300 Wide-Body', seatLayout: '3-3-3', totalSeats: 377 },
    { airlineCode: 'VJ', registrationCode: 'VJ-A646', model: 'Airbus A321neo ACF', seatLayout: '3-3', totalSeats: 240 },
    // Bamboo Airways
    { airlineCode: 'QH', registrationCode: 'QH-B789', model: 'Boeing 787-9 Dreamliner', seatLayout: '3-3-3', totalSeats: 294 },
    { airlineCode: 'QH', registrationCode: 'QH-A590', model: 'Airbus A321neo', seatLayout: '3-3', totalSeats: 198 },
    // Vietravel Airlines
    { airlineCode: 'VU', registrationCode: 'VU-A350', model: 'Airbus A321-200', seatLayout: '3-3', totalSeats: 220 },
    // Korean Air
    { airlineCode: 'KE', registrationCode: 'HL-8088', model: 'Boeing 777-300ER', seatLayout: '3-3-3', totalSeats: 291 },
    { airlineCode: 'KE', registrationCode: 'HL-7538', model: 'Airbus A330-300', seatLayout: '2-4-2', totalSeats: 276 },
    // Asiana Airlines
    { airlineCode: 'OZ', registrationCode: 'HL-7792', model: 'Airbus A350-900', seatLayout: '3-3-3', totalSeats: 311 },
    // Japan Airlines
    { airlineCode: 'JL', registrationCode: 'JA-861J', model: 'Boeing 787-9 Sky Suite', seatLayout: '2-4-2', totalSeats: 203 },
    // ANA
    { airlineCode: 'NH', registrationCode: 'JA-899A', model: 'Boeing 787-9 Dreamliner', seatLayout: '3-3-3', totalSeats: 246 },
    // Singapore Airlines
    { airlineCode: 'SQ', registrationCode: '9V-SHG', model: 'Boeing 787-10 Regional', seatLayout: '3-3-3', totalSeats: 337 },
    { airlineCode: 'SQ', registrationCode: '9V-SMF', model: 'Airbus A350-900', seatLayout: '3-3-3', totalSeats: 253 },
    // Cathay Pacific
    { airlineCode: 'CX', registrationCode: 'B-LRA', model: 'Airbus A350-900', seatLayout: '3-3-3', totalSeats: 280 },
    // EVA Air
    { airlineCode: 'BR', registrationCode: 'B-16722', model: 'Boeing 777-300ER', seatLayout: '3-3-3', totalSeats: 323 },
    // Qatar Airways
    { airlineCode: 'QR', registrationCode: 'A7-BOA', model: 'Boeing 777-300ER Qsuite', seatLayout: '3-4-3', totalSeats: 358 },
    // Emirates
    { airlineCode: 'EK', registrationCode: 'A6-EEO', model: 'Airbus A380-800 Superjumbo', seatLayout: '3-4-3', totalSeats: 517 },
    // Thai Airways
    { airlineCode: 'TG', registrationCode: 'HS-TWB', model: 'Airbus A350-900', seatLayout: '3-3-3', totalSeats: 321 },
  ];

  await prisma.aircraft.createMany({
    data: aircraftList.map((ac) => ({
      airlineId: airlineMap.get(ac.airlineCode)!.id,
      registrationCode: ac.registrationCode,
      model: ac.model,
      seatLayout: ac.seatLayout,
      totalSeats: ac.totalSeats,
      isActive: true,
    })),
  });

  const allAircrafts = await prisma.aircraft.findMany();
  const aircraftMap = new Map(allAircrafts.map((ac) => [ac.registrationCode, ac]));

  // Sơ đồ ghế mẫu (SeatTemplate) cho từng tàu bay
  console.log('🪑 Tạo Sơ đồ ghế mẫu (SeatTemplate) cho toàn bộ tàu bay...');
  for (const ac of allAircrafts) {
    const templates: {
      aircraftId: string;
      seatNumber: string;
      rowNumber: number;
      columnLetter: string;
      seatClass: SeatClass;
      seatType: SeatType;
      defaultExtraPrice: number;
      isActive: boolean;
    }[] = [];

    const layout = ac.seatLayout || '3-3';
    let cols: string[] = [];
    let windowCols: string[] = [];
    let aisleCols: string[] = [];
    let middleCols: string[] = [];

    if (layout === '3-3') {
      cols = ['A', 'B', 'C', 'D', 'E', 'F'];
      windowCols = ['A', 'F'];
      aisleCols = ['C', 'D'];
      middleCols = ['B', 'E'];
    } else if (layout === '2-4-2') {
      cols = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'K'];
      windowCols = ['A', 'K'];
      aisleCols = ['C', 'D', 'G', 'H'];
      middleCols = ['E', 'F'];
    } else if (layout === '3-4-3') {
      cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
      windowCols = ['A', 'K'];
      aisleCols = ['C', 'D', 'G', 'H'];
      middleCols = ['B', 'E', 'F', 'J'];
    } else {
      cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K'];
      windowCols = ['A', 'K'];
      aisleCols = ['C', 'D', 'F', 'G'];
      middleCols = ['B', 'E', 'H'];
    }

    const seatsPerRow = cols.length;
    const totalRows = Math.min(Math.ceil(ac.totalSeats / seatsPerRow), 45);
    const businessRows = layout === '3-3' ? 3 : 4;
    const exitRowNumbers = [11, 12];

    for (let row = 1; row <= totalRows; row++) {
      for (const col of cols) {
        if (templates.length >= ac.totalSeats) break;

        const seatNumber = `${row}${col}`;
        const isBusiness = row <= businessRows;
        const isExit = exitRowNumbers.includes(row) && !isBusiness;

        let seatClass: SeatClass = SeatClass.ECONOMY;
        let seatType: SeatType = SeatType.MIDDLE;
        let defaultExtraPrice = 0;

        if (isBusiness) {
          seatClass = SeatClass.BUSINESS;
          seatType = windowCols.includes(col) ? SeatType.WINDOW : SeatType.AISLE;
          defaultExtraPrice = 350000;
        } else if (isExit) {
          seatClass = SeatClass.ECONOMY;
          seatType = SeatType.EXIT_ROW;
          defaultExtraPrice = 120000;
        } else {
          seatClass = SeatClass.ECONOMY;
          if (windowCols.includes(col)) {
            seatType = SeatType.WINDOW;
            defaultExtraPrice = 60000;
          } else if (aisleCols.includes(col)) {
            seatType = SeatType.AISLE;
            defaultExtraPrice = 50000;
          } else {
            seatType = SeatType.MIDDLE;
            defaultExtraPrice = 0;
          }
        }

        templates.push({
          aircraftId: ac.id,
          seatNumber,
          rowNumber: row,
          columnLetter: col,
          seatClass,
          seatType,
          defaultExtraPrice,
          isActive: true,
        });
      }
    }

    await prisma.seatTemplate.createMany({
      data: templates,
      skipDuplicates: true,
    });
  }

  // Hạng vé (FareClass) cho các hãng
  console.log('🎫 Tạo Hạng vé chuẩn...');
  const fareClassInputs: { airlineId: string; name: string; carryOn: number; checked: number; isRefund: boolean; changeFee: number }[] = [];

  for (const al of allAirlines) {
    fareClassInputs.push({
      airlineId: al.id,
      name: 'Phổ thông Tiêu chuẩn',
      carryOn: 7,
      checked: 20,
      isRefund: false,
      changeFee: 350000,
    });
    fareClassInputs.push({
      airlineId: al.id,
      name: 'Thương gia (Business)',
      carryOn: 14,
      checked: 35,
      isRefund: true,
      changeFee: 0,
    });
  }

  await prisma.fareClass.createMany({
    data: fareClassInputs.map((fc) => ({
      airlineId: fc.airlineId,
      name: fc.name,
      carryOnBaggage: fc.carryOn,
      checkedBaggage: fc.checked,
      isRefundable: fc.isRefund,
      changeFee: fc.changeFee,
      isActive: true,
    })),
  });

  const allFareClasses = await prisma.fareClass.findMany();

  // Dịch vụ bổ trợ (Ancillary Services)
  console.log('🍽️ Tạo Dịch vụ bổ trợ (Hành lý, Suất ăn, Phòng chờ, Bảo hiểm)...');
  const ancillaryInputs = [];
  for (const al of allAirlines) {
    ancillaryInputs.push(
      { airlineId: al.id, type: ServiceType.BAGGAGE, name: 'Hành lý ký gửi 20kg', price: 250000 },
      { airlineId: al.id, type: ServiceType.MEAL, name: 'Suất ăn nóng tiêu chuẩn', price: 95000 },
      { airlineId: al.id, type: ServiceType.INSURANCE, name: 'Bảo hiểm chuyến bay toàn diện', price: 50000 }
    );
  }
  await prisma.ancillaryService.createMany({
    data: ancillaryInputs.map((a) => ({ ...a, isActive: true })),
  });

  // =====================================================
  // 6. TẠO LỊCH BAY TRONG 8 THÁNG (245 NGÀY - MỞ RỘNG THÊM 1 THÁNG, 10 CHUYẾN/NGÀY)
  // =====================================================
  console.log('📅 Tạo lịch bay dày đặc suốt 8 tháng (~245 ngày, 10 chuyến/ngày các hãng và khung giờ)...');

  // Các tuyến bay thực tế phong phú
  const routeTemplates = [
    // --- 1. Tuyến vàng Hà Nội (HAN) <-> TP. Hồ Chí Minh (SGN) (Mỗi chiều 10 chuyến/ngày) ---
    // HAN -> SGN (10 chuyến trải đều từ 06:00 đến 20:45)
    { dep: 'HAN', arr: 'SGN', al: 'VN', ac: 'VN-A879', depH: 6, depM: 0, dur: 130, base: 1250000, prefix: 'VN204' },
    { dep: 'HAN', arr: 'SGN', al: 'VJ', ac: 'VJ-A811', depH: 7, depM: 15, dur: 130, base: 890000, prefix: 'VJ120' },
    { dep: 'HAN', arr: 'SGN', al: 'VN', ac: 'VN-A868', depH: 8, depM: 30, dur: 130, base: 1450000, prefix: 'VN208' },
    { dep: 'HAN', arr: 'SGN', al: 'QH', ac: 'QH-B789', depH: 9, depM: 45, dur: 130, base: 1100000, prefix: 'QH202' },
    { dep: 'HAN', arr: 'SGN', al: 'VJ', ac: 'VJ-A646', depH: 11, depM: 15, dur: 130, base: 950000, prefix: 'VJ134' },
    { dep: 'HAN', arr: 'SGN', al: 'VU', ac: 'VU-A350', depH: 13, depM: 0, dur: 130, base: 799000, prefix: 'VU221' },
    { dep: 'HAN', arr: 'SGN', al: 'VN', ac: 'VN-A879', depH: 14, depM: 30, dur: 130, base: 1350000, prefix: 'VN214' },
    { dep: 'HAN', arr: 'SGN', al: 'QH', ac: 'QH-A590', depH: 16, depM: 15, dur: 130, base: 1180000, prefix: 'QH216' },
    { dep: 'HAN', arr: 'SGN', al: 'VJ', ac: 'VJ-A811', depH: 18, depM: 30, dur: 130, base: 1050000, prefix: 'VJ168' },
    { dep: 'HAN', arr: 'SGN', al: 'VN', ac: 'VN-A868', depH: 20, depM: 45, dur: 130, base: 1280000, prefix: 'VN224' },

    // SGN -> HAN (10 chuyến trải đều từ 06:15 đến 21:30)
    { dep: 'SGN', arr: 'HAN', al: 'VN', ac: 'VN-A868', depH: 6, depM: 15, dur: 130, base: 1290000, prefix: 'VN205' },
    { dep: 'SGN', arr: 'HAN', al: 'VJ', ac: 'VJ-A646', depH: 7, depM: 45, dur: 130, base: 890000, prefix: 'VJ125' },
    { dep: 'SGN', arr: 'HAN', al: 'QH', ac: 'QH-B789', depH: 9, depM: 0, dur: 130, base: 1120000, prefix: 'QH203' },
    { dep: 'SGN', arr: 'HAN', al: 'VN', ac: 'VN-A879', depH: 10, depM: 30, dur: 130, base: 1390000, prefix: 'VN211' },
    { dep: 'SGN', arr: 'HAN', al: 'VU', ac: 'VU-A350', depH: 12, depM: 15, dur: 130, base: 810000, prefix: 'VU222' },
    { dep: 'SGN', arr: 'HAN', al: 'VJ', ac: 'VJ-A811', depH: 14, depM: 0, dur: 130, base: 930000, prefix: 'VJ145' },
    { dep: 'SGN', arr: 'HAN', al: 'VN', ac: 'VN-A868', depH: 15, depM: 45, dur: 130, base: 1420000, prefix: 'VN219' },
    { dep: 'SGN', arr: 'HAN', al: 'QH', ac: 'QH-A590', depH: 17, depM: 30, dur: 130, base: 1150000, prefix: 'QH217' },
    { dep: 'SGN', arr: 'HAN', al: 'VJ', ac: 'VJ-A646', depH: 19, depM: 15, dur: 130, base: 990000, prefix: 'VJ179' },
    { dep: 'SGN', arr: 'HAN', al: 'VN', ac: 'VN-A879', depH: 21, depM: 30, dur: 130, base: 1310000, prefix: 'VN235' },

    // --- 2. Du lịch biển đảo & Miền Trung ---
    { dep: 'SGN', arr: 'DAD', al: 'VN', ac: 'VN-A868', depH: 8, depM: 0, dur: 85, base: 850000, prefix: 'VN112' },
    { dep: 'DAD', arr: 'SGN', al: 'VJ', ac: 'VJ-A646', depH: 16, depM: 30, dur: 85, base: 690000, prefix: 'VJ580' },
    { dep: 'HAN', arr: 'DAD', al: 'QH', ac: 'QH-A590', depH: 10, depM: 15, dur: 80, base: 790000, prefix: 'QH382' },
    { dep: 'SGN', arr: 'PQC', al: 'VN', ac: 'VN-A868', depH: 7, depM: 20, dur: 60, base: 750000, prefix: 'VN1823' },
    { dep: 'PQC', arr: 'SGN', al: 'VJ', ac: 'VJ-A646', depH: 15, depM: 45, dur: 60, base: 590000, prefix: 'VJ321' },
    { dep: 'HAN', arr: 'CXR', al: 'VN', ac: 'VN-A868', depH: 12, depM: 30, dur: 110, base: 1280000, prefix: 'VN1556' },
    { dep: 'SGN', arr: 'DLI', al: 'VJ', ac: 'VJ-A646', depH: 11, depM: 10, dur: 55, base: 510000, prefix: 'VJ362' },

    // --- 3. Tuyến Hàn Quốc (ICN, PUS, CJU) ---
    { dep: 'HAN', arr: 'ICN', al: 'KE', ac: 'HL-8088', depH: 11, depM: 45, dur: 250, base: 4950000, prefix: 'KE680' },
    { dep: 'ICN', arr: 'HAN', al: 'KE', ac: 'HL-7538', depH: 18, depM: 30, dur: 270, base: 5100000, prefix: 'KE681' },
    { dep: 'SGN', arr: 'ICN', al: 'OZ', ac: 'HL-7792', depH: 23, depM: 50, dur: 310, base: 4800000, prefix: 'OZ732' },
    { dep: 'DAD', arr: 'ICN', al: 'VJ', ac: 'VJ-A646', depH: 17, depM: 30, dur: 260, base: 2890000, prefix: 'VJ878' },
    { dep: 'HAN', arr: 'PUS', al: 'VN', ac: 'VN-A868', depH: 1, depM: 15, dur: 245, base: 4200000, prefix: 'VN426' },
    { dep: 'SGN', arr: 'CJU', al: 'VJ', ac: 'VJ-A646', depH: 8, depM: 10, dur: 280, base: 3150000, prefix: 'VJ920' },

    // --- 4. Tuyến Nhật Bản (NRT, HND, KIX, FUK) ---
    { dep: 'HAN', arr: 'NRT', al: 'JL', ac: 'JA-861J', depH: 23, depM: 55, dur: 320, base: 6800000, prefix: 'JL752' },
    { dep: 'NRT', arr: 'HAN', al: 'JL', ac: 'JA-861J', depH: 18, depM: 10, dur: 350, base: 6950000, prefix: 'JL751' },
    { dep: 'SGN', arr: 'HND', al: 'NH', ac: 'JA-899A', depH: 7, depM: 0, dur: 330, base: 6500000, prefix: 'NH892' },
    { dep: 'SGN', arr: 'KIX', al: 'VN', ac: 'VN-A879', depH: 0, depM: 35, dur: 320, base: 5900000, prefix: 'VN320' },
    { dep: 'HAN', arr: 'FUK', al: 'VJ', ac: 'VJ-A646', depH: 2, depM: 0, dur: 270, base: 3450000, prefix: 'VJ956' },

    // --- 5. Tuyến Đông Nam Á & Châu Á khác ---
    { dep: 'SGN', arr: 'SIN', al: 'SQ', ac: '9V-SHG', depH: 12, depM: 15, dur: 125, base: 2450000, prefix: 'SQ173' },
    { dep: 'HAN', arr: 'SIN', al: 'SQ', ac: '9V-SMF', depH: 18, depM: 45, dur: 200, base: 2890000, prefix: 'SQ191' },
    { dep: 'SGN', arr: 'BKK', al: 'TG', ac: 'HS-TWB', depH: 10, depM: 20, dur: 95, base: 1750000, prefix: 'TG551' },
    { dep: 'HAN', arr: 'BKK', al: 'VJ', ac: 'VJ-A646', depH: 13, depM: 0, dur: 110, base: 1350000, prefix: 'VJ901' },
    { dep: 'SGN', arr: 'HKG', al: 'CX', ac: 'B-LRA', depH: 6, depM: 25, dur: 160, base: 3100000, prefix: 'CX766' },
    { dep: 'HAN', arr: 'TPE', al: 'BR', ac: 'B-16722', depH: 12, depM: 10, dur: 170, base: 3250000, prefix: 'BR398' },

    // --- 6. Tuyến Trung Đông, Châu Âu & Úc ---
    { dep: 'HAN', arr: 'DOH', al: 'QR', ac: 'A7-BOA', depH: 8, depM: 40, dur: 450, base: 11500000, prefix: 'QR977' },
    { dep: 'SGN', arr: 'DXB', al: 'EK', ac: 'A6-EEO', depH: 23, depM: 55, dur: 470, base: 12800000, prefix: 'EK393' },
    { dep: 'SGN', arr: 'SYD', al: 'VN', ac: 'VN-A879', depH: 20, depM: 45, dur: 520, base: 9800000, prefix: 'VN773' },
    { dep: 'HAN', arr: 'CDG', al: 'VN', ac: 'VN-A879', depH: 23, depM: 10, dur: 750, base: 15600000, prefix: 'VN19' },
  ];

  // Sinh lịch bay cho 245 ngày tiếp theo (~8 tháng, thêm 1 tháng so với 7 tháng cũ)
  const TOTAL_DAYS = 245;
  const flightsToCreate: any[] = [];

  const now = new Date();

  for (let day = 0; day <= TOTAL_DAYS; day++) {
    for (const route of routeTemplates) {
      const depAirport = airportMap.get(route.dep);
      const arrAirport = airportMap.get(route.arr);
      const airline = airlineMap.get(route.al);
      const aircraft = aircraftMap.get(route.ac);

      if (!depAirport || !arrAirport || !airline || !aircraft) continue;

      const depTime = new Date(now);
      depTime.setDate(now.getDate() + day);
      depTime.setHours(route.depH, route.depM, 0, 0);

      const arrTime = new Date(depTime.getTime() + route.dur * 60 * 1000);

      // Tạo flightNumber duy nhất hoặc định dạng
      const flightNumber = route.prefix;

      flightsToCreate.push({
        flightNumber,
        airlineId: airline.id,
        aircraftId: aircraft.id,
        departureAirportId: depAirport.id,
        arrivalAirportId: arrAirport.id,
        departureTime: depTime,
        arrivalTime: arrTime,
        terminal: route.dep === 'HAN' || route.dep === 'SGN' ? 'T2' : 'T1',
        gate: `G0${(day % 9) + 1}`,
        basePrice: route.base,
        status: day === 0 && route.depH < now.getHours() ? FlightStatus.COMPLETED : FlightStatus.SCHEDULED,
        isActive: true,
      });
    }
  }

  console.log(`📦 Đang lưu ${flightsToCreate.length} chuyến bay trải rộng 7 tháng vào Supabase...`);

  // Lưu theo từng chunk 500 bản ghi để tối ưu tốc độ và không bị timeout
  const CHUNK_SIZE = 500;
  for (let i = 0; i < flightsToCreate.length; i += CHUNK_SIZE) {
    const chunk = flightsToCreate.slice(i, i + CHUNK_SIZE);
    await prisma.flight.createMany({ data: chunk });
    process.stdout.write(`   > Đã lưu ${Math.min(i + CHUNK_SIZE, flightsToCreate.length)} / ${flightsToCreate.length} chuyến bay\r`);
  }
  console.log('\n✅ Lưu danh sách chuyến bay thành công!');

  // =====================================================
  // 7. QUỸ VÉ (INVENTORIES) & SƠ ĐỒ GHẾ MẪU
  // =====================================================
  console.log('📦 Tạo Quỹ vé (FlightFareInventory) cho các chuyến bay...');

  const savedFlights = await prisma.flight.findMany({
    select: { id: true, airlineId: true, basePrice: true, departureTime: true },
  });

  const fareInventoriesToCreate: any[] = [];

  for (const f of savedFlights) {
    const ecoClass = allFareClasses.find((fc) => fc.airlineId === f.airlineId && fc.name.includes('Phổ thông'));
    const bizClass = allFareClasses.find((fc) => fc.airlineId === f.airlineId && fc.name.includes('Thương gia'));

    if (ecoClass) {
      fareInventoriesToCreate.push({
        flightId: f.id,
        fareClassId: ecoClass.id,
        price: f.basePrice,
        totalQuota: 180,
        soldCount: Math.floor(Math.random() * 25),
        isActive: true,
      });
    }

    if (bizClass) {
      fareInventoriesToCreate.push({
        flightId: f.id,
        fareClassId: bizClass.id,
        price: Math.floor(f.basePrice * 2.5),
        totalQuota: 24,
        soldCount: Math.floor(Math.random() * 6),
        isActive: true,
      });
    }
  }

  for (let i = 0; i < fareInventoriesToCreate.length; i += 1000) {
    const chunk = fareInventoriesToCreate.slice(i, i + 1000);
    await prisma.flightFareInventory.createMany({ data: chunk });
  }
  console.log(`✅ Đã tạo ${fareInventoriesToCreate.length} quỹ vé.`);

  // Tạo sơ đồ ghế chi tiết cho các chuyến bay 14 ngày tới
  console.log('💺 Tạo sơ đồ ghế chi tiết (FlightSeat) cho các chuyến bay 14 ngày tới...');
  const upcomingFlights = savedFlights.filter((f) => {
    const diffDays = (f.departureTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
  });

  const flightSeatsToCreate: any[] = [];
  const seatCols = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (const f of upcomingFlights) {
    for (let r = 1; r <= 15; r++) {
      const isBiz = r <= 3;
      for (const col of seatCols) {
        flightSeatsToCreate.push({
          flightId: f.id,
          seatNumber: `${r}${col}`,
          seatClass: isBiz ? SeatClass.BUSINESS : SeatClass.ECONOMY,
          seatType: col === 'A' || col === 'F' ? SeatType.WINDOW : col === 'C' || col === 'D' ? SeatType.AISLE : SeatType.MIDDLE,
          priceModifier: isBiz ? 0 : col === 'A' || col === 'F' ? 50000 : 0,
          isBooked: Math.random() < 0.15,
          isActive: true,
        });
      }
    }
  }

  for (let i = 0; i < flightSeatsToCreate.length; i += 1000) {
    const chunk = flightSeatsToCreate.slice(i, i + 1000);
    await prisma.flightSeat.createMany({ data: chunk });
  }
  console.log(`✅ Đã tạo ${flightSeatsToCreate.length} ghế ngồi thực tế.`);

  // =====================================================
  // 8. CÁC BẢNG MỚI: ĐIỂM ĐẾN (DESTINATIONS), YÊU THÍCH, ĐÁNH GIÁ, CẢNH BÁO GIÁ
  // =====================================================
  console.log('🌟 Tạo dữ liệu cho các bảng mới (Destinations, Reviews, Favorites, PriceAlerts)...');

  // Bảng Destination
  await db.destination.createMany({
    data: [
      {
        city: 'Phú Quốc',
        country: 'Việt Nam',
        imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=800&q=80',
        tag: 'Thiên đường biển đảo',
        description: 'Bãi biển cát trắng mịn, hoàng hôn lãng mạn và hải sản tươi ngon bậc nhất.',
        isPopular: true,
      },
      {
        city: 'Đà Nẵng',
        country: 'Việt Nam',
        imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
        tag: 'Thành phố đáng sống',
        description: 'Bà Nà Hills, Cầu Vàng, Bán đảo Sơn Trà và phố cổ Hội An kề bên.',
        isPopular: true,
      },
      {
        city: 'Seoul',
        country: 'Hàn Quốc',
        imageUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
        tag: 'Xứ sở kim chi',
        description: 'Cung điện cổ kính, thiên đường mua sắm Myeongdong và ẩm thực đường phố sôi động.',
        isPopular: true,
      },
      {
        city: 'Tokyo',
        country: 'Nhật Bản',
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
        tag: 'Xứ sở hoa anh đào',
        description: 'Sự giao thoa tuyệt vời giữa nét văn hóa truyền thống và công nghệ tương lai hiện đại.',
        isPopular: true,
      },
      {
        city: 'Bangkok',
        country: 'Thái Lan',
        imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80',
        tag: 'Thiên đường ẩm thực',
        description: 'Chùa Vàng rực rỡ, chợ nổi truyền thống và các trung tâm thương mại sầm uất.',
        isPopular: true,
      },
      {
        city: 'Singapore',
        country: 'Singapore',
        imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
        tag: 'Đảo quốc sư tử xanh',
        description: 'Gardens by the Bay, Marina Bay Sands và sân bay Changi đẹp nhất thế giới.',
        isPopular: true,
      },
      {
        city: 'Dubai',
        country: 'Các Tiểu Vương quốc Ả Rập',
        imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
        tag: 'Thành phố tương lai xa hoa',
        description: 'Tòa tháp Burj Khalifa chọc trời, đảo nhân tạo Palm Jumeirah và sa mạc safari.',
        isPopular: true,
      },
      {
        city: 'Paris',
        country: 'Pháp',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
        tag: 'Kinh đô ánh sáng',
        description: 'Tháp Eiffel biểu tượng, bảo tàng Louvre tráng lệ và vẻ đẹp thi vị ven sông Seine.',
        isPopular: true,
      },
    ],
  });

  // Bảng FavoriteFlight
  const sampleFavFlights = savedFlights.slice(0, 3);
  for (const f of sampleFavFlights) {
    await db.favoriteFlight.create({
      data: {
        userId: normalUser.id,
        flightId: f.id,
      },
    });
  }

  // Bảng FlightReview
  const firstVna = allAirlines.find((al) => al.code === 'VN')!;
  const firstKe = allAirlines.find((al) => al.code === 'KE')!;
  const firstJal = allAirlines.find((al) => al.code === 'JL')!;

  await db.flightReview.createMany({
    data: [
      {
        userId: normalUser.id,
        flightId: sampleFavFlights[0].id,
        airlineId: firstVna.id,
        rating: 5,
        title: 'Chuyến bay rất êm và đúng giờ',
        comment: 'Tiếp viên Vietnam Airlines rất chu đáo, suất ăn hoa sen ngon miệng. Ghế ngồi rộng rãi!',
      },
      {
        userId: userVIP.id,
        flightId: sampleFavFlights[1].id,
        airlineId: firstKe.id,
        rating: 5,
        title: 'Dịch vụ chuẩn 5 sao Korean Air',
        comment: 'Chuyến bay đi Incheon tuyệt vời, phòng chờ VIP sang trọng, tiếp viên nói tiếng Anh lưu loát.',
      },
      {
        userId: user2.id,
        flightId: sampleFavFlights[2].id,
        airlineId: firstJal.id,
        rating: 5,
        title: 'Trải nghiệm đỉnh cao cùng Japan Airlines',
        comment: 'Máy bay Boeing 787 rất êm, hệ thống giải trí phong phú và dịch vụ tận tâm của người Nhật.',
      },
    ],
  });

  // Bảng PriceAlert
  const sgnAirport = airportMap.get('SGN')!;
  const icnAirport = airportMap.get('ICN')!;
  const nrtAirport = airportMap.get('NRT')!;

  await db.priceAlert.createMany({
    data: [
      {
        userId: normalUser.id,
        departureAirportId: sgnAirport.id,
        arrivalAirportId: icnAirport.id,
        targetPrice: 3500000,
        isActive: true,
      },
      {
        userId: userVIP.id,
        departureAirportId: sgnAirport.id,
        arrivalAirportId: nrtAirport.id,
        targetPrice: 5000000,
        isActive: true,
      },
    ],
  });

  // =====================================================
  // 9. PROMOTIONS & NOTIFICATIONS
  // =====================================================
  console.log('🎁 Tạo Khuyến mãi & Thông báo mẫu...');

  const promo = await prisma.promotion.create({
    data: {
      code: 'SKY2027',
      title: 'Chào đón Mùa Du Lịch 2026 - 2027',
      description: 'Giảm đến 20% cho toàn bộ các chặng bay nội địa và quốc tế',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      maxDiscountAmount: 500000,
      minOrderValue: 1000000,
      startDate: new Date(),
      expiryDate: new Date('2027-12-31'),
      totalQuantity: 5000,
      claimedCount: 120,
      usedCount: 45,
      isActive: true,
    },
  });

  await prisma.userCoupon.create({
    data: {
      userId: normalUser.id,
      promotionId: promo.id,
      isUsed: false,
      isActive: true,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: normalUser.id,
        title: 'Chào mừng bạn đến với SkyJourney ✈️',
        message: 'Hệ thống đã cập nhật hơn 5.000 chuyến bay mới kết nối Việt Nam, Hàn Quốc, Nhật Bản, Châu Á suốt 7 tháng tới!',
        isRead: false,
        isActive: true,
      },
      {
        userId: normalUser.id,
        title: 'Tặng bạn mã giảm giá SKY2027 🎁',
        message: 'Nhận ngay ưu đãi giảm 20% cho chuyến bay tiếp theo của bạn.',
        isRead: false,
        isActive: true,
      },
    ],
  });

  // =====================================================
  // 10. ĐƠN ĐẶT VÉ (BOOKINGS) & VÉ ĐIỆN TỬ (TICKETS) MẪU
  // =====================================================
  console.log('🎫 Tạo Đơn đặt vé & Vé điện tử (Tickets) mẫu có status cho User...');

  const sampleFlights = await prisma.flight.findMany({
    where: {
      departureTime: { gt: new Date() },
      seats: { some: { isBooked: false } },
    },
    take: 2,
    include: {
      seats: { where: { isBooked: false }, take: 2 },
      fareInventories: { take: 1 },
    },
  });

  if (sampleFlights.length >= 2) {
    const flight1 = sampleFlights[0];
    const flight2 = sampleFlights[1];

    if (flight1.seats.length > 0 && flight2.seats.length > 0) {
      // Booking 1 cho normalUser
      const booking1 = await prisma.booking.create({
        data: {
          pnrCode: 'VN8892',
          userId: normalUser.id,
          subTotal: flight1.basePrice,
          taxAndFees: 120000,
          totalAmount: flight1.basePrice + 120000,
          status: BookingStatus.CONFIRMED,
          contactName: normalUser.fullName,
          contactEmail: normalUser.email,
          contactPhone: normalUser.phone,
          isActive: true,
        },
      });

      await db.ticket.create({
        data: {
          ticketNumber: '738-2938401928',
          bookingId: booking1.id,
          flightId: flight1.id,
          flightSeatId: flight1.seats[0].id,
          fareClassId: flight1.fareInventories[0]?.fareClassId || allFareClasses[0].id,
          direction: FlightDirection.OUTBOUND,
          passengerName: 'TRAN THI BICH NGOC',
          passengerType: PassengerType.ADULT,
          identityNumber: '079195012345',
          ticketPrice: flight1.basePrice,
          isCheckedIn: false,
          boardingTime: new Date(flight1.departureTime.getTime() - 40 * 60 * 1000),
          qrCodeData: `TICKET|738-2938401928|VN8892|${flight1.flightNumber}|TRAN THI BICH NGOC`,
          status: TicketStatus.CONFIRMED,
          isActive: true,
        },
      });

      await prisma.flightSeat.update({
        where: { id: flight1.seats[0].id },
        data: { isBooked: true },
      });

      // Booking 2 cho normalUser
      const booking2 = await prisma.booking.create({
        data: {
          pnrCode: 'VN9941',
          userId: normalUser.id,
          subTotal: flight2.basePrice,
          taxAndFees: 120000,
          totalAmount: flight2.basePrice + 120000,
          status: BookingStatus.CONFIRMED,
          contactName: normalUser.fullName,
          contactEmail: normalUser.email,
          contactPhone: normalUser.phone,
          isActive: true,
        },
      });

      await db.ticket.create({
        data: {
          ticketNumber: '738-4829104921',
          bookingId: booking2.id,
          flightId: flight2.id,
          flightSeatId: flight2.seats[0].id,
          fareClassId: flight2.fareInventories[0]?.fareClassId || allFareClasses[0].id,
          direction: FlightDirection.OUTBOUND,
          passengerName: 'TRAN THI BICH NGOC',
          passengerType: PassengerType.ADULT,
          identityNumber: '079195012345',
          ticketPrice: flight2.basePrice,
          isCheckedIn: false,
          boardingTime: new Date(flight2.departureTime.getTime() - 40 * 60 * 1000),
          qrCodeData: `TICKET|738-4829104921|VN9941|${flight2.flightNumber}|TRAN THI BICH NGOC`,
          status: TicketStatus.CONFIRMED,
          isActive: true,
        },
      });

      await prisma.flightSeat.update({
        where: { id: flight2.seats[0].id },
        data: { isBooked: true },
      });
    }
  }

  // =====================================================
  // 11. TỔNG KẾT
  // =====================================================
  console.log('\n🎉 ================== TỔNG KẾT SEED THÀNH CÔNG ==================');
  console.log(`   Users:               ${await prisma.user.count()}`);
  console.log(`   Bookings:            ${await prisma.booking.count()}`);
  console.log(`   Tickets:             ${await prisma.ticket.count()}`);
  console.log(`   Airlines:            ${await prisma.airline.count()} (VN, VJ, QH, VU, KE, OZ, JL, NH, SQ, CX, BR, QR, EK, TG)`);
  console.log(`   Airports:            ${await prisma.airport.count()} (Việt Nam, Hàn Quốc, Nhật Bản, Quốc tế)`);
  console.log(`   Aircrafts:           ${await prisma.aircraft.count()}`);
  console.log(`   SeatTemplates:       ${await prisma.seatTemplate.count()} (Sơ đồ ghế chuẩn 19 tàu bay)`);
  console.log(`   FareClasses:         ${await prisma.fareClass.count()}`);
  console.log(`   Flights:             ${await prisma.flight.count()} (Lịch bay 7 tháng tới)`);
  console.log(`   FareInventories:     ${await prisma.flightFareInventory.count()}`);
  console.log(`   FlightSeats:         ${await prisma.flightSeat.count()}`);
  console.log(`   Destinations:        ${await db.destination?.count() || 0}`);
  console.log(`   FlightReviews:       ${await db.flightReview?.count() || 0}`);
  console.log(`   PriceAlerts:         ${await db.priceAlert?.count() || 0}`);
  console.log(`   FavoriteFlights:     ${await db.favoriteFlight?.count() || 0}`);
  console.log('=================================================================\n');
}

main()
  .catch((e) => {
    console.error(' Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
