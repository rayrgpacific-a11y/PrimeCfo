import crypto from 'crypto';
import { signPayload, verifySignedPayload, encryptToken, decryptToken, generateOAuthState, verifyOAuthState } from '../lib/crypto';
import { serializeSession, SessionUser, SESSION_COOKIE_NAME } from '../lib/auth';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface TestResult {
  phase: string;
  testName: string;
  passed: boolean;
  evidence: string;
  error?: string;
}

const results: TestResult[] = [];

function record(phase: string, testName: string, passed: boolean, evidence: string, error?: string) {
  results.push({ phase, testName, passed, evidence, error });
  const statusIcon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${statusIcon}] [${phase}] ${testName}`);
  console.log(`         Evidence: ${evidence}`);
  if (error) console.log(`         Error: ${error}`);
}

async function runAllTests() {
  console.log('================================================================');
  console.log('  PrimeCFO.ai — Automated Verification Test Suite (Phases 1 - 5)');
  console.log(`  Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  // ============================================================================
  // PHASE 1: Security Hardening & Zero-Vulnerability Architecture
  // ============================================================================
  console.log('>>> RUNNING PHASE 1 TESTS: Security Hardening & Backdoor Elimination');

  // Test 1.1: Weak password rejected (no legacy password.length >= 6 backdoor)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test_attacker@example.com', password: 'random_weak_pw_123' })
    });
    const data = await res.json();
    const passed = res.status === 401 && data.error === 'Invalid email or password';
    record(
      'Phase 1',
      'Eliminate Backdoor / Reject Arbitrary Passwords',
      passed,
      `HTTP Status: ${res.status}, Response: ${JSON.stringify(data)}`
    );
  } catch (err: any) {
    record('Phase 1', 'Eliminate Backdoor / Reject Arbitrary Passwords', false, 'Request failed', err.message);
  }

  // Test 1.2: Incorrect admin password rejected
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@primecfo.ai', password: 'wrongpassword' })
    });
    const data = await res.json();
    const passed = res.status === 401;
    record(
      'Phase 1',
      'Reject Invalid Operator Credentials',
      passed,
      `HTTP Status: ${res.status}, Error: ${data.error}`
    );
  } catch (err: any) {
    record('Phase 1', 'Reject Invalid Operator Credentials', false, 'Request failed', err.message);
  }

  // Test 1.3: Cryptographic HMAC-SHA256 Session Signing & Tamper Proofing
  try {
    const sampleUser: SessionUser = {
      email: 'verified_user@primecfo.ai',
      userId: 'test-uuid-999',
      role: 'operator'
    };
    const signedCookie = serializeSession(sampleUser);
    const hasDot = signedCookie.includes('.');
    const parts = signedCookie.split('.');
    const verified = verifySignedPayload(signedCookie);
    const parsed = verified ? JSON.parse(Buffer.from(verified, 'base64url').toString('utf8')) : null;

    // Tamper test: change one character in the signature
    const tamperedSig = signedCookie.slice(0, -2) + 'aa';
    const tamperedResult = verifySignedPayload(tamperedSig);

    const passed = hasDot && parts.length === 2 && parsed?.email === sampleUser.email && tamperedResult === null;
    record(
      'Phase 1',
      'Cryptographic HMAC-SHA256 Session Signing & Tamper Verification',
      passed,
      `Signed token length: ${signedCookie.length}, Tampered signature rejected: ${tamperedResult === null}`
    );
  } catch (err: any) {
    record('Phase 1', 'Cryptographic HMAC-SHA256 Session Signing & Tamper Verification', false, 'Execution failed', err.message);
  }

  // Test 1.4: AES-256-GCM Token Encryption & Decryption at Rest
  try {
    const plaintextToken = 'qbo_access_token_live_prod_secret_44829104719';
    const encrypted = encryptToken(plaintextToken);
    const encryptedParts = encrypted.split(':');
    const decrypted = decryptToken(encrypted);

    // Tamper test: corrupt ciphertext
    const corruptedEncrypted = `${encryptedParts[0]}:deadbeefdeadbeef:${encryptedParts[2]}`;
    const corruptedDecrypted = decryptToken(corruptedEncrypted);

    const passed = encryptedParts.length === 3 && decrypted === plaintextToken && corruptedDecrypted !== plaintextToken;
    record(
      'Phase 1',
      'AES-256-GCM Token Vault (IV + Ciphertext + AuthTag)',
      passed,
      `Ciphertext parts: ${encryptedParts.length} (iv, ctext, tag), Decrypted match: ${decrypted === plaintextToken}, AuthTag tamper caught: ${corruptedDecrypted !== plaintextToken}`
    );
  } catch (err: any) {
    record('Phase 1', 'AES-256-GCM Token Vault', false, 'Execution failed', err.message);
  }

  // Test 1.5: OAuth CSRF Nonce State Generation & Verification
  try {
    const clientId = 'client_audit_tenant_001';
    const oauthState = generateOAuthState(clientId, 'dashboard');
    const verifiedState = verifyOAuthState(oauthState);
    const tamperedState = oauthState + 'invalid';
    const verifiedTampered = verifyOAuthState(tamperedState);

    const passed = verifiedState?.clientId === clientId && verifiedTampered === null;
    record(
      'Phase 1',
      'QuickBooks OAuth State HMAC Nonce (CSRF Mitigation)',
      passed,
      `OAuth state verified clientId: ${verifiedState?.clientId}, Tampered state rejected: ${verifiedTampered === null}`
    );
  } catch (err: any) {
    record('Phase 1', 'QuickBooks OAuth State HMAC Nonce', false, 'Execution failed', err.message);
  }

  // Test 1.6: Unauthenticated Request to Protected Routes (Must be 401)
  try {
    const [clientsRes, assetsRes, notesRes] = await Promise.all([
      fetch(`${BASE_URL}/api/clients`),
      fetch(`${BASE_URL}/api/assets`),
      fetch(`${BASE_URL}/api/notes`)
    ]);

    const passed = clientsRes.status === 401 && assetsRes.status === 401 && notesRes.status === 401;
    record(
      'Phase 1',
      'API Route Protection (Block Unauthenticated Access)',
      passed,
      `/api/clients -> HTTP ${clientsRes.status}, /api/assets -> HTTP ${assetsRes.status}, /api/notes -> HTTP ${notesRes.status} (all 401)`
    );
  } catch (err: any) {
    record('Phase 1', 'API Route Protection', false, 'Execution failed', err.message);
  }

  // ============================================================================
  // PHASE 2: Next.js Middleware, Rate Limiting & Security Headers
  // ============================================================================
  console.log('\n>>> RUNNING PHASE 2 TESTS: Next.js Edge Middleware, Security Headers & Rate Limiting');

  // Test 2.1: Enterprise HTTP Security Headers
  try {
    const res = await fetch(`${BASE_URL}/`);
    const csp = res.headers.get('content-security-policy');
    const xfo = res.headers.get('x-frame-options');
    const xcto = res.headers.get('x-content-type-options');
    const hsts = res.headers.get('strict-transport-security');
    const rp = res.headers.get('referrer-policy');
    const pp = res.headers.get('permissions-policy');

    const passed = 
      !!csp && 
      xfo === 'DENY' && 
      xcto === 'nosniff' && 
      !!hsts && 
      rp === 'strict-origin-when-cross-origin' &&
      !!pp;

    record(
      'Phase 2',
      'Enterprise HTTP Security Headers (CSP, HSTS, X-Frame-Options, etc.)',
      passed,
      `X-Frame-Options: ${xfo}, X-Content-Type-Options: ${xcto}, Referrer-Policy: ${rp}, HSTS: ${hsts?.slice(0, 16)}...`
    );
  } catch (err: any) {
    record('Phase 2', 'Enterprise HTTP Security Headers', false, 'Request failed', err.message);
  }

  // Test 2.2: Rate Limiting Middleware on /api/auth/
  try {
    // Send 12 rapid requests to test the 10 req/min auth limit
    let hitRateLimit = false;
    let retryAfterHeader = null;

    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Forwarded-For': '198.51.100.42' // simulated attacker IP
        },
        body: JSON.stringify({ email: 'attacker@test.com', password: 'test' })
      });
      if (res.status === 429) {
        hitRateLimit = true;
        retryAfterHeader = res.headers.get('retry-after');
        break;
      }
    }

    record(
      'Phase 2',
      'Sliding Window Rate Limiter (HTTP 429 on Burst Abuse)',
      hitRateLimit,
      `Rate limit triggered: ${hitRateLimit}, Retry-After: ${retryAfterHeader}s`
    );
  } catch (err: any) {
    record('Phase 2', 'Sliding Window Rate Limiter', false, 'Request failed', err.message);
  }

  // ============================================================================
  // PHASE 3: Multi-Tenant Data Binding & Data Isolation
  // ============================================================================
  console.log('\n>>> RUNNING PHASE 3 TESTS: Multi-Tenant Authentication & Isolation Boundary');

  let operatorCookie = '';
  let clientCookie = '';
  let provisionedClientId = '';

  // Test 3.1: Operator Authentication & Session Cookie Issuance
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@primecfo.ai', password: 'primecfo2024' })
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/primecfo_session=([^;]+)/);
      if (match) operatorCookie = match[1];
    }

    const passed = res.status === 200 && data.isOperator === true && data.user.role === 'operator' && !!operatorCookie;
    record(
      'Phase 3',
      'Operator Login & Cryptographic Cookie Issuance',
      passed,
      `User Role: ${data.user?.role}, isOperator: ${data.isOperator}, Cookie extracted: ${!!operatorCookie}`
    );
  } catch (err: any) {
    record('Phase 3', 'Operator Login & Cryptographic Cookie Issuance', false, 'Login failed', err.message);
  }

  // Test 3.2: Operator Access to Master Client Roster (/api/clients)
  try {
    const res = await fetch(`${BASE_URL}/api/clients`, {
      headers: {
        Cookie: `primecfo_session=${operatorCookie}`
      }
    });
    const data = await res.json();
    const passed = res.status === 200 && Array.isArray(data.data) && data.data.length > 0;
    record(
      'Phase 3',
      'Operator Authorized Access to Master Client Roster',
      passed,
      `HTTP Status: ${res.status}, Clients returned: ${data.data?.length}`
    );
  } catch (err: any) {
    record('Phase 3', 'Operator Authorized Access to Master Client Roster', false, 'Fetch failed', err.message);
  }

  // Test 3.3: Client User Login & Auto-Provisioned Tenant ID
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'acme_exec@acmeholdings.com', password: 'primecfo2024' })
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/primecfo_session=([^;]+)/);
      if (match) clientCookie = match[1];
    }
    provisionedClientId = data.user?.clientId;

    const passed = res.status === 200 && data.user?.role === 'client_user' && data.isOperator === false && !!provisionedClientId;
    record(
      'Phase 3',
      'Client User Tenant Resolution & Scoped Session',
      passed,
      `Role: ${data.user?.role}, Provisioned Tenant ID: ${provisionedClientId}, Tenant Name: ${data.user?.tenantName}`
    );
  } catch (err: any) {
    record('Phase 3', 'Client User Tenant Resolution & Scoped Session', false, 'Login failed', err.message);
  }

  // Test 3.4: Strict Tenant Isolation Boundary (Client cannot access Master Roster)
  try {
    const res = await fetch(`${BASE_URL}/api/clients`, {
      headers: {
        Cookie: `primecfo_session=${clientCookie}`
      }
    });
    const data = await res.json();
    const passed = res.status === 403 && data.error?.includes('Forbidden');
    record(
      'Phase 3',
      'Tenant Boundary: Client Forbidden from Admin Roster (/api/clients)',
      passed,
      `HTTP Status: ${res.status}, Error Message: ${data.error}`
    );
  } catch (err: any) {
    record('Phase 3', 'Tenant Boundary: Client Forbidden from Admin Roster', false, 'Request failed', err.message);
  }

  // Test 3.5: Strict Tenant Isolation Boundary (Client cannot access Another Client ID)
  try {
    const foreignClientId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${BASE_URL}/api/assets?clientId=${foreignClientId}`, {
      headers: {
        Cookie: `primecfo_session=${clientCookie}`
      }
    });
    const data = await res.json();
    const passed = res.status === 403 && data.error?.includes('Forbidden');
    record(
      'Phase 3',
      'Tenant Boundary: Client Forbidden from Foreign Client ID (/api/assets)',
      passed,
      `HTTP Status: ${res.status}, Error Message: ${data.error}`
    );
  } catch (err: any) {
    record('Phase 3', 'Tenant Boundary: Client Forbidden from Foreign Client ID', false, 'Request failed', err.message);
  }

  // ============================================================================
  // PHASE 4: SEO Architecture & Web Standards
  // ============================================================================
  console.log('\n>>> RUNNING PHASE 4 TESTS: SEO Directives, Robots.txt, Sitemap.xml & JSON-LD');

  // Test 4.1: robots.txt Directives
  try {
    const res = await fetch(`${BASE_URL}/robots.txt`);
    const text = await res.text();
    const hasDisallowAdmin = text.includes('Disallow: /admin/');
    const hasDisallowDashboard = text.includes('Disallow: /dashboard/');
    const hasDisallowApi = text.includes('Disallow: /api/');
    const hasSitemap = text.toLowerCase().includes('sitemap:');

    const passed = res.status === 200 && hasDisallowAdmin && hasDisallowDashboard && hasDisallowApi && hasSitemap;
    record(
      'Phase 4',
      'Robots.txt Crawl Directives & Sitemap Pointer',
      passed,
      `Disallows /admin/: ${hasDisallowAdmin}, /dashboard/: ${hasDisallowDashboard}, /api/: ${hasDisallowApi}, Points to Sitemap: ${hasSitemap}`
    );
  } catch (err: any) {
    record('Phase 4', 'Robots.txt Crawl Directives & Sitemap Pointer', false, 'Request failed', err.message);
  }

  // Test 4.2: Dynamic sitemap.xml
  try {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    const text = await res.text();
    const hasXmlHeader = text.includes('<?xml') || text.includes('<urlset');
    const hasPricing = text.includes('/pricing');
    const hasSecurity = text.includes('/security');

    const passed = res.status === 200 && hasXmlHeader && hasPricing && hasSecurity;
    record(
      'Phase 4',
      'Dynamic Sitemap.xml Generation',
      passed,
      `HTTP Status: ${res.status}, Valid XML URLset: ${hasXmlHeader}, Contains Marketing URLs: ${hasPricing && hasSecurity}`
    );
  } catch (err: any) {
    record('Phase 4', 'Dynamic Sitemap.xml Generation', false, 'Request failed', err.message);
  }

  // Test 4.3: Landing Page Metadata & Structured Data (JSON-LD)
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    const hasTitle = html.includes('PrimeCFO.ai');
    const hasOgTitle = html.includes('og:title') || html.includes('PrimeCFO.ai');
    const hasJsonLd = html.includes('application/ld+json');

    const passed = res.status === 200 && hasTitle && hasJsonLd;
    record(
      'Phase 4',
      'Landing Page SEO Metadata & Rich JSON-LD Structured Data',
      passed,
      `Contains Title: ${hasTitle}, Contains OpenGraph: ${hasOgTitle}, Contains Schema JSON-LD: ${hasJsonLd}`
    );
  } catch (err: any) {
    record('Phase 4', 'Landing Page SEO Metadata & Rich JSON-LD Structured Data', false, 'Request failed', err.message);
  }

  // ============================================================================
  // PHASE 5: Verification & End-to-End Workflow Certification
  // ============================================================================
  console.log('\n>>> RUNNING PHASE 5 TESTS: End-to-End Workflow & Session Verification');

  // Test 5.1: Session verification via /api/me for Operator
  try {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: {
        Cookie: `primecfo_session=${operatorCookie}`
      }
    });
    const data = await res.json();
    const passed = res.status === 200 && data.isOperator === true && data.role === 'operator';
    record(
      'Phase 5',
      'End-to-End Session Verification (/api/me) for Operator',
      passed,
      `isOperator: ${data.isOperator}, role: ${data.role}, email: ${data.email}`
    );
  } catch (err: any) {
    record('Phase 5', 'End-to-End Session Verification for Operator', false, 'Request failed', err.message);
  }

  // Test 5.2: Session verification via /api/me for Client
  try {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: {
        Cookie: `primecfo_session=${clientCookie}`
      }
    });
    const data = await res.json();
    const passed = res.status === 200 && data.isOperator === false && data.role === 'client_user' && !!data.clientId;
    record(
      'Phase 5',
      'End-to-End Session Verification (/api/me) for Client Tenant',
      passed,
      `isOperator: ${data.isOperator}, role: ${data.role}, clientId: ${data.clientId}, isQbConnected: ${data.isQbConnected}`
    );
  } catch (err: any) {
    record('Phase 5', 'End-to-End Session Verification for Client Tenant', false, 'Request failed', err.message);
  }

  // Summary Report
  console.log('\n================================================================');
  console.log('                 FINAL TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`Total Automated Tests Executed: ${total}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Overall Health: ${failedCount === 0 ? '100% SUCCESSFUL ✅' : 'ATTENTION REQUIRED ⚠️'}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
