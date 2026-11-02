import { PrismaClient } from '@prisma/client';
import { buildSeatTemplates } from '../src/utils/seatTemplates';

const prisma = new PrismaClient();
async function main() {
  let inserted = 0;
  for (const aircraft of await prisma.aircraft.findMany({ where: { isActive: true } })) {
    const result = await prisma.seatTemplate.createMany({
      data: buildSeatTemplates(aircraft), skipDuplicates: true,
    });
    inserted += result.count;
  }
  console.log(JSON.stringify({ insertedTemplates: inserted }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
