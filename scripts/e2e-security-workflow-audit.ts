import fs from 'fs';
import path from 'path';

// Load .env.local into process.env so test runner signs sessions with the server's exact secrets
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const k = trimmed.slice(0, eqIdx).trim();
        let v = trimmed.slice(eqIdx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        process.env[k] = v;
      }
    }
  }
} catch (e) {
  // Ignore
}

import prisma from '../lib/prisma';
import { serializeSession, SessionUser } from '../lib/auth';
import { signPayload } from '../lib/crypto';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface StepEvidence {
  suite: string;
  test: string;
  endpoint: string;
  method: string;
  status: number;
  expectedStatus: number | number[];
  passed: boolean;
  details: string;
}

const auditLog: StepEvidence[] = [];

function record(step: StepEvidence) {
  auditLog.push(step);
  const mark = step.passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${mark} [${step.suite}] ${step.test}`);
  console.log(`       Method: ${step.method} ${step.endpoint}`);
  console.log(`       Status: ${step.status} (Expected: ${JSON.stringify(step.expectedStatus)})`);
  console.log(`       Evidence: ${step.details}\n`);
}

async function runComprehensiveArchitectAudit() {
  console.log('========================================================================');
  console.log('  PrimeCFO.ai — Exhaustive Architectural & Security Workflow Audit');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log('========================================================================\n');

  // ===========================================================================
  // SUITE 1: EDGE MIDDLEWARE, ROUTE GUARDS & SECURITY HEADERS
  // ===========================================================================
  console.log('>>> SUITE 1: EDGE MIDDLEWARE, ROUTE GUARDS & SECURITY HEADERS\n');

  const protectedPages = ['/dashboard', '/admin/dashboard', '/reports', '/connect', '/settings', '/insights'];
  for (const page of protectedPages) {
    try {
      const res = await fetch(`${BASE_URL}${page}`, { redirect: 'manual' });
      const location = res.headers.get('location') || '';
      const passed = (res.status === 307 || res.status === 302) && location.includes('/login?error=auth_required');
      record({
        suite: 'Perimeter Defense',
        test: `Unauthenticated browser navigation to ${page} blocked`,
        endpoint: page,
        method: 'GET',
        status: res.status,
        expectedStatus: [302, 307],
        passed,
        details: `Redirect location: "${location}"`
      });
    } catch (e: any) {
      record({
        suite: 'Perimeter Defense',
        test: `Navigation to ${page}`,
        endpoint: page,
        method: 'GET',
        status: 0,
        expectedStatus: 307,
        passed: false,
        details: `Exception: ${e.message}`
      });
    }
  }

  // Enterprise Security Headers Check
  try {
    const res = await fetch(`${BASE_URL}/login`);
    const csp = res.headers.get('content-security-policy') || '';
    const xfo = res.headers.get('x-frame-options') || '';
    const xcto = res.headers.get('x-content-type-options') || '';
    const hsts = res.headers.get('strict-transport-security') || '';
    const perm = res.headers.get('permissions-policy') || '';

    const headersPassed =
      csp.includes("frame-ancestors 'none'") &&
      xfo === 'DENY' &&
      xcto === 'nosniff' &&
      hsts.includes('max-age=') &&
      perm.includes('camera=()');

    record({
      suite: 'Security Headers',
      test: 'Enterprise HTTP security headers enforced by edge middleware',
      endpoint: '/login',
      method: 'GET',
      status: res.status,
      expectedStatus: 200,
      passed: headersPassed,
      details: `CSP: ${csp.slice(0, 45)}... | X-Frame-Options: ${xfo} | X-Content-Type-Options: ${xcto}`
    });
  } catch (e: any) {
    record({
      suite: 'Security Headers',
      test: 'Security headers inspection',
      endpoint: '/login',
      method: 'GET',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // Cross-Origin Mutation (CSRF Defense)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Origin': 'https://evil-attacker-site.com',
        'Host': new URL(BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'admin@primecfo.ai', password: 'test' })
    });
    const data = await res.json().catch(() => ({}));
    record({
      suite: 'CSRF Defense',
      test: 'Cross-origin state-changing mutation blocked with 403 Forbidden',
      endpoint: '/api/auth/login',
      method: 'POST',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Response: ${JSON.stringify(data)}`
    });
  } catch (e: any) {
    record({
      suite: 'CSRF Defense',
      test: 'Cross-origin mutation check',
      endpoint: '/api/auth/login',
      method: 'POST',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // Zombie Route Deletion Verification
  try {
    const res = await fetch(`${BASE_URL}/api/clients/add`);
    record({
      suite: 'Attack Surface',
      test: 'Zombie backdoor route /api/clients/add returns 404 Not Found',
      endpoint: '/api/clients/add',
      method: 'GET',
      status: res.status,
      expectedStatus: 404,
      passed: res.status === 404,
      details: `Status: ${res.status} (Confirmed eliminated from attack surface)`
    });
  } catch (e: any) {
    record({
      suite: 'Attack Surface',
      test: 'Zombie route probe',
      endpoint: '/api/clients/add',
      method: 'GET',
      status: 0,
      expectedStatus: 404,
      passed: false,
      details: e.message
    });
  }

  // ===========================================================================
  // SUITE 2: ZERO-TRUST UNAUTHENTICATED API ROUTE GUARDS
  // ===========================================================================
  console.log('\n>>> SUITE 2: ZERO-TRUST UNAUTHENTICATED API GUARDS\n');

  const protectedEndpoints: { path: string; method: string }[] = [
    { path: '/api/me', method: 'GET' },
    { path: '/api/clients', method: 'GET' },
    { path: '/api/assets', method: 'GET' },
    { path: '/api/alerts', method: 'GET' },
    { path: '/api/documents', method: 'GET' },
    { path: '/api/notes', method: 'GET' },
    { path: '/api/metrics', method: 'GET' },
    { path: '/api/settings', method: 'GET' },
    { path: '/api/action-items', method: 'GET' },
    { path: '/api/quickbooks/customer', method: 'GET' },
    { path: '/api/quickbooks/disconnect', method: 'POST' },
  ];

  for (const ep of protectedEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      record({
        suite: 'API Authorization Guards',
        test: `Unauthenticated ${ep.method} ${ep.path} returns 401 Unauthorized`,
        endpoint: ep.path,
        method: ep.method,
        status: res.status,
        expectedStatus: 401,
        passed: res.status === 401,
        details: `Payload: ${JSON.stringify(data)}`
      });
    } catch (e: any) {
      record({
        suite: 'API Authorization Guards',
        test: `Guard check for ${ep.path}`,
        endpoint: ep.path,
        method: ep.method,
        status: 0,
        expectedStatus: 401,
        passed: false,
        details: e.message
      });
    }
  }

  // QuickBooks Auth unauthenticated initiation
  try {
    const qbAuthRes = await fetch(`${BASE_URL}/api/quickbooks/auth`, { redirect: 'manual' });
    const location = qbAuthRes.headers.get('location') || '';
    const qbAuthPassed = (qbAuthRes.status === 307 || qbAuthRes.status === 302) && location.includes('/login?error=auth_required');
    record({
      suite: 'API Authorization Guards',
      test: 'Unauthenticated /api/quickbooks/auth redirects to login',
      endpoint: '/api/quickbooks/auth',
      method: 'GET',
      status: qbAuthRes.status,
      expectedStatus: [302, 307],
      passed: qbAuthPassed,
      details: `Redirect target: "${location}"`
    });
  } catch (e: any) {
    record({
      suite: 'API Authorization Guards',
      test: 'QuickBooks auth unauthenticated check',
      endpoint: '/api/quickbooks/auth',
      method: 'GET',
      status: 0,
      expectedStatus: 307,
      passed: false,
      details: e.message
    });
  }

  // ===========================================================================
  // SUITE 3: CRYPTOGRAPHIC SESSION INTEGRITY & TTL VERIFICATION
  // ===========================================================================
  console.log('\n>>> SUITE 3: CRYPTOGRAPHIC SESSION INTEGRITY & TTL\n');

  // 3.1 Tampered Cookie Signature
  try {
    const validJson = JSON.stringify({ email: 'admin@primecfo.ai', userId: '1', role: 'operator' });
    const fakeBase64 = Buffer.from(validJson).toString('base64url');
    const tamperedCookie = `${fakeBase64}.0000000000000000000000000000000000000000000000000000000000000000`;

    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: {
        'Origin': BASE_URL,
        'Host': new URL(BASE_URL).host,
        'Cookie': `primecfo_session=${tamperedCookie}`
      }
    });
    record({
      suite: 'Cryptographic Integrity',
      test: 'Forged HMAC session signature rejected with 401 Unauthorized',
      endpoint: '/api/me',
      method: 'GET',
      status: res.status,
      expectedStatus: 401,
      passed: res.status === 401,
      details: `Status: ${res.status} (Constant-time timingSafeEqual prevented bypass)`
    });
  } catch (e: any) {
    record({
      suite: 'Cryptographic Integrity',
      test: 'Forged signature probe',
      endpoint: '/api/me',
      method: 'GET',
      status: 0,
      expectedStatus: 401,
      passed: false,
      details: e.message
    });
  }

  // 3.2 Expired Session Token (Replay Attack Defense)
  try {
    const expiredPayload: SessionUser = {
      email: 'admin@primecfo.ai',
      userId: 'admin-id',
      role: 'operator',
      iat: Date.now() - 1000 * 60 * 60 * 24 * 10,
      exp: Date.now() - 1000 * 60 // Expired 1 minute ago
    };
    const expiredCookie = serializeSession(expiredPayload);

    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: {
        'Origin': BASE_URL,
        'Host': new URL(BASE_URL).host,
        'Cookie': `primecfo_session=${expiredCookie}`
      }
    });
    record({
      suite: 'Cryptographic Integrity',
      test: 'Expired session cookie rejected with 401 Unauthorized',
      endpoint: '/api/me',
      method: 'GET',
      status: res.status,
      expectedStatus: 401,
      passed: res.status === 401,
      details: `Status: ${res.status} (Strict server-side TTL check enforced)`
    });
  } catch (e: any) {
    record({
      suite: 'Cryptographic Integrity',
      test: 'Expired token probe',
      endpoint: '/api/me',
      method: 'GET',
      status: 0,
      expectedStatus: 401,
      passed: false,
      details: e.message
    });
  }

  // ===========================================================================
  // SUITE 4: OPERATOR AUTHENTICATION & ADMINISTRATIVE WORKFLOW
  // ===========================================================================
  console.log('\n>>> SUITE 4: OPERATOR AUTHENTICATION & ADMINISTRATIVE WORKFLOW\n');

  let operatorCookie = '';
  let activeClients: any[] = [];
  let testClientId = '';

  // 4.1 Operator Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Origin': BASE_URL,
        'Host': new URL(BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@primecfo.ai',
        password: process.env.ADMIN_PASSWORD || 'primecfo2024'
      })
    });
    const data = await res.json().catch(() => ({}));
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/primecfo_session=([^;]+)/);
      if (match) operatorCookie = match[1];
    }
    const passed = res.status === 200 && data.isOperator === true && !!operatorCookie;
    record({
      suite: 'Operator Workflow',
      test: 'Operator Login with server-side admin password',
      endpoint: '/api/auth/login',
      method: 'POST',
      status: res.status,
      expectedStatus: 200,
      passed,
      details: `isOperator: ${data.isOperator}, Session Cookie Present: ${!!operatorCookie}`
    });
  } catch (e: any) {
    record({
      suite: 'Operator Workflow',
      test: 'Operator Login',
      endpoint: '/api/auth/login',
      method: 'POST',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  const authHeaders = {
    'Origin': BASE_URL,
    'Host': new URL(BASE_URL).host,
    'Content-Type': 'application/json',
    'Cookie': `primecfo_session=${operatorCookie}`
  };

  // 4.2 Verify Identity via /api/me
  try {
    const res = await fetch(`${BASE_URL}/api/me`, { headers: authHeaders });
    const me = await res.json().catch(() => ({}));
    record({
      suite: 'Operator Workflow',
      test: 'Session identity confirmed via /api/me',
      endpoint: '/api/me',
      method: 'GET',
      status: res.status,
      expectedStatus: 200,
      passed: res.status === 200 && me.role === 'operator' && me.isOperator === true,
      details: `User: ${me.email}, Role: ${me.role}`
    });
  } catch (e: any) {
    record({
      suite: 'Operator Workflow',
      test: 'Session verification',
      endpoint: '/api/me',
      method: 'GET',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // 4.3 Master Client Roster Retrieval
  try {
    const res = await fetch(`${BASE_URL}/api/clients`, { headers: authHeaders });
    const cData = await res.json().catch(() => ({}));
    activeClients = cData.data || [];
    testClientId = activeClients[0]?.id || activeClients[0]?.client_id;
    record({
      suite: 'Operator Workflow',
      test: 'Operator retrieves master client roster',
      endpoint: '/api/clients',
      method: 'GET',
      status: res.status,
      expectedStatus: 200,
      passed: res.status === 200 && Array.isArray(activeClients) && activeClients.length > 0,
      details: `Total clients: ${activeClients.length}, Target Client: ${testClientId}`
    });
  } catch (e: any) {
    record({
      suite: 'Operator Workflow',
      test: 'Client roster retrieval',
      endpoint: '/api/clients',
      method: 'GET',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // 4.4 CFO Action Items Full Lifecycle (POST, PATCH, DELETE, 404 on missing)
  let testItemId = '';
  try {
    const postRes = await fetch(`${BASE_URL}/api/action-items`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: testClientId,
        title: `Comprehensive Audit Task ${Date.now()}`,
        description: 'Verify quarterly balance sheet with CFO',
        priority: 'high'
      })
    });
    const postData = await postRes.json().catch(() => ({}));
    testItemId = postData.data?.id;

    record({
      suite: 'Operator Workflow',
      test: 'Operator creates CFO action item (/api/action-items POST)',
      endpoint: '/api/action-items',
      method: 'POST',
      status: postRes.status,
      expectedStatus: 200,
      passed: postRes.status === 200 && !!testItemId,
      details: `Created Action Item ID: ${testItemId}`
    });

    // Patch item
    const patchRes = await fetch(`${BASE_URL}/api/action-items`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        id: testItemId,
        isCompleted: true
      })
    });
    const patchData = await patchRes.json().catch(() => ({}));
    record({
      suite: 'Operator Workflow',
      test: 'Operator updates CFO action item (/api/action-items PATCH)',
      endpoint: '/api/action-items',
      method: 'PATCH',
      status: patchRes.status,
      expectedStatus: 200,
      passed: patchRes.status === 200 && patchData.data?.isCompleted === true,
      details: `isCompleted: ${patchData.data?.isCompleted}`
    });

    // Delete item
    const delRes = await fetch(`${BASE_URL}/api/action-items?id=${testItemId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    record({
      suite: 'Operator Workflow',
      test: 'Operator deletes CFO action item (/api/action-items DELETE)',
      endpoint: `/api/action-items?id=${testItemId}`,
      method: 'DELETE',
      status: delRes.status,
      expectedStatus: 200,
      passed: delRes.status === 200,
      details: 'Action item cleanly deleted'
    });

    // Non-existent item delete returns 404
    const del404Res = await fetch(`${BASE_URL}/api/action-items?id=non_existent_id_9999`, {
      method: 'DELETE',
      headers: authHeaders
    });
    record({
      suite: 'Operator Workflow',
      test: 'Deleting non-existent action item returns 404 Not Found',
      endpoint: '/api/action-items?id=non_existent_id_9999',
      method: 'DELETE',
      status: del404Res.status,
      expectedStatus: 404,
      passed: del404Res.status === 404,
      details: `Status: ${del404Res.status} (Clean REST 404, no 500 leak)`
    });
  } catch (e: any) {
    record({
      suite: 'Operator Workflow',
      test: 'Action items lifecycle',
      endpoint: '/api/action-items',
      method: 'ALL',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // 4.5 Financial Document Vault Lifecycle (POST, DELETE, 404 on missing)
  let testDocId = '';
  try {
    const docRes = await fetch(`${BASE_URL}/api/documents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: testClientId,
        name: `Executive_Audit_Report_${Date.now()}.pdf`,
        type: 'Audit',
        size: '1.4 MB'
      })
    });
    const docData = await docRes.json().catch(() => ({}));
    testDocId = docData.data?.id;
    record({
      suite: 'Operator Workflow',
      test: 'Operator registers document in vault (/api/documents POST)',
      endpoint: '/api/documents',
      method: 'POST',
      status: docRes.status,
      expectedStatus: 200,
      passed: docRes.status === 200 && !!testDocId,
      details: `Created Document ID: ${testDocId}`
    });

    // Delete doc
    const delDocRes = await fetch(`${BASE_URL}/api/documents?id=${testDocId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    record({
      suite: 'Operator Workflow',
      test: 'Operator deletes document from vault (/api/documents DELETE)',
      endpoint: `/api/documents?id=${testDocId}`,
      method: 'DELETE',
      status: delDocRes.status,
      expectedStatus: 200,
      passed: delDocRes.status === 200,
      details: 'Document cleanly deleted'
    });

    // Non-existent document delete returns 404
    const delDoc404 = await fetch(`${BASE_URL}/api/documents?id=non_existent_doc_9999`, {
      method: 'DELETE',
      headers: authHeaders
    });
    record({
      suite: 'Operator Workflow',
      test: 'Deleting non-existent document returns 404 Not Found',
      endpoint: '/api/documents?id=non_existent_doc_9999',
      method: 'DELETE',
      status: delDoc404.status,
      expectedStatus: 404,
      passed: delDoc404.status === 404,
      details: `Status: ${delDoc404.status} (Clean REST 404, no 500 leak)`
    });
  } catch (e: any) {
    record({
      suite: 'Operator Workflow',
      test: 'Document vault lifecycle',
      endpoint: '/api/documents',
      method: 'ALL',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // 4.6 Fixed Asset Full Lifecycle (POST, PUT, DELETE, 404 on missing)
  let testAssetId = '';
  try {
    const assetRes = await fetch(`${BASE_URL}/api/assets`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: testClientId,
        name: `Server Rack Cluster ${Date.now()}`,
        category: 'fixed',
        purchasePrice: 12500,
        currentValue: 10000,
        usefulLife: 5
      })
    });
    const assetData = await assetRes.json().catch(() => ({}));
    testAssetId = assetData.data?.id;
    record({
      suite: 'Operator Workflow',
      test: 'Operator registers capital asset (/api/assets POST)',
      endpoint: '/api/assets',
      method: 'POST',
      status: assetRes.status,
      expectedStatus: 200,
      passed: assetRes.status === 200 && !!testAssetId,
      details: `Created Asset ID: ${testAssetId}`
    });

    // Update asset
    const putRes = await fetch(`${BASE_URL}/api/assets`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        id: testAssetId,
        name: `Server Rack Cluster Updated ${Date.now()}`,
        currentValue: 9500
      })
    });
    record({
      suite: 'Operator Workflow',
      test: 'Operator updates capital asset (/api/assets PUT)',
      endpoint: '/api/assets',
      method: 'PUT',
      status: putRes.status,
      expectedStatus: 200,
      passed: putRes.status === 200,
      details: 'Asset updated successfully'
    });

    // Delete asset
    const delAssetRes = await fetch(`${BASE_URL}/api/assets?id=${testAssetId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    record({
      suite: 'Operator Workflow',
      test: 'Operator deletes capital asset (/api/assets DELETE)',
      endpoint: `/api/assets?id=${testAssetId}`,
      method: 'DELETE',
      status: delAssetRes.status,
      expectedStatus: 200,
      passed: delAssetRes.status === 200,
      details: 'Asset deleted successfully'
    });

    // Non-existent asset delete returns 404
    const delAsset404 = await fetch(`${BASE_URL}/api/assets?id=non_existent_asset_9999`, {
      method: 'DELETE',
      headers: authHeaders
    });
    record({
      suite: 'Operator Workflow',
      test: 'Deleting non-existent asset returns 404 Not Found',
      endpoint: '/api/assets?id=non_existent_asset_9999',
      method: 'DELETE',
      status: delAsset404.status,
      expectedStatus: 404,
      passed: delAsset404.status === 404,
      details: `Status: ${delAsset404.status} (Clean REST 404, no 500 leak)`
    });
  } catch (e: any) {
    record({
      suite: 'Operator Workflow',
      test: 'Asset lifecycle',
      endpoint: '/api/assets',
      method: 'ALL',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // 4.7 Advisory Note Composition
  try {
    const noteRes = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: testClientId,
        content: `CFO Quarterly Advisory Directive ${Date.now()}`,
        author: 'Chief Financial Officer'
      })
    });
    const noteData = await noteRes.json().catch(() => ({}));
    record({
      suite: 'Operator Workflow',
      test: 'Operator composes advisory note (/api/notes POST)',
      endpoint: '/api/notes',
      method: 'POST',
      status: noteRes.status,
      expectedStatus: 200,
      passed: noteRes.status === 200 && !!noteData.data?.id,
      details: `Created Note ID: ${noteData.data?.id}`
    });
  } catch (e: any) {
    record({
      suite: 'Operator Workflow',
      test: 'Advisory note composition',
      endpoint: '/api/notes',
      method: 'POST',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // 4.8 Operator Scoped Settings Retrieval
  try {
    const setRes = await fetch(`${BASE_URL}/api/settings?clientId=${testClientId}`, {
      headers: authHeaders
    });
    const setData = await setRes.json().catch(() => ({}));
    record({
      suite: 'Operator Workflow',
      test: 'Operator fetches client settings with ?clientId=',
      endpoint: `/api/settings?clientId=${testClientId}`,
      method: 'GET',
      status: setRes.status,
      expectedStatus: 200,
      passed: setRes.status === 200 && setData.data?.clientId === testClientId,
      details: `Resolved Entity: ${setData.data?.companyName || setData.data?.clientName}`
    });
  } catch (e: any) {
    record({
      suite: 'Operator Workflow',
      test: 'Settings retrieval',
      endpoint: '/api/settings',
      method: 'GET',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // ===========================================================================
  // SUITE 5: MULTI-TENANT ISOLATION & IDOR PREVENTION
  // ===========================================================================
  console.log('\n>>> SUITE 5: MULTI-TENANT ISOLATION & IDOR PREVENTION\n');

  // Create two distinct client tenants in DB to test cross-tenant attacks
  const victimTenant = await prisma.client.upsert({
    where: { email: 'victim.client@organization-a.com' },
    update: {},
    create: {
      clientName: 'Victim Organization Alpha',
      companyName: 'Organization Alpha Corp',
      email: 'victim.client@organization-a.com',
      isActive: true,
      clientType: 'SCALE'
    }
  });

  const attackerTenant = await prisma.client.upsert({
    where: { email: 'attacker.client@organization-b.com' },
    update: {},
    create: {
      clientName: 'Attacker Organization Beta',
      companyName: 'Organization Beta LLC',
      email: 'attacker.client@organization-b.com',
      isActive: true,
      clientType: 'STARTER'
    }
  });

  // Create an alert belonging to the victim using authentic financial_alert_events
  const victimAlert = await prisma.financialAlert.create({
    data: {
      clientId: victimTenant.id,
      title: 'Confidential Alpha Cash Runway Alert',
      body: 'Confidential Alpha Cash Runway Alert details',
      severityKey: 'critical',
      alertKind: 'Liquidity',
      state: 'active',
      meta: { actionRequired: true }
    }
  });

  // Generate session cookie for Attacker (Tenant B)
  const attackerCookie = serializeSession({
    email: attackerTenant.email,
    userId: 'attacker-sub-user-id',
    role: 'client_user',
    clientId: attackerTenant.id,
    tenantName: attackerTenant.companyName || attackerTenant.clientName
  });

  const attackerHeaders = {
    'Origin': BASE_URL,
    'Host': new URL(BASE_URL).host,
    'Content-Type': 'application/json',
    'Cookie': `primecfo_session=${attackerCookie}`
  };

  // 5.1 IDOR Probe on Alerts GET
  try {
    const res = await fetch(`${BASE_URL}/api/alerts?clientId=${victimTenant.id}`, {
      headers: attackerHeaders
    });
    record({
      suite: 'IDOR Prevention',
      test: 'Attacker reading victim alerts (/api/alerts?clientId=victim) blocked with 403 Forbidden',
      endpoint: `/api/alerts?clientId=${victimTenant.id}`,
      method: 'GET',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Multi-tenant boundary strictly maintained)`
    });
  } catch (e: any) {
    record({
      suite: 'IDOR Prevention',
      test: 'Alerts IDOR probe',
      endpoint: '/api/alerts',
      method: 'GET',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 5.2 IDOR Probe on Alerts POST (Attacker injecting alert into Victim tenant)
  try {
    const res = await fetch(`${BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: attackerHeaders,
      body: JSON.stringify({
        clientId: victimTenant.id,
        title: 'Malicious Injected Alert',
        severity: 'critical'
      })
    });
    record({
      suite: 'IDOR Prevention',
      test: 'Attacker injecting alert into victim tenant blocked with 403 Forbidden',
      endpoint: '/api/alerts',
      method: 'POST',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Unauthorized tenant write denied)`
    });
  } catch (e: any) {
    record({
      suite: 'IDOR Prevention',
      test: 'Alerts injection IDOR probe',
      endpoint: '/api/alerts',
      method: 'POST',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 5.3 IDOR Probe on Alerts PATCH (Attacker resolving victim alert by ID)
  try {
    const res = await fetch(`${BASE_URL}/api/alerts`, {
      method: 'PATCH',
      headers: attackerHeaders,
      body: JSON.stringify({
        id: victimAlert.id,
        isResolved: true
      })
    });
    record({
      suite: 'IDOR Prevention',
      test: 'Attacker resolving victim alert by ID blocked with 403 Forbidden',
      endpoint: '/api/alerts',
      method: 'PATCH',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Alert ownership verified before mutation)`
    });
  } catch (e: any) {
    record({
      suite: 'IDOR Prevention',
      test: 'Alert resolve IDOR probe',
      endpoint: '/api/alerts',
      method: 'PATCH',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 5.4 IDOR Probe on Metrics GET
  try {
    const res = await fetch(`${BASE_URL}/api/metrics?clientId=${victimTenant.id}`, {
      headers: attackerHeaders
    });
    record({
      suite: 'IDOR Prevention',
      test: 'Attacker querying victim financial metrics blocked with 403 Forbidden',
      endpoint: `/api/metrics?clientId=${victimTenant.id}`,
      method: 'GET',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Tenant financial KPIs protected)`
    });
  } catch (e: any) {
    record({
      suite: 'IDOR Prevention',
      test: 'Metrics IDOR probe',
      endpoint: '/api/metrics',
      method: 'GET',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 5.5 IDOR Probe on Settings GET
  try {
    const res = await fetch(`${BASE_URL}/api/settings?clientId=${victimTenant.id}`, {
      headers: attackerHeaders
    });
    record({
      suite: 'IDOR Prevention',
      test: 'Attacker reading victim settings blocked with 403 Forbidden',
      endpoint: `/api/settings?clientId=${victimTenant.id}`,
      method: 'GET',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Tenant settings isolation verified)`
    });
  } catch (e: any) {
    record({
      suite: 'IDOR Prevention',
      test: 'Settings IDOR probe',
      endpoint: '/api/settings',
      method: 'GET',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 5.6 IDOR Probe on QuickBooks Disconnect POST
  try {
    const res = await fetch(`${BASE_URL}/api/quickbooks/disconnect?clientId=${victimTenant.id}`, {
      method: 'POST',
      headers: attackerHeaders
    });
    record({
      suite: 'IDOR Prevention',
      test: 'Attacker disconnecting victim QuickBooks integration blocked with 403 Forbidden',
      endpoint: `/api/quickbooks/disconnect?clientId=${victimTenant.id}`,
      method: 'POST',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Third-party integrations isolated per tenant)`
    });
  } catch (e: any) {
    record({
      suite: 'IDOR Prevention',
      test: 'QuickBooks disconnect IDOR probe',
      endpoint: '/api/quickbooks/disconnect',
      method: 'POST',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // Clean up victim alert
  await prisma.financialAlert.delete({ where: { id: victimAlert.id } }).catch(() => {});

  // ===========================================================================
  // SUITE 6: ROLE-BASED PRIVILEGE SEPARATION & ANTI-ESCALATION
  // ===========================================================================
  console.log('\n>>> SUITE 6: ROLE-BASED PRIVILEGE SEPARATION & ANTI-ESCALATION\n');

  // 6.1 Client user blocked from /api/clients GET
  try {
    const res = await fetch(`${BASE_URL}/api/clients`, { headers: attackerHeaders });
    record({
      suite: 'Privilege Separation',
      test: 'Client user blocked from master client roster (/api/clients GET)',
      endpoint: '/api/clients',
      method: 'GET',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Strict operator-only gating confirmed)`
    });
  } catch (e: any) {
    record({
      suite: 'Privilege Separation',
      test: 'Client user role check on /api/clients',
      endpoint: '/api/clients',
      method: 'GET',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 6.2 Client user blocked from /api/clients POST (Client Provisioning)
  try {
    const res = await fetch(`${BASE_URL}/api/clients`, {
      method: 'POST',
      headers: attackerHeaders,
      body: JSON.stringify({ client_name: 'Hacked Client', email: 'hacked@evil.com' })
    });
    record({
      suite: 'Privilege Separation',
      test: 'Client user blocked from provisioning clients (/api/clients POST)',
      endpoint: '/api/clients',
      method: 'POST',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Operator privileges required)`
    });
  } catch (e: any) {
    record({
      suite: 'Privilege Separation',
      test: 'Client user check on /api/clients POST',
      endpoint: '/api/clients',
      method: 'POST',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 6.3 Client user blocked from creating vault documents (/api/documents POST)
  try {
    const res = await fetch(`${BASE_URL}/api/documents`, {
      method: 'POST',
      headers: attackerHeaders,
      body: JSON.stringify({ clientId: attackerTenant.id, name: 'Malicious.pdf' })
    });
    record({
      suite: 'Privilege Separation',
      test: 'Client user blocked from uploading documents to vault (/api/documents POST)',
      endpoint: '/api/documents',
      method: 'POST',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Operator privileges required)`
    });
  } catch (e: any) {
    record({
      suite: 'Privilege Separation',
      test: 'Client user check on /api/documents POST',
      endpoint: '/api/documents',
      method: 'POST',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 6.4 Client user blocked from deleting vault documents (/api/documents DELETE)
  try {
    const res = await fetch(`${BASE_URL}/api/documents?id=any_id`, {
      method: 'DELETE',
      headers: attackerHeaders
    });
    record({
      suite: 'Privilege Separation',
      test: 'Client user blocked from deleting documents from vault (/api/documents DELETE)',
      endpoint: '/api/documents?id=any_id',
      method: 'DELETE',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Operator privileges required)`
    });
  } catch (e: any) {
    record({
      suite: 'Privilege Separation',
      test: 'Client user check on /api/documents DELETE',
      endpoint: '/api/documents',
      method: 'DELETE',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 6.5 Client user blocked from creating advisory notes (/api/notes POST)
  try {
    const res = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: attackerHeaders,
      body: JSON.stringify({ clientId: attackerTenant.id, content: 'Fake note' })
    });
    record({
      suite: 'Privilege Separation',
      test: 'Client user blocked from composing advisory notes (/api/notes POST)',
      endpoint: '/api/notes',
      method: 'POST',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Operator privileges required)`
    });
  } catch (e: any) {
    record({
      suite: 'Privilege Separation',
      test: 'Client user check on /api/notes POST',
      endpoint: '/api/notes',
      method: 'POST',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 6.6 Client user blocked from creating capital assets (/api/assets POST)
  try {
    const res = await fetch(`${BASE_URL}/api/assets`, {
      method: 'POST',
      headers: attackerHeaders,
      body: JSON.stringify({ clientId: attackerTenant.id, name: 'Fake Asset' })
    });
    record({
      suite: 'Privilege Separation',
      test: 'Client user blocked from registering capital assets (/api/assets POST)',
      endpoint: '/api/assets',
      method: 'POST',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Operator privileges required)`
    });
  } catch (e: any) {
    record({
      suite: 'Privilege Separation',
      test: 'Client user check on /api/assets POST',
      endpoint: '/api/assets',
      method: 'POST',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // 6.7 Client user blocked from creating action items (/api/action-items POST)
  try {
    const res = await fetch(`${BASE_URL}/api/action-items`, {
      method: 'POST',
      headers: attackerHeaders,
      body: JSON.stringify({ clientId: attackerTenant.id, title: 'Unauthorized Task' })
    });
    record({
      suite: 'Privilege Separation',
      test: 'Client user blocked from creating action items (/api/action-items POST)',
      endpoint: '/api/action-items',
      method: 'POST',
      status: res.status,
      expectedStatus: 403,
      passed: res.status === 403,
      details: `Status: ${res.status} (Operator privileges required)`
    });
  } catch (e: any) {
    record({
      suite: 'Privilege Separation',
      test: 'Client user check on /api/action-items POST',
      endpoint: '/api/action-items',
      method: 'POST',
      status: 0,
      expectedStatus: 403,
      passed: false,
      details: e.message
    });
  }

  // ===========================================================================
  // SUITE 7: INPUT VALIDATION & ONBOARDING POLICY GUARDS
  // ===========================================================================
  console.log('\n>>> SUITE 7: INPUT VALIDATION & ONBOARDING POLICY GUARDS\n');

  // 7.1 Signup Password Minimum Length Guard
  try {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Origin': BASE_URL,
        'Host': new URL(BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'shortpass@example.com', password: 'short' })
    });
    const data = await res.json().catch(() => ({}));
    record({
      suite: 'Input Validation',
      test: 'Registration with weak password (< 12 chars) rejected with 400 Bad Request',
      endpoint: '/api/auth/signup',
      method: 'POST',
      status: res.status,
      expectedStatus: 400,
      passed: res.status === 400 && data.error?.includes('12 characters'),
      details: `Response: ${JSON.stringify(data)}`
    });
  } catch (e: any) {
    record({
      suite: 'Input Validation',
      test: 'Password length check',
      endpoint: '/api/auth/signup',
      method: 'POST',
      status: 0,
      expectedStatus: 400,
      passed: false,
      details: e.message
    });
  }

  // 7.2 MFA Verification Validation Guard
  try {
    const res = await fetch(`${BASE_URL}/api/auth/mfa/verify`, {
      method: 'POST',
      headers: {
        'Origin': BASE_URL,
        'Host': new URL(BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'test@example.com', factorId: 'factor-1', code: '12' })
    });
    const data = await res.json().catch(() => ({}));
    record({
      suite: 'Input Validation',
      test: 'MFA verification with invalid code length rejected with 400 Bad Request',
      endpoint: '/api/auth/mfa/verify',
      method: 'POST',
      status: res.status,
      expectedStatus: 400,
      passed: res.status === 400 && data.error?.includes('6-digit'),
      details: `Response: ${JSON.stringify(data)}`
    });
  } catch (e: any) {
    record({
      suite: 'Input Validation',
      test: 'MFA code length check',
      endpoint: '/api/auth/mfa/verify',
      method: 'POST',
      status: 0,
      expectedStatus: 400,
      passed: false,
      details: e.message
    });
  }

  // 7.3 Bad Credentials Login Failure
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Origin': BASE_URL,
        'Host': new URL(BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'admin@primecfo.ai', password: 'WrongPassword999!' })
    });
    const data = await res.json().catch(() => ({}));
    record({
      suite: 'Authentication Flow',
      test: 'Login with incorrect password rejected with 401 Unauthorized',
      endpoint: '/api/auth/login',
      method: 'POST',
      status: res.status,
      expectedStatus: 401,
      passed: res.status === 401 && data.error?.includes('Invalid email or password'),
      details: `Response: ${JSON.stringify(data)}`
    });
  } catch (e: any) {
    record({
      suite: 'Authentication Flow',
      test: 'Incorrect password login probe',
      endpoint: '/api/auth/login',
      method: 'POST',
      status: 0,
      expectedStatus: 401,
      passed: false,
      details: e.message
    });
  }

  // 7.4 Signout Flow
  try {
    const res = await fetch(`${BASE_URL}/api/auth/signout`, {
      method: 'POST',
      headers: authHeaders
    });
    const setCookie = res.headers.get('set-cookie') || '';
    const cookieCleared = setCookie.includes('primecfo_session=;') || setCookie.includes('Max-Age=0') || setCookie.includes('expires=');
    record({
      suite: 'Authentication Flow',
      test: 'Signout endpoint (/api/auth/signout) clears session cookie',
      endpoint: '/api/auth/signout',
      method: 'POST',
      status: res.status,
      expectedStatus: 200,
      passed: res.status === 200 && cookieCleared,
      details: `Set-Cookie header received: "${setCookie.slice(0, 50)}..."`
    });
  } catch (e: any) {
    record({
      suite: 'Authentication Flow',
      test: 'Signout check',
      endpoint: '/api/auth/signout',
      method: 'POST',
      status: 0,
      expectedStatus: 200,
      passed: false,
      details: e.message
    });
  }

  // ===========================================================================
  // SUMMARY SCORECARD
  // ===========================================================================
  const total = auditLog.length;
  const passedCount = auditLog.filter(s => s.passed).length;
  const failedCount = total - passedCount;

  console.log('\n========================================================================');
  console.log(`  AUDIT SCORECARD: ${passedCount} / ${total} Tests Passed (${Math.round((passedCount/total)*100)}%)`);
  console.log(`  Failed Tests: ${failedCount}`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    console.error('❌ Gaps detected! Inspect failed steps above.');
    process.exit(1);
  } else {
    console.log('🎉 100% OF SECURITY AND WORKFLOW TESTS PASSED WITHOUT GAP!');
    process.exit(0);
  }
}

runComprehensiveArchitectAudit();
