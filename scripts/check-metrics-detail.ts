import { PrismaClient } from '@prisma/client';

const ENCODED_POOLER = 'postgresql://postgres.iizwgqnncawzipqdzsrx:-gmW%2FhSS57Q9it%2B@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: ENCODED_POOLER } } });

  console.log('--- Checking metric_key values in financial_metrics ---');
  const metricKeys: any[] = await prisma.$queryRawUnsafe(`
    SELECT metric_key, count(*)::int as count 
    FROM financial_metrics 
    GROUP BY metric_key 
    ORDER BY count DESC;
  `);
  console.log('Distinct metric_key values:');
  for (const k of metricKeys) {
    console.log(`   - ${k.metric_key}: ${k.count} rows`);
  }

  console.log('\n--- Checking financial_reports ---');
  const reports: any[] = await prisma.$queryRawUnsafe(`
    SELECT report_type, count(*)::int as count 
    FROM financial_reports 
    GROUP BY report_type 
    ORDER BY count DESC;
  `);
  for (const r of reports) {
    console.log(`   - ${r.report_type}: ${r.count} rows`);
  }

  console.log('\n--- Checking financial_report_periods ---');
  const periods: any[] = await prisma.$queryRawUnsafe(`
    SELECT period_type, label, count(*)::int as count 
    FROM financial_report_periods 
    GROUP BY period_type, label 
    ORDER BY period_type, count DESC 
    LIMIT 10;
  `);
  for (const p of periods) {
    console.log(`   - [${p.period_type}] "${p.label}": ${p.count} periods`);
  }

  console.log('\n--- Checking ai_insights sample ---');
  const insights: any[] = await prisma.$queryRawUnsafe(`
    SELECT client_id, title, urgency, category, metric, metric_value 
    FROM ai_insights 
    LIMIT 5;
  `);
  for (const i of insights) {
    console.log(`   - [${i.category} / ${i.urgency}] "${i.title}" (Metric: ${i.metric} = ${i.metric_value})`);
  }

  console.log('\n--- Checking ai_risk_posture ---');
  const risk: any[] = await prisma.$queryRawUnsafe(`
    SELECT client_id, report_range, rating, summary, top_action 
    FROM ai_risk_posture;
  `);
  for (const r of risk) {
    console.log(`   - [${r.rating}] Client ${r.client_id} (${r.report_range}): "${r.summary.slice(0, 60)}..."`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
