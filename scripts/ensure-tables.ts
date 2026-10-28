import { PrismaClient } from '@prisma/client';

const ENCODED_DIRECT = 'postgresql://postgres.iizwgqnncawzipqdzsrx:-gmW%2FhSS57Q9it%2B@aws-1-us-east-2.pooler.supabase.com:5432/postgres';

async function createMissingTables() {
  const prisma = new PrismaClient({
    datasources: { db: { url: ENCODED_DIRECT } }
  });

  console.log('Ensuring missing application tables exist safely in Supabase (CREATE TABLE IF NOT EXISTS)...');

  const statements = [
    // 1. assets
    `CREATE TABLE IF NOT EXISTS "assets" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "client_id" UUID NOT NULL REFERENCES "clients"("client_id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'fixed',
      "subcategory" TEXT,
      "purchase_date" TEXT,
      "purchase_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "depreciation_method" TEXT NOT NULL DEFAULT 'straight-line',
      "useful_life" INTEGER NOT NULL DEFAULT 5,
      "salvage_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "location" TEXT,
      "serial_number" TEXT,
      "vendor" TEXT,
      "warranty" TEXT,
      "status" TEXT NOT NULL DEFAULT 'active',
      "notes" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "assets_client_id_idx" ON "assets"("client_id")`,

    // 2. action_items
    `CREATE TABLE IF NOT EXISTS "action_items" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "client_id" UUID NOT NULL REFERENCES "clients"("client_id") ON DELETE CASCADE,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "is_completed" BOOLEAN NOT NULL DEFAULT false,
      "priority" TEXT NOT NULL DEFAULT 'normal',
      "due_date" TIMESTAMP(3),
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "action_items_client_id_idx" ON "action_items"("client_id")`,

    // 3. documents
    `CREATE TABLE IF NOT EXISTS "documents" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "client_id" UUID NOT NULL REFERENCES "clients"("client_id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "code" TEXT,
      "type" TEXT NOT NULL DEFAULT 'General',
      "size" TEXT,
      "source" TEXT NOT NULL DEFAULT 'Uploaded',
      "file_url" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "documents_client_id_idx" ON "documents"("client_id")`,

    // 4. advisory_notes
    `CREATE TABLE IF NOT EXISTS "advisory_notes" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "client_id" UUID NOT NULL REFERENCES "clients"("client_id") ON DELETE CASCADE,
      "content" TEXT NOT NULL,
      "author" TEXT NOT NULL DEFAULT 'CFO Lead',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "advisory_notes_client_id_idx" ON "advisory_notes"("client_id")`,

    // 5. financial_alerts
    `CREATE TABLE IF NOT EXISTS "financial_alerts" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "client_id" UUID NOT NULL REFERENCES "clients"("client_id") ON DELETE CASCADE,
      "severity" TEXT NOT NULL DEFAULT 'warning',
      "category" TEXT NOT NULL DEFAULT 'Cash Horizon',
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "action_required" BOOLEAN NOT NULL DEFAULT false,
      "is_resolved" BOOLEAN NOT NULL DEFAULT false,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS "financial_alerts_client_id_idx" ON "financial_alerts"("client_id")`
  ];

  try {
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('🎉 Successfully created and verified all missing tables in target Supabase DB!');
  } catch (err: any) {
    console.error('❌ Error executing SQL:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingTables().catch(console.error);
