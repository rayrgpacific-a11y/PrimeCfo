import { PrismaClient } from '@prisma/client';

const ENCODED_POOLER = 'postgresql://postgres.iizwgqnncawzipqdzsrx:-gmW%2FhSS57Q9it%2B@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: ENCODED_POOLER } } });

  const alerts = await prisma.financialAlert.findMany({ take: 5 });
  console.log('financial_alert_events count:', alerts.length);

  const insights = await prisma.aiInsight.findMany();
  console.log('Total ai_insights count:', insights.length);
  for (const i of insights) {
    const client = await prisma.client.findUnique({ where: { id: i.clientId } });
    console.log(`- Insight: "${i.title}" | Client ID: ${i.clientId} (${client?.clientName || 'Unknown'})`);
  }

  const postures = await prisma.aiRiskPosture.findMany();
  console.log('Total ai_risk_posture count:', postures.length);
  for (const p of postures) {
    const client = await prisma.client.findUnique({ where: { id: p.clientId } });
    console.log(`- Posture: "${p.summary}" | Client ID: ${p.clientId} (${client?.clientName || 'Unknown'})`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
