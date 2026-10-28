import prisma from '../lib/prisma';

async function main() {
  const sampleInsights = await prisma.aiInsight.findMany({ take: 3 });
  console.log(JSON.stringify(sampleInsights, null, 2));
  await prisma.$disconnect();
}

main();
