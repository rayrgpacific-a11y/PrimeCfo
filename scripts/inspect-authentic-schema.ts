import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Inspecting Authentic Database Tables and Columns ===\n');
  const tables: any[] = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  console.log(`Found ${tables.length} tables in public schema:`);
  for (const t of tables) {
    const tableName = t.table_name;
    const countRes: any[] = await prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "${tableName}"`);
    const count = countRes[0]?.count ?? 0;
    
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY ordinal_position;
    `;
    const colList = columns.map(c => `${c.column_name} (${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''})`).join(', ');
    console.log(`\n📁 Table: "${tableName}" [${count} rows]`);
    console.log(`   Columns: ${colList}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
