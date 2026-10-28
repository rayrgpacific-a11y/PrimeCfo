import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const ENCODED_POOLER = process.env.DATABASE_URL || '';
const ENCODED_DIRECT = process.env.DIRECT_URL || '';

async function main() {
  console.log('====================================================');
  console.log('1. Supabase Auth & Project Status:');
  console.log('   URL:', SUPABASE_URL);
  console.log('====================================================');

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    console.error('❌ Supabase Auth error:', usersError);
  } else {
    console.log(`✅ Supabase Auth Connected! Found ${usersData.users.length} registered users:`);
    for (const u of usersData.users) {
      console.log(`   - ${u.email} (id: ${u.id}, confirmed: ${!!u.email_confirmed_at}, role: ${u.role}, created: ${u.created_at})`);
    }
  }

  console.log('\n====================================================');
  console.log('2. Inspecting PostgreSQL Database Schema & Rows:');
  console.log('====================================================');

  const prisma = new PrismaClient({
    datasources: {
      db: { url: ENCODED_POOLER }
    }
  });

  try {
    // 1. Check Clients table
    const clients: any[] = await prisma.$queryRaw`
      SELECT client_id, client_name, company_name, email, is_active, created_at 
      FROM clients 
      ORDER BY created_at DESC;
    `;
    console.log(`\n📋 Clients (${clients.length} records):`);
    for (const c of clients) {
      console.log(`   - [${c.client_id}] "${c.client_name}" / "${c.company_name}" <${c.email}> (active: ${c.is_active})`);
    }

    // 2. Check Client Columns
    const clientCols: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients'
      ORDER BY ordinal_position;
    `;
    console.log('\nColumns in "clients" table:');
    console.log(clientCols.map(c => `${c.column_name} (${c.data_type})`).join(', '));

    // 3. Check QBO Connections
    const qboConns: any[] = await prisma.$queryRaw`
      SELECT * FROM client_qbo_connections LIMIT 5;
    `;
    console.log(`\n🔗 Sample client_qbo_connections (${qboConns.length} records shown):`);
    for (const q of qboConns) {
      console.log(`   - Client: ${q.client_id}, Realm/Company: ${q.company_id || q.realm_id}, Status: ${q.status}, Sync: ${q.sync_enabled}`);
    }

    // 4. Check Financial Metrics
    const metricsSample: any[] = await prisma.$queryRaw`
      SELECT client_id, period, cash_position, revenue, net_profit, profit_margin, created_at
      FROM financial_metrics 
      ORDER BY created_at DESC 
      LIMIT 3;
    `;
    console.log(`\n📊 Sample financial_metrics (latest 3 of 576):`);
    for (const m of metricsSample) {
      console.log(`   - Client: ${m.client_id}, Period: ${m.period}, Cash: $${m.cash_position}, Rev: $${m.revenue}, NetProfit: $${m.net_profit}`);
    }

    // 5. Check if models from prisma/schema.prisma exist or need sync
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    const tableSet = new Set(tables.map((t: any) => t.table_name));

    const expectedPrismaTables = [
      'clients',
      'client_qbo_connections',
      'qbo_tokens',
      'assets',
      'financial_metrics',
      'financial_alerts',
      'advisory_notes',
      'action_items',
      'documents'
    ];

    console.log('\n====================================================');
    console.log('3. Prisma Schema Compatibility Check:');
    console.log('====================================================');
    for (const exp of expectedPrismaTables) {
      const exists = tableSet.has(exp);
      console.log(`   ${exists ? '✅' : '⚠️ Missing:'} ${exp}`);
    }

    await prisma.$disconnect();
  } catch (err: any) {
    console.error('❌ Database error:', err.message);
    await prisma.$disconnect();
  }
}

main().catch(console.error);
