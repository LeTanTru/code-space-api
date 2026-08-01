import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const sampleEmail = 'developer@codespace.dev';
  const samplePassword = 'Password123!';
  const sampleName = 'Alex Dev';

  // Hash password using Argon2id
  const passwordHash = await argon2.hash(samplePassword);

  // Upsert sample user
  const user = await prisma.user.upsert({
    where: { email: sampleEmail },
    update: {
      passwordHash,
      name: sampleName,
    },
    create: {
      email: sampleEmail,
      passwordHash,
      name: sampleName,
      role: UserRole.USER,
      settings: {
        create: {
          theme: 'cyberpunk',
          font: 'inter',
          terminalFontSize: 14,
          soundNotifications: true,
          desktopNotifications: true,
        },
      },
    },
  });

  console.log(`✅ Sample user created/updated successfully:`);
  console.log(`   - ID: ${user.id}`);
  console.log(`   - Name: ${user.name}`);
  console.log(`   - Email: ${sampleEmail}`);
  console.log(`   - Password: ${samplePassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
