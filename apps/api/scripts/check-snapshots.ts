import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const loans = await prisma.loan.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      createdAt: true,
      readerNameSnapshot: true,
      bookTitleSnapshot: true,
      createdByNameSnapshot: true,
      reader: { select: { name: true } },
      book: { select: { title: true } },
    },
  });
  console.log(JSON.stringify(loans, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
