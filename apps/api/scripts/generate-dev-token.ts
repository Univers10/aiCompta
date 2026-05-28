import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@aicompta.app' },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    console.error('❌ Utilisateur demo@aicompta.app non trouvé');
    process.exit(1);
  }

  const membership = user.memberships[0];
  const secret = process.env.AUTH_SECRET || 'your-super-secret-key-min-32-chars-long-change-this-in-production';

  const token = jwt.sign(
    {
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
    },
    secret,
    { expiresIn: '7d' }
  );

  console.log('✅ Token de développement généré\n');
  console.log('👤 Utilisateur:', user.email);
  console.log('🏢 Organisation:', membership.organization.name);
  console.log('🔑 Role:', membership.role);
  console.log('\n📋 Token JWT:\n');
  console.log(token);
  console.log('\n💡 Utilisation:');
  console.log('   1. Ouvrez les DevTools du navigateur (F12)');
  console.log('   2. Onglet Application > Cookies');
  console.log('   3. Créez/modifiez le cookie "session" avec cette valeur');
  console.log('   4. Rafraîchissez la page\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
