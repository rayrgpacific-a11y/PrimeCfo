import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAuthenticPrismaModels() {
  console.log('Testing Authentic Prisma models against target Supabase database:\n');

  // 1. Client
  const clients = await prisma.client.findMany({
    include: { qboConnections: true },
    take: 5
  });
  console.log(`✅ prisma.client.findMany: SUCCESS (${clients.length} clients loaded)`);
  for (const c of clients) {
    console.log(`   - ${c.clientName} (${c.companyName || 'No Company'}) <${c.email}> [QBO Conns: ${c.qboConnections.length}]`);
  }

  // 2. Financial Metrics
  const metrics = await prisma.financialMetric.findMany({ take: 5 });
  console.log(`✅ prisma.financialMetric.findMany: SUCCESS (${metrics.length} metrics loaded)`);
  for (const m of metrics) {
    console.log(`   - Metric: ${m.metricKey} = ${m.value} ${m.unit} (Client: ${m.clientId})`);
  }

  // 3. Financial Reports
  const reports = await prisma.financialReport.findMany({ take: 3 });
  console.log(`✅ prisma.financialReport.findMany: SUCCESS (${reports.length} reports loaded)`);
  for (const r of reports) {
    console.log(`   - Report: ${r.reportType} from ${r.source} (Client: ${r.clientId})`);
  }

  // 4. AI Insights
  const insights = await prisma.aiInsight.findMany({ take: 3 });
  console.log(`✅ prisma.aiInsight.findMany: SUCCESS (${insights.length} AI insights loaded)`);
  for (const i of insights) {
    console.log(`   - Insight: "${i.title}" [Urgency: ${i.urgency}, Category: ${i.category}]`);
  }

  // 5. AI Risk Posture
  const postures = await prisma.aiRiskPosture.findMany({ take: 3 });
  console.log(`✅ prisma.aiRiskPosture.findMany: SUCCESS (${postures.length} AI risk postures loaded)`);
  for (const p of postures) {
    console.log(`   - Posture: Rating ${p.rating} (Range: ${p.reportRange}) -> Top Action: "${p.topAction}"`);
  }

  // 6. Quickbooks Connections
  const qbo = await prisma.quickbooksConnection.findMany({ take: 3 });
  console.log(`✅ prisma.quickbooksConnection.findMany: SUCCESS (${qbo.length} active QB connections)`);

  // 7. Financial Alerts
  const alerts = await prisma.financialAlert.findMany({ take: 3 });
  console.log(`✅ prisma.financialAlert.findMany: SUCCESS (${alerts.length} alert events)`);

  await prisma.$disconnect();
}

testAuthenticPrismaModels().catch(console.error);
