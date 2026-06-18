import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const SEED_ACCOUNT_COUNT = Number.parseInt(
  process.env.SEED_ACCOUNT_COUNT ?? '20',
  10,
);
const SEED_EMAIL_DOMAIN = 'seed.ai-study-hub.local';
const SEED_PASSWORD = 'Password123!';
const SEED_PASSWORD_SALT_ROUNDS = 10;
type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';
type UserStatus = 'ACTIVE' | 'UNVERIFIED' | 'BANNED' | 'DELETED';

type SeedAccount = {
  email: string;
  name: string;
  password: string;
  avatarUrl: string;
  role: UserRole;
  status: UserStatus;
};

function buildSeedAccounts(): SeedAccount[] {
  faker.seed(20260522);

  const accounts: SeedAccount[] = [
    {
      email: `admin@${SEED_EMAIL_DOMAIN}`,
      name: 'Seed Admin',
      password: SEED_PASSWORD,
      avatarUrl: faker.image.avatar(),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  ];

  for (let index = 1; index <= SEED_ACCOUNT_COUNT; index += 1) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    accounts.push({
      email: `student-${index}@${SEED_EMAIL_DOMAIN}`,
      name: `${firstName} ${lastName}`,
      password: SEED_PASSWORD,
      avatarUrl: faker.image.avatar(),
      role: faker.helpers.arrayElement(['USER', 'MODERATOR'] as const),
      status: faker.helpers.arrayElement([
        'ACTIVE',
        'UNVERIFIED',
        'BANNED',
        'DELETED',
      ] as const),
    });
  }

  return accounts;
}

async function main() {
  const accounts = buildSeedAccounts();
  const seedEmails = accounts.map((account) => account.email);

  const hashedAccounts = await Promise.all(
    accounts.map(async (account) => ({
      ...account,
      password: await argon2.hash(account.password),
      deletedAt: account.status === 'DELETED' ? new Date() : null,
    })),
  );

  // Delete sessions first (they have a foreign key to accounts)
  const accountsToDelete = await prisma.accounts.findMany({
    where: {
      email: {
        in: seedEmails,
      },
    },
    select: {
      id: true,
    },
  });

  const userIds = accountsToDelete.map((account) => account.id);
  await prisma.sessions.deleteMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

  // Then delete the accounts
  await prisma.accounts.deleteMany({
    where: {
      email: {
        in: seedEmails,
      },
    },
  });

  await prisma.accounts.createMany({
    data: hashedAccounts,
  });

  const subjectsList = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Physics', code: 'PHYS' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'Computer Science', code: 'CS' },
    { name: 'Programming', code: 'PROG' },
    { name: 'English', code: 'ENG' },
    { name: 'Database', code: 'DB' },
    { name: 'Web Development', code: 'WEB' },
    { name: 'Mobile Development', code: 'MOBILE' },
    { name: 'Data Science', code: 'DS' },
  ];

  const school = await prisma.schools.upsert({
    where: {
      code: process.env.DEFAULT_SCHOOL_CODE || 'FPTU',
    },
    update: {
      name: 'FPT University',
    },
    create: {
      name: 'FPT University',
      code: process.env.DEFAULT_SCHOOL_CODE || 'FPTU',
    },
  });

  const subjects = await Promise.all(
    subjectsList.map((subject) =>
      prisma.subjects.upsert({
        where: {
          code: subject.code,
        },
        update: {
          name: subject.name,
          schoolId: school.id,
        },
        create: {
          ...subject,
          schoolId: school.id,
        },
      }),
    ),
  );

  console.log(`Seeded ${accounts.length} accounts.`);
  console.log(`Ensured school: ${school.name} (${school.code})`);
  console.log(`Ensured ${subjects.length} subjects for ${school.name}`);
  console.log(`Admin account: admin@${SEED_EMAIL_DOMAIN}`);
  console.log(`Seed password: ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
