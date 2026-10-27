import { PrismaClient, SeatClass, SeatType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSeatTemplates() {
  console.log('🚀 Đang kiểm tra danh sách Tàu bay (Aircraft)...');
  const aircrafts = await prisma.aircraft.findMany();
  console.log(`✈️ Tìm thấy ${aircrafts.length} tàu bay.`);

  if (aircrafts.length === 0) {
    console.log('⚠️ Không tìm thấy tàu bay nào trong database.');
    return;
  }

  // Xóa seatTemplate cũ nếu có (đảm bảo sạch trước khi thêm)
  await prisma.seatTemplate.deleteMany();
  console.log('🧹 Đã dọn dẹp SeatTemplate cũ (nếu có).');

  let totalCreated = 0;

  for (const ac of aircrafts) {
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
      // 3-3-3 (mặc định cho thân rộng)
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

    // Chèn theo batch cho tàu bay này
    await prisma.seatTemplate.createMany({
      data: templates,
      skipDuplicates: true,
    });

    totalCreated += templates.length;
    console.log(`   + Tàu bay ${ac.registrationCode} (${ac.model} - ${layout}): Tạo ${templates.length} ghế mẫu.`);
  }

  console.log(`\n🎉 HOÀN THÀNH SEED: Đã tạo thành công ${totalCreated} bản ghi SeatTemplate vào Database!`);
}

seedSeatTemplates()
  .catch((e) => {
    console.error('❌ Lỗi seed SeatTemplate:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
