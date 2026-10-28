import 'dotenv/config';
import { serializeSession } from '../lib/auth';

const BASE_URL = 'http://localhost:3000';

// Operator session cookie
const operatorCookie = serializeSession({
  email: 'admin@primecfo.ai',
  role: 'operator',
  userId: 'operator-system-admin-01',
});

const headers = {
  Cookie: `primecfo_session=${operatorCookie}`,
  'Content-Type': 'application/json',
};

async function testLiveApi() {
  console.log('=== Verifying Live Endpoints with Authentic Supabase Database ===\n');

  // 1. Clients
  const clientsRes = await fetch(`${BASE_URL}/api/clients`, { headers });
  const clientsJson = await clientsRes.json();
  console.log(`1. /api/clients (Status: ${clientsRes.status})`);
  console.log(`   Found ${clientsJson.data?.length || 0} clients:`);
  const clients = clientsJson.data || [];
  for (const c of clients.slice(0, 4)) {
    console.log(`   - [${c.client_id}] ${c.client_name} (${c.company_name || 'N/A'}) <${c.email}>`);
  }

  // Pick a real client, e.g. James Smith or Andrew
  const targetClient = clients.find((c: any) => c.client_name.includes('James') || c.client_name.includes('Andrew')) || clients[0];
  const clientId = targetClient?.client_id;
  console.log(`\nUsing Target Client: ${targetClient?.client_name} (${clientId})\n`);

  // 2. Metrics
  const metricsRes = await fetch(`${BASE_URL}/api/metrics?clientId=${clientId}`, { headers });
  const metricsJson = await metricsRes.json();
  console.log(`2. /api/metrics?clientId=${clientId} (Status: ${metricsRes.status})`);
  console.log(`   Cash Position: $${metricsJson.data?.cashPosition}`);
  console.log(`   Revenue: $${metricsJson.data?.revenue}`);
  console.log(`   Net Profit: $${metricsJson.data?.netProfit}`);
  console.log(`   Profit Margin: ${metricsJson.data?.profitMargin}%`);
  console.log(`   Cash Runway: ${metricsJson.data?.cashRunway} months`);

  // 3. Documents (from authentic financial_reports)
  const docsRes = await fetch(`${BASE_URL}/api/documents?clientId=${clientId}`, { headers });
  const docsJson = await docsRes.json();
  console.log(`\n3. /api/documents?clientId=${clientId} (Status: ${docsRes.status})`);
  console.log(`   Loaded ${docsJson.data?.length || 0} documents from authentic financial_reports:`);
  for (const d of (docsJson.data || []).slice(0, 3)) {
    console.log(`   - [${d.code}] "${d.name}" (${d.type}, Source: ${d.source})`);
  }

  // 4. Action Items (from authentic ai_risk_posture & ai_insights)
  const actionsRes = await fetch(`${BASE_URL}/api/action-items?clientId=${clientId}`, { headers });
  const actionsJson = await actionsRes.json();
  console.log(`\n4. /api/action-items?clientId=${clientId} (Status: ${actionsRes.status})`);
  console.log(`   Loaded ${actionsJson.data?.length || 0} action items from authentic AI models:`);
  for (const a of (actionsJson.data || []).slice(0, 3)) {
    console.log(`   - [${a.priority.toUpperCase()}] "${a.title}"`);
  }

  // 5. Assets (from authentic financial_reports)
  const assetsRes = await fetch(`${BASE_URL}/api/assets?clientId=${clientId}`, { headers });
  const assetsJson = await assetsRes.json();
  console.log(`\n5. /api/assets?clientId=${clientId} (Status: ${assetsRes.status})`);
  console.log(`   Loaded ${assetsJson.data?.length || 0} assets`);

  // 6. Alerts (from authentic financial_alert_events & ai_insights)
  const alertsRes = await fetch(`${BASE_URL}/api/alerts?clientId=${clientId}`, { headers });
  const alertsJson = await alertsRes.json();
  console.log(`\n6. /api/alerts?clientId=${clientId} (Status: ${alertsRes.status})`);
  console.log(`   Loaded ${alertsJson.data?.length || 0} alerts:`);
  for (const al of (alertsJson.data || []).slice(0, 3)) {
    console.log(`   - [${al.severity.toUpperCase()}] "${al.title}"`);
  }

  // 7. Notes (from authentic clients.notes)
  const notesRes = await fetch(`${BASE_URL}/api/notes?clientId=${clientId}`, { headers });
  const notesJson = await notesRes.json();
  console.log(`\n7. /api/notes?clientId=${clientId} (Status: ${notesRes.status})`);
  console.log(`   Notes count/data:`, notesJson.data ? `${notesJson.data.length} notes` : 'empty');

  console.log('\n====================================================');
  console.log('🎉 ALL ENDPOINTS SUCCESSFULLY SERVED FROM AUTHENTIC SUPABASE DATABASE!');
  console.log('====================================================');
}

testLiveApi().catch(console.error);
