import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const ARGON2_OPTIONS: argon2.Options & { raw?: boolean } = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  };

  // ---------------------------------------------------------------------------
  // Verified user — can log in normally
  // ---------------------------------------------------------------------------
  const verifiedEmail = 'developer@codespace.dev';
  const verifiedPassword = 'Password123!';
  const verifiedName = 'Alex Dev';
  const verifiedHash = await argon2.hash(verifiedPassword, ARGON2_OPTIONS);

  const verifiedUser = await prisma.user.upsert({
    where: { email: verifiedEmail },
    update: {
      passwordHash: verifiedHash,
      name: verifiedName,
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    create: {
      email: verifiedEmail,
      passwordHash: verifiedHash,
      name: verifiedName,
      role: UserRole.USER,
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
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

  console.log(`✅ Verified user seeded:`);
  console.log(`   - ID:       ${verifiedUser.id}`);
  console.log(`   - Email:    ${verifiedEmail}`);
  console.log(`   - Password: ${verifiedPassword}`);
  console.log(`   - Status:   Email verified ✔`);

  // ---------------------------------------------------------------------------
  // Unverified user — login should be blocked (401 Email not verified)
  // ---------------------------------------------------------------------------
  const unverifiedEmail = 'unverified@codespace.dev';
  const unverifiedPassword = 'Test1234!';
  const unverifiedName = 'Unverified User';
  const unverifiedHash = await argon2.hash(unverifiedPassword, ARGON2_OPTIONS);

  const unverifiedUser = await prisma.user.upsert({
    where: { email: unverifiedEmail },
    update: {
      passwordHash: unverifiedHash,
      name: unverifiedName,
      emailVerifiedAt: null,
    },
    create: {
      email: unverifiedEmail,
      passwordHash: unverifiedHash,
      name: unverifiedName,
      role: UserRole.USER,
      emailVerifiedAt: null, // intentionally unverified
    },
  });

  console.log(`\n⚠️  Unverified user seeded (login should be blocked):`);
  console.log(`   - ID:       ${unverifiedUser.id}`);
  console.log(`   - Email:    ${unverifiedEmail}`);
  console.log(`   - Password: ${unverifiedPassword}`);
  console.log(`   - Status:   Email NOT verified ✗`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
