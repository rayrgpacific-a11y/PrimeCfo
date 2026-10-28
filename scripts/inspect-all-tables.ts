import { PrismaClient } from '@prisma/client';

const ENCODED_POOLER = 'postgresql://postgres.iizwgqnncawzipqdzsrx:-gmW%2FhSS57Q9it%2B@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: ENCODED_POOLER }
    }
  });

  const tables: any[] = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  console.log('TABLES & COLUMNS IN THIS SUPABASE DATABASE:');
  for (const t of tables) {
    const tableName = t.table_name;
    const cols: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);
    const colSummary = cols.map((c: any) => `${c.column_name} (${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''})`).join(', ');
    console.log(`\n📄 [${tableName}]`);
    console.log(`   ${colSummary}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
