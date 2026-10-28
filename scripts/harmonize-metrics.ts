import { PrismaClient } from '@prisma/client';

const ENCODED_DIRECT = 'postgresql://postgres.iizwgqnncawzipqdzsrx:-gmW%2FhSS57Q9it%2B@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function updateMetricsColumns() {
  const prisma = new PrismaClient({
    datasources: { db: { url: ENCODED_DIRECT } }
  });

  console.log('Harmonizing financial_metrics columns non-destructively...');

  const statements = [
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "period" TEXT DEFAULT '30d'`,
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "cash_position" DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "revenue" DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "net_profit" DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "profit_margin" DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "ar_aging" DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "cash_runway" DOUBLE PRECISION DEFAULT 0`,
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "basis" TEXT DEFAULT 'cash'`,
    `ALTER TABLE "financial_metrics" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE "financial_metrics" ALTER COLUMN "period_id" DROP NOT NULL`,
    `ALTER TABLE "financial_metrics" ALTER COLUMN "metric_key" DROP NOT NULL`,
    `ALTER TABLE "financial_metrics" ALTER COLUMN "value" DROP NOT NULL`,
    `ALTER TABLE "financial_metrics" ALTER COLUMN "unit" DROP NOT NULL`
  ];

  try {
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('🎉 Successfully harmonized financial_metrics columns!');
  } catch (err: any) {
    console.error('❌ Error executing SQL:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateMetricsColumns().catch(console.error);
