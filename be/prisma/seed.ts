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

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu seed dữ liệu mở rộng...');

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
    prisma.user.create({
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
      },
    }),
    prisma.user.create({
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
      },
    }),
    prisma.user.create({
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
      },
    }),
    prisma.user.create({
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
      },
    }),
    prisma.user.create({
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
  // 3. SÂN BAY (AIRPORTS) - NỘI ĐỊA & QUỐC TẾ MỞ RỘNG
  // =====================================================
  console.log('🛫 Tạo danh mục Sân bay đầy đủ...');

  const airportsRaw = [
    // Trục chính & Sân bay lớn
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

    // Điểm đến du lịch & Cao nguyên
    { code: 'DLI', name: 'Sân bay Liên Khương', city: 'Đà Lạt', country: 'Việt Nam' },
    { code: 'UIH', name: 'Sân bay Phù Cát', city: 'Quy Nhơn', country: 'Việt Nam' },
    { code: 'BMV', name: 'Sân bay Buôn Ma Thuột', city: 'Buôn Ma Thuột', country: 'Việt Nam' },
    { code: 'PXU', name: 'Sân bay Pleiku', city: 'Pleiku', country: 'Việt Nam' },
    { code: 'TBB', name: 'Sân bay Tuy Hòa', city: 'Tuy Hòa', country: 'Việt Nam' },
    { code: 'THD', name: 'Sân bay Thọ Xuân', city: 'Thanh Hóa', country: 'Việt Nam' },
    { code: 'VCL', name: 'Sân bay Chu Lai', city: 'Quảng Nam', country: 'Việt Nam' },
    { code: 'VDH', name: 'Sân bay Đồng Hới', city: 'Đồng Hới', country: 'Việt Nam' },

    // Đường bay đặc biệt & Đảo
    { code: 'DIN', name: 'Sân bay Điện Biên Phủ', city: 'Điện Biên', country: 'Việt Nam' },
    { code: 'VCS', name: 'Sân bay Côn Đảo', city: 'Côn Đảo', country: 'Việt Nam' },
    { code: 'VKG', name: 'Sân bay Rạch Giá', city: 'Rạch Giá', country: 'Việt Nam' },
    { code: 'CAH', name: 'Sân bay Cà Mau', city: 'Cà Mau', country: 'Việt Nam' },

    // Tuyến quốc tế phổ biến từ Việt Nam
    { code: 'BKK', name: 'Sân bay Quốc tế Suvarnabhumi', city: 'Bangkok', country: 'Thái Lan' },
    { code: 'SIN', name: 'Sân bay Quốc tế Changi', city: 'Singapore', country: 'Singapore' },
    { code: 'ICN', name: 'Sân bay Quốc tế Incheon', city: 'Seoul', country: 'Hàn Quốc' },
    { code: 'NRT', name: 'Sân bay Quốc tế Narita', city: 'Tokyo', country: 'Nhật Bản' },
    { code: 'TPE', name: 'Sân bay Quốc tế Đào Viên', city: 'Đài Bắc', country: 'Đài Loan' },
    { code: 'KUL', name: 'Sân bay Quốc tế Kuala Lumpur', city: 'Kuala Lumpur', country: 'Malaysia' },
  ];

  const airports = await Promise.all(
    airportsRaw.map((a) => prisma.airport.create({ data: { ...a, isActive: true } }))
  );
  const airportMap = new Map(airports.map((a) => [a.code, a]));

  // =====================================================
  // 4. HÃNG HÀNG KHÔNG (AIRLINES)
  // =====================================================
  console.log('✈️ Tạo các Hãng hàng không...');

  const [VNA, VJA, QHA, VUA] = await Promise.all([
    prisma.airline.create({
      data: {
        code: 'VN',
        name: 'Vietnam Airlines',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Vietnam_Airlines_Logo.svg/1200px-Vietnam_Airlines_Logo.svg.png',
        isActive: true,
      },
    }),
    prisma.airline.create({
      data: {
        code: 'VJ',
        name: 'VietJet Air',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/VietJet_Air_logo.svg/1200px-VietJet_Air_logo.svg.png',
        isActive: true,
      },
    }),
    prisma.airline.create({
      data: {
        code: 'QH',
        name: 'Bamboo Airways',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Bamboo_Airways_logo.svg/1200px-Bamboo_Airways_logo.svg.png',
        isActive: true,
      },
    }),
    prisma.airline.create({
      data: {
        code: 'VU',
        name: 'Vietravel Airlines',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Vietravel_Airlines_logo.svg/1200px-Vietravel_Airlines_logo.svg.png',
        isActive: true,
      },
    }),
  ]);

  // =====================================================
  // 5. CÁC BIẾN THỂ MÁY BAY & SƠ ĐỒ GHẾ (AIRCRAFT VARIANTS)
  // =====================================================
  console.log('🛩️ Tạo đa dạng biến thể máy bay (Thân rộng, Thân hẹp, Phản lực vùng, Cánh quạt)...');

  interface AircraftSeedConfig {
    airlineId: string;
    registrationCode: string;
    model: string;
    seatLayout: string;
    totalSeats: number;
    businessRows: number;
    totalRows: number;
  }

  const aircraftConfigs: AircraftSeedConfig[] = [
    // VIETNAM AIRLINES: Đội bay đa dạng từ Dreamliner, A350 đến A321neo và ATR 72
    { airlineId: VNA.id, registrationCode: 'VN-A879', model: 'Boeing 787-10 Dreamliner', seatLayout: '3-3-3', totalSeats: 367, businessRows: 6, totalRows: 42 },
    { airlineId: VNA.id, registrationCode: 'VN-A861', model: 'Boeing 787-9 Dreamliner', seatLayout: '3-3-3', totalSeats: 274, businessRows: 7, totalRows: 36 },
    { airlineId: VNA.id, registrationCode: 'VN-A898', model: 'Airbus A350-900 XWB', seatLayout: '3-3-3', totalSeats: 305, businessRows: 8, totalRows: 38 },
    { airlineId: VNA.id, registrationCode: 'VN-A868', model: 'Airbus A321neo', seatLayout: '3-3', totalSeats: 203, businessRows: 4, totalRows: 35 },
    { airlineId: VNA.id, registrationCode: 'VN-A392', model: 'Airbus A321-200', seatLayout: '3-3', totalSeats: 184, businessRows: 4, totalRows: 32 },
    { airlineId: VNA.id, registrationCode: 'VN-B219', model: 'ATR 72-600 Turboprop', seatLayout: '2-2', totalSeats: 68, businessRows: 0, totalRows: 17 },

    // VIETJET AIR: A330 thân rộng, A321neo ACF, A321-200, A320-200
    { airlineId: VJA.id, registrationCode: 'VJ-A811', model: 'Airbus A330-300 Wide-Body', seatLayout: '3-3-3', totalSeats: 377, businessRows: 3, totalRows: 43 },
    { airlineId: VJA.id, registrationCode: 'VJ-A646', model: 'Airbus A321neo ACF', seatLayout: '3-3', totalSeats: 240, businessRows: 0, totalRows: 40 },
    { airlineId: VJA.id, registrationCode: 'VJ-A211', model: 'Airbus A321-200', seatLayout: '3-3', totalSeats: 230, businessRows: 0, totalRows: 39 },
    { airlineId: VJA.id, registrationCode: 'VJ-A675', model: 'Airbus A320-200', seatLayout: '3-3', totalSeats: 180, businessRows: 0, totalRows: 30 },

    // BAMBOO AIRWAYS: B787-9, A321neo, A320neo, Embraer E190
    { airlineId: QHA.id, registrationCode: 'QH-B789', model: 'Boeing 787-9 Dreamliner', seatLayout: '3-3-3', totalSeats: 294, businessRows: 6, totalRows: 37 },
    { airlineId: QHA.id, registrationCode: 'QH-A590', model: 'Airbus A321neo', seatLayout: '3-3', totalSeats: 198, businessRows: 2, totalRows: 34 },
    { airlineId: QHA.id, registrationCode: 'QH-A588', model: 'Airbus A320neo', seatLayout: '3-3', totalSeats: 170, businessRows: 2, totalRows: 29 },
    { airlineId: QHA.id, registrationCode: 'QH-A112', model: 'Embraer E190 Regional Jet', seatLayout: '2-2', totalSeats: 98, businessRows: 2, totalRows: 25 },

    // VIETRAVEL AIRLINES: A321-200 & A320-200
    { airlineId: VUA.id, registrationCode: 'VU-A350', model: 'Airbus A321-200', seatLayout: '3-3', totalSeats: 220, businessRows: 0, totalRows: 37 },
    { airlineId: VUA.id, registrationCode: 'VU-A223', model: 'Airbus A320-200', seatLayout: '3-3', totalSeats: 180, businessRows: 0, totalRows: 30 },
  ];

  const createdAircrafts = await Promise.all(
    aircraftConfigs.map((cfg) =>
      prisma.aircraft.create({
        data: {
          airlineId: cfg.airlineId,
          registrationCode: cfg.registrationCode,
          model: cfg.model,
          seatLayout: cfg.seatLayout,
          totalSeats: cfg.totalSeats,
          isActive: true,
        },
      })
    )
  );

  const aircraftMap = new Map(createdAircrafts.map((ac) => [ac.registrationCode, ac]));

  // Hàm tạo SeatTemplate tối ưu theo cấu hình ghế máy bay
  console.log('💺 Tạo SeatTemplate mẫu chuẩn cho từng dòng máy bay...');

  for (let i = 0; i < aircraftConfigs.length; i++) {
    const cfg = aircraftConfigs[i];
    const aircraft = createdAircrafts[i];
    const seatsToCreate: {
      aircraftId: string;
      seatNumber: string;
      rowNumber: number;
      columnLetter: string;
      seatClass: SeatClass;
      seatType: SeatType;
      defaultExtraPrice: number;
      isActive: boolean;
    }[] = [];

    const is2x2 = cfg.seatLayout === '2-2';
    const is3x3x3 = cfg.seatLayout === '3-3-3';
    const stdCols = is2x2
      ? ['A', 'C', 'D', 'F']
      : is3x3x3
      ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K']
      : ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let row = 1; row <= cfg.totalRows; row++) {
      const isBusiness = row <= cfg.businessRows;
      const cols = isBusiness
        ? is3x3x3
          ? ['A', 'D', 'G', 'K']
          : ['A', 'C', 'D', 'F']
        : stdCols;

      for (const col of cols) {
        let seatType: SeatType = SeatType.MIDDLE;
        if (col === 'A' || col === cols[cols.length - 1]) {
          seatType = SeatType.WINDOW;
        } else if (col === 'C' || col === 'D' || (is3x3x3 && (col === 'F' || col === 'G'))) {
          seatType = SeatType.AISLE;
        }

        const isExitRow = row === Math.floor(cfg.totalRows / 2);
        if (isExitRow && !isBusiness) seatType = SeatType.EXIT_ROW;

        seatsToCreate.push({
          aircraftId: aircraft.id,
          seatNumber: `${row}${col}`,
          rowNumber: row,
          columnLetter: col,
          seatClass: isBusiness ? SeatClass.BUSINESS : SeatClass.ECONOMY,
          seatType,
          defaultExtraPrice: isBusiness
            ? 0
            : seatType === SeatType.EXIT_ROW
            ? 120000
            : seatType === SeatType.WINDOW
            ? 60000
            : 0,
          isActive: true,
        });
      }
    }

    await prisma.seatTemplate.createMany({ data: seatsToCreate });
  }

  // =====================================================
  // 6. HẠNG VÉ (FARE CLASSES)
  // =====================================================
  console.log('🎫 Tạo Hạng vé (Fare Classes) cho 4 hãng...');

  // Vietnam Airlines
  const [fcVNA_Eco, fcVNA_Flex, fcVNA_Biz] = await Promise.all([
    prisma.fareClass.create({
      data: { airlineId: VNA.id, name: 'Phổ thông Tiêu chuẩn', carryOnBaggage: 12, checkedBaggage: 23, isRefundable: false, changeFee: 360000, isActive: true },
    }),
    prisma.fareClass.create({
      data: { airlineId: VNA.id, name: 'Phổ thông Linh hoạt', carryOnBaggage: 12, checkedBaggage: 23, isRefundable: true, changeFee: 0, isActive: true },
    }),
    prisma.fareClass.create({
      data: { airlineId: VNA.id, name: 'Thương gia (Lotus Business)', carryOnBaggage: 18, checkedBaggage: 32, isRefundable: true, changeFee: 0, isActive: true },
    }),
  ]);

  // VietJet Air
  const [fcVJA_Eco, fcVJA_Deluxe, fcVJA_SkyBoss] = await Promise.all([
    prisma.fareClass.create({
      data: { airlineId: VJA.id, name: 'Eco Tiết kiệm', carryOnBaggage: 7, checkedBaggage: 0, isRefundable: false, changeFee: 450000, isActive: true },
    }),
    prisma.fareClass.create({
      data: { airlineId: VJA.id, name: 'Deluxe Trọn gói', carryOnBaggage: 7, checkedBaggage: 20, isRefundable: false, changeFee: 150000, isActive: true },
    }),
    prisma.fareClass.create({
      data: { airlineId: VJA.id, name: 'SkyBoss Đẳng cấp', carryOnBaggage: 10, checkedBaggage: 30, isRefundable: true, changeFee: 0, isActive: true },
    }),
  ]);

  // Bamboo Airways
  const [fcQHA_Eco, fcQHA_Biz] = await Promise.all([
    prisma.fareClass.create({
      data: { airlineId: QHA.id, name: 'Bamboo Economy', carryOnBaggage: 7, checkedBaggage: 20, isRefundable: false, changeFee: 320000, isActive: true },
    }),
    prisma.fareClass.create({
      data: { airlineId: QHA.id, name: 'Bamboo Business', carryOnBaggage: 14, checkedBaggage: 30, isRefundable: true, changeFee: 0, isActive: true },
    }),
  ]);

  // Vietravel Airlines
  const [fcVUA_Eco, fcVUA_Plus] = await Promise.all([
    prisma.fareClass.create({
      data: { airlineId: VUA.id, name: 'Phổ thông Tiêu chuẩn', carryOnBaggage: 7, checkedBaggage: 0, isRefundable: false, changeFee: 350000, isActive: true },
    }),
    prisma.fareClass.create({
      data: { airlineId: VUA.id, name: 'Phổ thông Trọn gói', carryOnBaggage: 7, checkedBaggage: 20, isRefundable: true, changeFee: 100000, isActive: true },
    }),
  ]);

  // =====================================================
  // 7. DỊCH VỤ BỔ TRỢ (ANCILLARY SERVICES)
  // =====================================================
  console.log('🍽️ Tạo Dịch vụ bổ trợ (Hành lý, Suất ăn, Bảo hiểm, Phòng chờ)...');

  const [svcVNA_Bag23, svcVNA_Meal, svcVNA_Lounge, svcVJA_Bag20, svcVJA_Meal, svcVJA_Ins, svcQHA_Bag20, svcQHA_Meal] = await Promise.all([
    prisma.ancillaryService.create({ data: { airlineId: VNA.id, type: ServiceType.BAGGAGE, name: 'Hành lý ký gửi 23kg', price: 260000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: VNA.id, type: ServiceType.MEAL, name: 'Cơm tấm sườn bì chả Lotus', price: 105000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: VNA.id, type: ServiceType.LOUNGE, name: 'Phòng chờ Bông Sen Lotus Lounge', price: 380000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: VJA.id, type: ServiceType.BAGGAGE, name: 'Hành lý ký gửi 20kg', price: 220000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: VJA.id, type: ServiceType.MEAL, name: 'Bento gà nướng xôi đậu VietJet', price: 85000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: VJA.id, type: ServiceType.INSURANCE, name: 'Bảo hiểm chuyến bay VietJet Safe', price: 49000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: QHA.id, type: ServiceType.BAGGAGE, name: 'Hành lý ký gửi 20kg', price: 240000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: QHA.id, type: ServiceType.MEAL, name: 'Phở bò gia truyền Bamboo', price: 110000, isActive: true } }),
    // Dịch vụ Vietravel
    prisma.ancillaryService.create({ data: { airlineId: VUA.id, type: ServiceType.BAGGAGE, name: 'Hành lý ký gửi 20kg', price: 210000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: VUA.id, type: ServiceType.MEAL, name: 'Cơm gà ngũ vị Vietravel', price: 80000, isActive: true } }),
    prisma.ancillaryService.create({ data: { airlineId: VUA.id, type: ServiceType.INSURANCE, name: 'Bảo hiểm du lịch trọn gói', price: 55000, isActive: true } }),
  ]);

  // =====================================================
  // 8. CHUYẾN BAY (FLIGHTS) - ĐA DẠNG TUYẾN & THỜI GIAN
  // =====================================================
  console.log('🗺️ Tạo lịch bay dày đặc đa điểm đến...');

  const calcFlightDate = (daysAhead: number, hour: number, minute: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const getAirportId = (code: string) => airportMap.get(code)!.id;
  const getAircraftId = (reg: string) => aircraftMap.get(reg)!.id;

  interface FlightInput {
    flightNumber: string;
    airlineId: string;
    aircraftReg: string;
    depCode: string;
    arrCode: string;
    depOffsetDays: number;
    depHour: number;
    depMin: number;
    durationMinutes: number;
    terminal: string;
    gate: string;
    basePrice: number;
    status?: FlightStatus;
  }

  const rawFlightList: FlightInput[] = [
    // ----------------------------------------------------
    // TRỤC VÀNG: HAN <-> SGN (Siêu nhiều chuyến mỗi ngày)
    // ----------------------------------------------------
    // Hôm nay (Day 0)
    { flightNumber: 'VN204', airlineId: VNA.id, aircraftReg: 'VN-A879', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 0, depHour: 6, depMin: 0, durationMinutes: 130, terminal: 'T1', gate: 'G01', basePrice: 1250000, status: FlightStatus.COMPLETED },
    { flightNumber: 'VJ120', airlineId: VJA.id, aircraftReg: 'VJ-A811', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 0, depHour: 7, depMin: 15, durationMinutes: 130, terminal: 'T1', gate: 'G08', basePrice: 890000, status: FlightStatus.DELAYED },
    { flightNumber: 'QH202', airlineId: QHA.id, aircraftReg: 'QH-B789', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 0, depHour: 9, depMin: 30, durationMinutes: 130, terminal: 'T2', gate: 'G04', basePrice: 1100000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VU221', airlineId: VUA.id, aircraftReg: 'VU-A350', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 0, depHour: 13, depMin: 45, durationMinutes: 130, terminal: 'T1', gate: 'G12', basePrice: 799000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN218', airlineId: VNA.id, aircraftReg: 'VN-A898', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 0, depHour: 17, depMin: 0, durationMinutes: 130, terminal: 'T1', gate: 'G03', basePrice: 1350000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ136', airlineId: VJA.id, aircraftReg: 'VJ-A646', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 0, depHour: 20, depMin: 30, durationMinutes: 130, terminal: 'T1', gate: 'G09', basePrice: 850000, status: FlightStatus.SCHEDULED },

    // SGN -> HAN hôm nay & ngày mai
    { flightNumber: 'VN205', airlineId: VNA.id, aircraftReg: 'VN-A879', depCode: 'SGN', arrCode: 'HAN', depOffsetDays: 0, depHour: 10, depMin: 0, durationMinutes: 130, terminal: 'T1', gate: 'B02', basePrice: 1290000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ125', airlineId: VJA.id, aircraftReg: 'VJ-A811', depCode: 'SGN', arrCode: 'HAN', depOffsetDays: 0, depHour: 14, depMin: 30, durationMinutes: 130, terminal: 'T1', gate: 'B07', basePrice: 910000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'QH205', airlineId: QHA.id, aircraftReg: 'QH-B789', depCode: 'SGN', arrCode: 'HAN', depOffsetDays: 1, depHour: 8, depMin: 0, durationMinutes: 130, terminal: 'T2', gate: 'G02', basePrice: 1150000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN215', airlineId: VNA.id, aircraftReg: 'VN-A861', depCode: 'SGN', arrCode: 'HAN', depOffsetDays: 2, depHour: 17, depMin: 0, durationMinutes: 130, terminal: 'T1', gate: 'B04', basePrice: 1400000, status: FlightStatus.SCHEDULED },

    // Ngày mai (Day 1)
    { flightNumber: 'VN214', airlineId: VNA.id, aircraftReg: 'VN-A868', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 1, depHour: 6, depMin: 30, durationMinutes: 130, terminal: 'T1', gate: 'G05', basePrice: 1150000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ128', airlineId: VJA.id, aircraftReg: 'VJ-A211', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 1, depHour: 7, depMin: 45, durationMinutes: 130, terminal: 'T1', gate: 'G11', basePrice: 890000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'QH204', airlineId: QHA.id, aircraftReg: 'QH-A590', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 1, depHour: 11, depMin: 15, durationMinutes: 130, terminal: 'T2', gate: 'G03', basePrice: 990000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN220', airlineId: VNA.id, aircraftReg: 'VN-A861', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 3, depHour: 15, depMin: 0, durationMinutes: 130, terminal: 'T1', gate: 'G02', basePrice: 1300000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ142', airlineId: VJA.id, aircraftReg: 'VJ-A646', depCode: 'HAN', arrCode: 'SGN', depOffsetDays: 7, depHour: 18, depMin: 30, durationMinutes: 130, terminal: 'T1', gate: 'G06', basePrice: 940000, status: FlightStatus.SCHEDULED },

    // ----------------------------------------------------
    // BIỂN ĐẢO NGHỈ DƯỠNG: PHÚ QUỐC (PQC) & NHA TRANG (CXR)
    // ----------------------------------------------------
    { flightNumber: 'VN1823', airlineId: VNA.id, aircraftReg: 'VN-A868', depCode: 'SGN', arrCode: 'PQC', depOffsetDays: 1, depHour: 7, depMin: 15, durationMinutes: 60, terminal: 'T1', gate: 'B03', basePrice: 750000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ321', airlineId: VJA.id, aircraftReg: 'VJ-A675', depCode: 'SGN', arrCode: 'PQC', depOffsetDays: 1, depHour: 9, depMin: 40, durationMinutes: 60, terminal: 'T1', gate: 'B10', basePrice: 590000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'QH1621', airlineId: QHA.id, aircraftReg: 'QH-A588', depCode: 'HAN', arrCode: 'PQC', depOffsetDays: 2, depHour: 6, depMin: 45, durationMinutes: 125, terminal: 'T2', gate: 'G07', basePrice: 1450000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN1232', airlineId: VNA.id, aircraftReg: 'VN-A392', depCode: 'HAN', arrCode: 'PQC', depOffsetDays: 3, depHour: 10, depMin: 15, durationMinutes: 125, terminal: 'T1', gate: 'G04', basePrice: 1680000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN1824', airlineId: VNA.id, aircraftReg: 'VN-A868', depCode: 'PQC', arrCode: 'SGN', depOffsetDays: 4, depHour: 16, depMin: 30, durationMinutes: 60, terminal: 'T1', gate: 'G02', basePrice: 780000, status: FlightStatus.SCHEDULED },

    // Nha Trang
    { flightNumber: 'VN1380', airlineId: VNA.id, aircraftReg: 'VN-A392', depCode: 'SGN', arrCode: 'CXR', depOffsetDays: 1, depHour: 8, depMin: 20, durationMinutes: 65, terminal: 'T1', gate: 'B05', basePrice: 620000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ602', airlineId: VJA.id, aircraftReg: 'VJ-A675', depCode: 'SGN', arrCode: 'CXR', depOffsetDays: 2, depHour: 11, depMin: 0, durationMinutes: 65, terminal: 'T1', gate: 'C03', basePrice: 480000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN1556', airlineId: VNA.id, aircraftReg: 'VN-A868', depCode: 'HAN', arrCode: 'CXR', depOffsetDays: 2, depHour: 12, depMin: 30, durationMinutes: 110, terminal: 'T1', gate: 'G06', basePrice: 1280000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'QH254', airlineId: QHA.id, aircraftReg: 'QH-A590', depCode: 'HAN', arrCode: 'CXR', depOffsetDays: 5, depHour: 10, depMin: 0, durationMinutes: 110, terminal: 'T2', gate: 'G02', basePrice: 1190000, status: FlightStatus.SCHEDULED },

    // ----------------------------------------------------
    // MIỀN TRUNG & CỐ ĐÔ: ĐÀ NẴNG (DAD), HUẾ (HUI), QUY NHƠN (UIH)
    // ----------------------------------------------------
    { flightNumber: 'VN1560', airlineId: VNA.id, aircraftReg: 'VN-A868', depCode: 'HAN', arrCode: 'DAD', depOffsetDays: 1, depHour: 8, depMin: 30, durationMinutes: 80, terminal: 'T1', gate: 'G08', basePrice: 790000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ512', airlineId: VJA.id, aircraftReg: 'VJ-A211', depCode: 'HAN', arrCode: 'DAD', depOffsetDays: 1, depHour: 14, depMin: 0, durationMinutes: 80, terminal: 'T1', gate: 'G14', basePrice: 620000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN112', airlineId: VNA.id, aircraftReg: 'VN-A898', depCode: 'SGN', arrCode: 'DAD', depOffsetDays: 2, depHour: 7, depMin: 0, durationMinutes: 85, terminal: 'T1', gate: 'B01', basePrice: 850000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ580', airlineId: VJA.id, aircraftReg: 'VJ-A646', depCode: 'SGN', arrCode: 'DAD', depOffsetDays: 2, depHour: 9, depMin: 45, durationMinutes: 85, terminal: 'T1', gate: 'C01', basePrice: 650000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'QH382', airlineId: QHA.id, aircraftReg: 'QH-A590', depCode: 'HAN', arrCode: 'DAD', depOffsetDays: 3, depHour: 11, depMin: 0, durationMinutes: 80, terminal: 'T2', gate: 'G01', basePrice: 720000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN1542', airlineId: VNA.id, aircraftReg: 'VN-A392', depCode: 'HAN', arrCode: 'HUI', depOffsetDays: 2, depHour: 15, depMin: 15, durationMinutes: 75, terminal: 'T1', gate: 'G03', basePrice: 810000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN1392', airlineId: VNA.id, aircraftReg: 'VN-A392', depCode: 'SGN', arrCode: 'UIH', depOffsetDays: 2, depHour: 13, depMin: 0, durationMinutes: 70, terminal: 'T1', gate: 'B06', basePrice: 690000, status: FlightStatus.SCHEDULED },

    // ----------------------------------------------------
    // CAO NGUYÊN HOA & NÚI RỪNG: ĐÀ LẠT (DLI) & BUÔN MA THUỘT (BMV)
    // ----------------------------------------------------
    { flightNumber: 'VN1370', airlineId: VNA.id, aircraftReg: 'VN-A868', depCode: 'SGN', arrCode: 'DLI', depOffsetDays: 1, depHour: 10, depMin: 30, durationMinutes: 55, terminal: 'T1', gate: 'B08', basePrice: 610000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ362', airlineId: VJA.id, aircraftReg: 'VJ-A675', depCode: 'SGN', arrCode: 'DLI', depOffsetDays: 2, depHour: 15, depMin: 20, durationMinutes: 55, terminal: 'T1', gate: 'C05', basePrice: 470000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN1574', airlineId: VNA.id, aircraftReg: 'VN-A868', depCode: 'HAN', arrCode: 'DLI', depOffsetDays: 3, depHour: 8, depMin: 10, durationMinutes: 110, terminal: 'T1', gate: 'G07', basePrice: 1320000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN1412', airlineId: VNA.id, aircraftReg: 'VN-A392', depCode: 'SGN', arrCode: 'BMV', depOffsetDays: 4, depHour: 9, depMin: 0, durationMinutes: 60, terminal: 'T1', gate: 'B09', basePrice: 580000, status: FlightStatus.SCHEDULED },

    // ----------------------------------------------------
    // CHẶNG ĐẶC BIỆT: CÔN ĐẢO (VCS) & ĐIỆN BIÊN (DIN) - ATR 72 & EMBRAER
    // ----------------------------------------------------
    { flightNumber: 'VN8051', airlineId: VNA.id, aircraftReg: 'VN-B219', depCode: 'SGN', arrCode: 'VCS', depOffsetDays: 1, depHour: 6, depMin: 45, durationMinutes: 50, terminal: 'T1', gate: 'A01', basePrice: 1450000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'QH1031', airlineId: QHA.id, aircraftReg: 'QH-A112', depCode: 'SGN', arrCode: 'VCS', depOffsetDays: 1, depHour: 12, depMin: 30, durationMinutes: 45, terminal: 'T2', gate: 'A03', basePrice: 1520000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'QH1032', airlineId: QHA.id, aircraftReg: 'QH-A112', depCode: 'VCS', arrCode: 'SGN', depOffsetDays: 3, depHour: 15, depMin: 0, durationMinutes: 45, terminal: 'T1', gate: 'G01', basePrice: 1550000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN8202', airlineId: VNA.id, aircraftReg: 'VN-B219', depCode: 'HAN', arrCode: 'DIN', depOffsetDays: 2, depHour: 9, depMin: 15, durationMinutes: 65, terminal: 'T1', gate: 'A02', basePrice: 950000, status: FlightStatus.SCHEDULED },

    // ----------------------------------------------------
    // ĐƯỜNG BAY QUỐC TẾ KHU VỰC CHÂU Á (BKK, SIN, ICN, NRT)
    // ----------------------------------------------------
    { flightNumber: 'VN601', airlineId: VNA.id, aircraftReg: 'VN-A868', depCode: 'SGN', arrCode: 'BKK', depOffsetDays: 2, depHour: 8, depMin: 45, durationMinutes: 95, terminal: 'T2', gate: 'I15', basePrice: 1850000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ803', airlineId: VJA.id, aircraftReg: 'VJ-A646', depCode: 'SGN', arrCode: 'BKK', depOffsetDays: 2, depHour: 11, depMin: 15, durationMinutes: 95, terminal: 'T2', gate: 'I18', basePrice: 1390000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN651', airlineId: VNA.id, aircraftReg: 'VN-A898', depCode: 'SGN', arrCode: 'SIN', depOffsetDays: 3, depHour: 9, depMin: 10, durationMinutes: 125, terminal: 'T2', gate: 'I20', basePrice: 2200000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN414', airlineId: VNA.id, aircraftReg: 'VN-A879', depCode: 'HAN', arrCode: 'ICN', depOffsetDays: 4, depHour: 10, depMin: 30, durationMinutes: 255, terminal: 'T2', gate: 'I24', basePrice: 4850000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VJ960', airlineId: VJA.id, aircraftReg: 'VJ-A811', depCode: 'HAN', arrCode: 'ICN', depOffsetDays: 4, depHour: 1, depMin: 45, durationMinutes: 255, terminal: 'T2', gate: 'I22', basePrice: 3200000, status: FlightStatus.SCHEDULED },
    { flightNumber: 'VN300', airlineId: VNA.id, aircraftReg: 'VN-A898', depCode: 'HAN', arrCode: 'NRT', depOffsetDays: 5, depHour: 0, depMin: 20, durationMinutes: 320, terminal: 'T2', gate: 'I26', basePrice: 6500000, status: FlightStatus.SCHEDULED },
  ];

  const flights = await Promise.all(
    rawFlightList.map((f) => {
      const depTime = calcFlightDate(f.depOffsetDays, f.depHour, f.depMin);
      const arrTime = new Date(depTime.getTime() + f.durationMinutes * 60 * 1000);

      return prisma.flight.create({
        data: {
          flightNumber: f.flightNumber,
          airlineId: f.airlineId,
          aircraftId: getAircraftId(f.aircraftReg),
          departureAirportId: getAirportId(f.depCode),
          arrivalAirportId: getAirportId(f.arrCode),
          departureTime: depTime,
          arrivalTime: arrTime,
          terminal: f.terminal,
          gate: f.gate,
          basePrice: f.basePrice,
          status: f.status ?? FlightStatus.SCHEDULED,
          isActive: true,
        },
      });
    })
  );

  // =====================================================
  // 9. QUỸ VÉ (INVENTORIES) & SƠ ĐỒ GHẾ THỰC TẾ TRÊN CHUYẾN
  // =====================================================
  console.log('🪑 Tạo Quỹ vé & Sơ đồ ghế thực tế cho toàn bộ chuyến bay...');

  for (const flight of flights) {
    const aircraft = createdAircrafts.find((a) => a.id === flight.aircraftId)!;
    const cfg = aircraftConfigs.find((c) => c.registrationCode === aircraft.registrationCode)!;

    // 1. Quỹ vé theo FareClass
    if (flight.airlineId === VNA.id) {
      await prisma.flightFareInventory.createMany({
        data: [
          { flightId: flight.id, fareClassId: fcVNA_Eco.id, price: flight.basePrice, totalQuota: 150, soldCount: Math.floor(Math.random() * 45), isActive: true },
          { flightId: flight.id, fareClassId: fcVNA_Flex.id, price: flight.basePrice + 350000, totalQuota: 40, soldCount: Math.floor(Math.random() * 15), isActive: true },
          { flightId: flight.id, fareClassId: fcVNA_Biz.id, price: flight.basePrice * 3, totalQuota: cfg.businessRows > 0 ? 16 : 0, soldCount: Math.floor(Math.random() * 6), isActive: true },
        ],
      });
    } else if (flight.airlineId === VJA.id) {
      await prisma.flightFareInventory.createMany({
        data: [
          { flightId: flight.id, fareClassId: fcVJA_Eco.id, price: flight.basePrice, totalQuota: 180, soldCount: Math.floor(Math.random() * 60), isActive: true },
          { flightId: flight.id, fareClassId: fcVJA_Deluxe.id, price: flight.basePrice + 290000, totalQuota: 40, soldCount: Math.floor(Math.random() * 12), isActive: true },
          { flightId: flight.id, fareClassId: fcVJA_SkyBoss.id, price: flight.basePrice + 650000, totalQuota: 20, soldCount: Math.floor(Math.random() * 5), isActive: true },
        ],
      });
    } else if (flight.airlineId === QHA.id) {
      await prisma.flightFareInventory.createMany({
        data: [
          { flightId: flight.id, fareClassId: fcQHA_Eco.id, price: flight.basePrice, totalQuota: 160, soldCount: Math.floor(Math.random() * 40), isActive: true },
          { flightId: flight.id, fareClassId: fcQHA_Biz.id, price: Math.floor(flight.basePrice * 2.6), totalQuota: cfg.businessRows > 0 ? 18 : 0, soldCount: Math.floor(Math.random() * 5), isActive: true },
        ],
      });
    } else {
      // Vietravel
      await prisma.flightFareInventory.createMany({
        data: [
          { flightId: flight.id, fareClassId: fcVUA_Eco.id, price: flight.basePrice, totalQuota: 160, soldCount: Math.floor(Math.random() * 35), isActive: true },
          { flightId: flight.id, fareClassId: fcVUA_Plus.id, price: flight.basePrice + 280000, totalQuota: 35, soldCount: Math.floor(Math.random() * 10), isActive: true },
        ],
      });
    }

    // 2. FlightSeats: tạo từ các hàng đại diện chuẩn (đủ cả Business, Economy, Window, Middle, Aisle, Exit Row)
    const is2x2 = cfg.seatLayout === '2-2';
    const is3x3x3 = cfg.seatLayout === '3-3-3';
    const stdCols = is2x2
      ? ['A', 'C', 'D', 'F']
      : is3x3x3
      ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K']
      : ['A', 'B', 'C', 'D', 'E', 'F'];

    const flightSeatsToCreate: {
      flightId: string;
      seatNumber: string;
      seatClass: SeatClass;
      seatType: SeatType;
      priceModifier: number;
      isBooked: boolean;
      isActive: boolean;
    }[] = [];

    // Chọn số hàng tạo thực tế (tối đa 24 hàng để hiệu năng DB cực mượt mà vẫn đầy đủ dữ liệu thực chiến)
    const effectiveRows = Math.min(cfg.totalRows, 24);

    for (let row = 1; row <= effectiveRows; row++) {
      const isBusiness = row <= cfg.businessRows;
      const cols = isBusiness
        ? is3x3x3
          ? ['A', 'D', 'G', 'K']
          : ['A', 'C', 'D', 'F']
        : stdCols;

      for (const col of cols) {
        let seatType: SeatType = SeatType.MIDDLE;
        if (col === 'A' || col === cols[cols.length - 1]) {
          seatType = SeatType.WINDOW;
        } else if (col === 'C' || col === 'D' || (is3x3x3 && (col === 'F' || col === 'G'))) {
          seatType = SeatType.AISLE;
        }

        const isExitRow = row === Math.floor(effectiveRows / 2);
        if (isExitRow && !isBusiness) seatType = SeatType.EXIT_ROW;

        flightSeatsToCreate.push({
          flightId: flight.id,
          seatNumber: `${row}${col}`,
          seatClass: isBusiness ? SeatClass.BUSINESS : SeatClass.ECONOMY,
          seatType,
          priceModifier: isBusiness ? 0 : seatType === SeatType.EXIT_ROW ? 120000 : seatType === SeatType.WINDOW ? 60000 : 0,
          isBooked: false,
          isActive: true,
        });
      }
    }

    await prisma.flightSeat.createMany({ data: flightSeatsToCreate });
  }

  // =====================================================
  // 10. CHƯƠNG TRÌNH KHUYẾN MÃI (PROMOTIONS)
  // =====================================================
  console.log('🎁 Tạo danh sách Mã giảm giá & Ví Coupon...');

  const promotions = await Promise.all([
    prisma.promotion.create({
      data: {
        code: 'TET2027',
        title: 'Ưu đãi Tết Đinh Mùi 2027',
        description: 'Giảm 15% tất cả các chuyến bay dịp Tết đoàn viên, tối đa 500.000đ',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        maxDiscountAmount: 500000,
        minOrderValue: 1200000,
        startDate: new Date('2026-11-01'),
        expiryDate: new Date('2027-02-28'),
        totalQuantity: 2000,
        claimedCount: 420,
        usedCount: 310,
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        code: 'BAYCUNGVNA',
        title: 'Trải nghiệm 4 sao cùng Vietnam Airlines',
        description: 'Giảm ngay 200.000đ khi đặt vé chặng Hà Nội - TP. HCM hoặc Quốc tế',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 200000,
        maxDiscountAmount: 200000,
        minOrderValue: 1500000,
        startDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-12-31'),
        totalQuantity: 1000,
        claimedCount: 150,
        usedCount: 95,
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        code: 'SUMMER2027',
        title: 'Chào Hè Rực Rỡ 2027',
        description: 'Giảm 25% cho tất cả các đường bay tới Phú Quốc, Nha Trang, Đà Nẵng, Đà Lạt',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 25,
        maxDiscountAmount: 600000,
        minOrderValue: 900000,
        startDate: new Date('2027-04-01'),
        expiryDate: new Date('2027-08-31'),
        totalQuantity: 3000,
        claimedCount: 52,
        usedCount: 20,
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        code: 'NEWUSER100K',
        title: 'Quà tặng chào mừng Bạn Mới',
        description: 'Đăng ký tài khoản lần đầu, nhận ngay mã giảm 100.000đ cho chuyến bay đầu tiên',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 100000,
        maxDiscountAmount: 100000,
        minOrderValue: 600000,
        startDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-12-31'),
        totalQuantity: 10000,
        claimedCount: 2840,
        usedCount: 2610,
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        code: 'VIPBUSINESS',
        title: 'Đặc quyền Hạng Thương Gia',
        description: 'Giảm ngay 500.000đ cho khách hàng đặt vé hạng Business trên toàn mạng bay',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 500000,
        maxDiscountAmount: 500000,
        minOrderValue: 3000000,
        startDate: new Date('2026-01-01'),
        expiryDate: new Date('2027-12-31'),
        totalQuantity: 500,
        claimedCount: 45,
        usedCount: 30,
        isActive: true,
      },
    }),
  ]);

  const [promoTet, promoVNA, promoSummer, promoNewUser, promoBiz] = promotions;

  // Gán Coupon vào ví người dùng
  await Promise.all([
    prisma.userCoupon.create({ data: { userId: normalUser.id, promotionId: promoTet.id, isUsed: false, isActive: true } }),
    prisma.userCoupon.create({ data: { userId: normalUser.id, promotionId: promoNewUser.id, isUsed: true, usedAt: new Date(), isActive: true } }),
    prisma.userCoupon.create({ data: { userId: normalUser.id, promotionId: promoVNA.id, isUsed: false, isActive: true } }),
    prisma.userCoupon.create({ data: { userId: user2.id, promotionId: promoSummer.id, isUsed: false, isActive: true } }),
    prisma.userCoupon.create({ data: { userId: userVIP.id, promotionId: promoBiz.id, isUsed: false, isActive: true } }),
  ]);

  // =====================================================
  // 11. ĐƠN ĐẶT CHỖ (BOOKINGS), VÉ (TICKETS), THANH TOÁN & HÀNH LÝ
  // =====================================================
  console.log('💳 Tạo nhiều Booking thực tế, Vé, Thanh toán & Thẻ hành lý...');

  // Booking 1: normalUser - Khứ hồi HAN <-> SGN (Đã xác nhận, VNPay, có Thẻ hành lý & Suất ăn)
  const flightVNA_Out = flights.find((f) => f.flightNumber === 'VN214')!;
  const flightVNA_In = flights.find((f) => f.flightNumber === 'VN215')!;

  const seat1A = await prisma.flightSeat.findFirst({ where: { flightId: flightVNA_Out.id, seatNumber: '5A' } });
  const seat1C = await prisma.flightSeat.findFirst({ where: { flightId: flightVNA_Out.id, seatNumber: '5C' } });
  const seatRetA = await prisma.flightSeat.findFirst({ where: { flightId: flightVNA_In.id, seatNumber: '8A' } });
  const seatRetC = await prisma.flightSeat.findFirst({ where: { flightId: flightVNA_In.id, seatNumber: '8C' } });

  if (seat1A && seat1C && seatRetA && seatRetC) {
    const booking1 = await prisma.booking.create({
      data: {
        pnrCode: 'VN839X',
        userId: normalUser.id,
        isRoundTrip: true,
        subTotal: 5080000,
        taxAndFees: 480000,
        discountAmount: 200000,
        totalAmount: 5360000,
        status: BookingStatus.CONFIRMED,
        contactName: 'Trần Thị Bích Ngọc',
        contactEmail: 'user@gmail.com',
        contactPhone: '0912345678',
        isActive: true,
      },
    });

    await prisma.flightSeat.updateMany({
      where: { id: { in: [seat1A.id, seat1C.id, seatRetA.id, seatRetC.id] } },
      data: { isBooked: true },
    });

    // Vé lượt đi - Người lớn
    const ticket1 = await prisma.ticket.create({
      data: {
        ticketNumber: '738-9281029001',
        bookingId: booking1.id,
        flightId: flightVNA_Out.id,
        flightSeatId: seat1A.id,
        fareClassId: fcVNA_Eco.id,
        direction: FlightDirection.OUTBOUND,
        passengerName: 'TRAN THI BICH NGOC',
        passengerType: PassengerType.ADULT,
        dateOfBirth: new Date('1995-06-15'),
        identityNumber: '079195012345',
        ticketPrice: 1350000,
        isCheckedIn: true,
        boardingTime: new Date(flightVNA_Out.departureTime.getTime() - 40 * 60 * 1000),
        qrCodeData: `BCBP:VN839X:VN214:HAN:SGN:738-9281029001:5A`,
        isActive: true,
      },
    });

    // Vé lượt đi - Trẻ em
    await prisma.ticket.create({
      data: {
        ticketNumber: '738-9281029002',
        bookingId: booking1.id,
        flightId: flightVNA_Out.id,
        flightSeatId: seat1C.id,
        fareClassId: fcVNA_Eco.id,
        direction: FlightDirection.OUTBOUND,
        passengerName: 'TRAN MINH KHOI',
        passengerType: PassengerType.CHILD,
        dateOfBirth: new Date('2018-03-20'),
        ticketPrice: 950000,
        isCheckedIn: true,
        boardingTime: new Date(flightVNA_Out.departureTime.getTime() - 40 * 60 * 1000),
        qrCodeData: `BCBP:VN839X:VN214:HAN:SGN:738-9281029002:5C`,
        isActive: true,
      },
    });

    // Dịch vụ mua thêm (Addons)
    await prisma.ticketAddon.createMany({
      data: [
        { ticketId: ticket1.id, serviceId: svcVNA_Bag23.id, quantity: 1, priceAtBooking: 260000, isActive: true },
        { ticketId: ticket1.id, serviceId: svcVNA_Meal.id, quantity: 1, priceAtBooking: 105000, isActive: true },
        { ticketId: ticket1.id, serviceId: svcVNA_Lounge.id, quantity: 1, priceAtBooking: 380000, isActive: true },
      ],
    });

    // Quản lý thẻ hành lý ký gửi (Luggage Check-in)
    await prisma.luggageCheckIn.create({
      data: {
        ticketId: ticket1.id,
        baggageTagCode: 'VN-HAN-098214',
        weightKg: 21.5,
        status: BaggageStatus.LOADED,
        isActive: true,
      },
    });

    // Thanh toán thành công VNPAY
    await prisma.payment.create({
      data: {
        bookingId: booking1.id,
        paymentMethod: PaymentMethod.VNPAY,
        transactionCode: 'VNPAY202610250012',
        amount: 5360000,
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
        isActive: true,
      },
    });
  }

  // Booking 2: user2 - Một chiều HAN -> SGN (Chờ thanh toán qua PayOS)
  const flightVJ = flights.find((f) => f.flightNumber === 'VJ128')!;
  const seatVJ = await prisma.flightSeat.findFirst({ where: { flightId: flightVJ.id, seatNumber: '12F' } });

  if (seatVJ) {
    const booking2 = await prisma.booking.create({
      data: {
        pnrCode: 'VJ098M',
        userId: user2.id,
        isRoundTrip: false,
        subTotal: 890000,
        taxAndFees: 90000,
        discountAmount: 100000,
        totalAmount: 880000,
        status: BookingStatus.PENDING,
        contactName: 'Lê Văn Minh',
        contactEmail: 'khach@gmail.com',
        contactPhone: '0923456789',
        isActive: true,
      },
    });

    await prisma.flightSeat.update({ where: { id: seatVJ.id }, data: { isBooked: true } });

    await prisma.ticket.create({
      data: {
        ticketNumber: '738-9281029003',
        bookingId: booking2.id,
        flightId: flightVJ.id,
        flightSeatId: seatVJ.id,
        fareClassId: fcVJA_Eco.id,
        direction: FlightDirection.OUTBOUND,
        passengerName: 'LE VAN MINH',
        passengerType: PassengerType.ADULT,
        dateOfBirth: new Date('1990-11-20'),
        identityNumber: '031090056789',
        ticketPrice: 890000,
        isCheckedIn: false,
        boardingTime: new Date(flightVJ.departureTime.getTime() - 30 * 60 * 1000),
        qrCodeData: `BCBP:VJ098M:VJ128:HAN:SGN:738-9281029003:12F`,
        isActive: true,
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking2.id,
        paymentMethod: PaymentMethod.PAYOS,
        amount: 880000,
        status: PaymentStatus.PENDING,
        isActive: true,
      },
    });
  }

  // Booking 3: userVIP - Đặt vé Thương gia Dreamliner B787-10 HAN -> ICN (Seoul)
  const flightICN = flights.find((f) => f.flightNumber === 'VN414')!;
  const seatBiz = await prisma.flightSeat.findFirst({ where: { flightId: flightICN.id, seatClass: SeatClass.BUSINESS, isBooked: false } });

  if (seatBiz) {
    const booking3 = await prisma.booking.create({
      data: {
        pnrCode: 'VN888VIP',
        userId: userVIP.id,
        isRoundTrip: false,
        subTotal: 14550000,
        taxAndFees: 1200000,
        discountAmount: 500000,
        totalAmount: 15250000,
        status: BookingStatus.CONFIRMED,
        contactName: 'Phạm Nhật Hoàng',
        contactEmail: 'hoang.vip@flightapp.vn',
        contactPhone: '0988888999',
        isActive: true,
      },
    });

    await prisma.flightSeat.update({ where: { id: seatBiz.id }, data: { isBooked: true } });

    await prisma.ticket.create({
      data: {
        ticketNumber: '738-9281029999',
        bookingId: booking3.id,
        flightId: flightICN.id,
        flightSeatId: seatBiz.id,
        fareClassId: fcVNA_Biz.id,
        direction: FlightDirection.OUTBOUND,
        passengerName: 'PHAM NHAT HOANG',
        passengerType: PassengerType.ADULT,
        dateOfBirth: new Date('1988-08-18'),
        identityNumber: '001088019988',
        ticketPrice: 14550000,
        isCheckedIn: true,
        boardingTime: new Date(flightICN.departureTime.getTime() - 45 * 60 * 1000),
        qrCodeData: `BCBP:VN888VIP:VN414:HAN:ICN:738-9281029999:${seatBiz.seatNumber}`,
        isActive: true,
      },
    });

    await prisma.payment.create({
      data: {
        bookingId: booking3.id,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        transactionCode: 'VISA_AUTH_891278',
        amount: 15250000,
        status: PaymentStatus.SUCCESS,
        paidAt: new Date(),
        isActive: true,
      },
    });
  }

  // Booking 4: Đã huỷ và yêu cầu hoàn tiền (RefundCancelRequest)
  const flightCancel = flights.find((f) => f.flightNumber === 'VN1370')!;
  const seatRefund = await prisma.flightSeat.findFirst({ where: { flightId: flightCancel.id, seatNumber: '6D' } });

  if (seatRefund) {
    const booking4 = await prisma.booking.create({
      data: {
        pnrCode: 'RFND99',
        userId: normalUser.id,
        isRoundTrip: false,
        subTotal: 960000,
        taxAndFees: 90000,
        discountAmount: 0,
        totalAmount: 1050000,
        status: BookingStatus.CANCELLED,
        contactName: 'Trần Thị Bích Ngọc',
        contactEmail: 'user@gmail.com',
        contactPhone: '0912345678',
        isActive: true,
      },
    });

    await prisma.refundCancelRequest.create({
      data: {
        bookingId: booking4.id,
        reason: 'Có việc bận gia đình đột xuất không thể tham gia chuyến bay',
        penaltyFee: 360000,
        refundAmount: 690000,
        status: RefundStatus.APPROVED,
        isActive: true,
        requestedAt: new Date(),
        processedAt: new Date(),
      },
    });
  }

  // =====================================================
  // 12. THÔNG BÁO (NOTIFICATIONS)
  // =====================================================
  console.log('🔔 Tạo hệ thống Thông báo cá nhân hóa...');

  await prisma.notification.createMany({
    data: [
      {
        userId: normalUser.id,
        title: 'Đặt vé thành công! ✈️',
        message: 'Đơn đặt chỗ mã VN839X khứ hồi Hà Nội - TP. HCM đã xác nhận. Chúc bạn có một hành trình bay tuyệt vời!',
        isRead: true,
        isActive: true,
      },
      {
        userId: normalUser.id,
        title: 'Nhắc nhở làm thủ tục trực tuyến',
        message: 'Chuyến bay VN214 của bạn sẽ khởi hành trong 24h tới. Check-in ngay để nhận thẻ lên tàu bay điện tử!',
        isRead: false,
        isActive: true,
      },
      {
        userId: normalUser.id,
        title: 'Hành lý ký gửi đã lên máy bay 🧳',
        message: 'Kiện hành lý VN-HAN-098214 đã được bốc dỡ an toàn vào khoang hàng máy bay Airbus A321neo.',
        isRead: false,
        isActive: true,
      },
      {
        userId: normalUser.id,
        title: 'Yêu cầu hoàn vé được chấp thuận 💰',
        message: 'Yêu cầu hoàn vé đơn RFND99 đã được phê duyệt. Số tiền 690.000đ sẽ chuyển về tài khoản của bạn trong 2-3 ngày làm việc.',
        isRead: false,
        isActive: true,
      },
      {
        userId: user2.id,
        title: 'Giữ chỗ đơn đặt vé VJ098M ⏳',
        message: 'Đơn vé đi TP. HCM đang chờ thanh toán qua PayOS. Vui lòng thanh toán trong vòng 15 phút để đảm bảo giữ ghế.',
        isRead: false,
        isActive: true,
      },
      {
        userId: userVIP.id,
        title: 'Chào mừng Hội viên Bông Sen Vàng Platinum 🌟',
        message: 'Đơn vé Thương gia VN888VIP tới Incheon (Seoul) đã sẵn sàng. Bạn được quyền sử dụng phòng chờ Lotus Lounge tại Nhà ga T2.',
        isRead: true,
        isActive: true,
      },
      {
        userId: adminUser.id,
        title: 'Cập nhật hệ thống dữ liệu hoàn tất ✅',
        message: 'Đã hoàn tất seed mở rộng 28 sân bay, 16 biến thể tàu bay hiện đại và hơn 40 chuyến bay thực chiến.',
        isRead: false,
        isActive: true,
      },
    ],
  });

  // =====================================================
  // 13. TỔNG KẾT DỮ LIỆU
  // =====================================================
  console.log('\n🎉 ================== TỔNG KẾT SEED THÀNH CÔNG ==================');
  console.log(`   👥 Users:               ${await prisma.user.count()}`);
  console.log(`   📇 SavedPassengers:     ${await prisma.savedPassenger.count()}`);
  console.log(`   🏢 Airlines:            ${await prisma.airline.count()}`);
  console.log(`   🛫 Airports:            ${await prisma.airport.count()}`);
  console.log(`   🛩️  Aircrafts:           ${await prisma.aircraft.count()}`);
  console.log(`   📐 SeatTemplates:       ${await prisma.seatTemplate.count()}`);
  console.log(`   🎫 FareClasses:         ${await prisma.fareClass.count()}`);
  console.log(`   🍽️  AncillaryServices:   ${await prisma.ancillaryService.count()}`);
  console.log(`   ✈️  Flights:             ${await prisma.flight.count()}`);
  console.log(`   📦 FareInventories:     ${await prisma.flightFareInventory.count()}`);
  console.log(`   💺 FlightSeats:         ${await prisma.flightSeat.count()}`);
  console.log(`   🎟️  Promotions:          ${await prisma.promotion.count()}`);
  console.log(`   💳 Bookings:            ${await prisma.booking.count()}`);
  console.log(`   📄 Tickets:             ${await prisma.ticket.count()}`);
  console.log(`   🧳 LuggageCheckIns:     ${await prisma.luggageCheckIn.count()}`);
  console.log(`   💵 Payments:            ${await prisma.payment.count()}`);
  console.log(`   🔔 Notifications:       ${await prisma.notification.count()}`);
  console.log('=================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

