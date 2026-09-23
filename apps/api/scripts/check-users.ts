import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';
const p = new PrismaClient();
async function main() {
  const user = await p.user.findUnique({ where: { id: 1 }, select: { email: true, passwordHash: true } });
  const match = await bcrypt.compare('admin123', user!.passwordHash);
  console.log('Match "admin123":', match);
}
main().catch(console.error).finally(() => p.$disconnect());
