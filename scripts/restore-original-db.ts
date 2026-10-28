import { PrismaClient } from '@prisma/client';

const ENCODED_DIRECT = process.env.DIRECT_URL || process.env.DATABASE_URL || '';

async function restoreOriginalDatabase() {
  const prisma = new PrismaClient({
    datasources: { db: { url: ENCODED_DIRECT } }
  });

  console.log('Restoring target database to 100% authentic schema (disregarding created tables)...');

  const statements = [
    // Drop created tables
    `DROP TABLE IF EXISTS "assets" CASCADE`,
    `DROP TABLE IF EXISTS "action_items" CASCADE`,
    `DROP TABLE IF EXISTS "documents" CASCADE`,
    `DROP TABLE IF EXISTS "advisory_notes" CASCADE`,
    `DROP TABLE IF EXISTS "financial_alerts" CASCADE`,

    // Remove added columns from financial_metrics
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "period"`,
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "cash_position"`,
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "revenue"`,
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "net_profit"`,
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "profit_margin"`,
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "ar_aging"`,
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "cash_runway"`,
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "basis"`,
    `ALTER TABLE "financial_metrics" DROP COLUMN IF EXISTS "updated_at"`
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('Executed:', sql);
    } catch (e: any) {
      console.error('Error on statement:', sql, e.message);
    }
  }

  // Check table list to verify 100% original tables
  const tables: any[] = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('\nExact tables in database now:');
  console.log(tables.map((t: any) => t.table_name).join(', '));

  await prisma.$disconnect();
}

restoreOriginalDatabase().catch(console.error);
