import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = 'demo1234';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: 'demo@aicompta.app' },
    data: { passwordHash },
  });

  console.log('✅ Mot de passe défini pour demo@aicompta.app');
  console.log('   Email   : demo@aicompta.app');
  console.log('   Password: demo1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
