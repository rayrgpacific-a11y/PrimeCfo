import { PrismaClient } from '@prisma/client';

const ENCODED_POOLER = 'postgresql://postgres.iizwgqnncawzipqdzsrx:-gmW%2FhSS57Q9it%2B@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: ENCODED_POOLER } } });

  const client = await prisma.client.findFirst({
    where: { email: 'reportinganddata@gmail.com' }
  });

  if (!client) {
    console.log('Client not found');
    return;
  }

  console.log('Found client:', client.clientName, client.id);

  const metrics = await prisma.financialMetric.findMany({
    where: { clientId: client.id },
    include: { period: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${metrics.length} metrics for this client:`);
  for (const m of metrics.slice(0, 15)) {
    console.log(`   - [${m.period?.label || m.periodId}] ${m.metricKey}: ${m.value} ${m.unit}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
