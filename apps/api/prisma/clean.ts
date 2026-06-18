import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function assertNonProductionDatabase() {
  const nodeEnv = process.env.NODE_ENV;
  const databaseUrl = process.env.DATABASE_URL ?? '';

  if (nodeEnv === 'production' || databaseUrl.includes('prod')) {
    throw new Error('Refusing to clean a production-like database.');
  }
}

async function main() {
  assertNonProductionDatabase();

  const documentsDeleted = await prisma.documents.deleteMany({});
  const sessionsDeleted = await prisma.sessions.deleteMany({});
  const subjectsDeleted = await prisma.subjects.deleteMany({});
  const schoolsDeleted = await prisma.schools.deleteMany({});
  const AuthProviderDeleted = await prisma.auth_providers.deleteMany({});
  const accountsDeleted = await prisma.accounts.deleteMany({});

  console.log(`Deleted ${documentsDeleted.count} documents.`);
  console.log(`Deleted ${sessionsDeleted.count} sessions.`);
  console.log(`Deleted ${subjectsDeleted.count} subjects.`);
  console.log(`Deleted ${schoolsDeleted.count} schools.`);
  console.log(`Deleted ${accountsDeleted.count} accounts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
