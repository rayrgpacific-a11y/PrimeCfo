import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Support both prisma.financialAlert and prisma.financialAlertEvent
if (!(prisma as any).financialAlertEvent && (prisma as any).financialAlert) {
  (prisma as any).financialAlertEvent = (prisma as any).financialAlert;
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
