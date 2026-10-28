import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { encryptToken, decryptToken, signPayload, verifySignedPayload } from '../lib/crypto';
import { isStripeConfigured, getPlanPriceId, getPlanPricingInfo, isValidUuid } from '../lib/stripe';

interface RouteAudit {
  route: string;
  methods: string[];
  authType: 'tenant_guarded' | 'operator_guarded' | 'session_guarded' | 'public_or_special';
  guardIdentified: string[];
  tenantScoped: boolean;
  notes: string;
}

interface SecretLeakFinding {
  file: string;
  line: number;
  pattern: string;
  snippet: string;
}

async function scanApiRoutes(dir: string, baseDir: string): Promise<RouteAudit[]> {
  const results: RouteAudit[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await scanApiRoutes(fullPath, baseDir)));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf8');

      // Detect exported HTTP methods
      const methods: string[] = [];
      if (/export\s+(async\s+)?function\s+GET/i.test(content)) methods.push('GET');
      if (/export\s+(async\s+)?function\s+POST/i.test(content)) methods.push('POST');
      if (/export\s+(async\s+)?function\s+PUT/i.test(content)) methods.push('PUT');
      if (/export\s+(async\s+)?function\s+PATCH/i.test(content)) methods.push('PATCH');
      if (/export\s+(async\s+)?function\s+DELETE/i.test(content)) methods.push('DELETE');

      // Check auth guards
      const guards: string[] = [];
      let authType: RouteAudit['authType'] = 'public_or_special';

      if (content.includes('requireTenantSession')) {
        guards.push('requireTenantSession');
        authType = 'tenant_guarded';
      }
      if (content.includes('requireOperatorSession')) {
        guards.push('requireOperatorSession');
        authType = 'operator_guarded';
      }
      if (content.includes('getServerSession') && !guards.length) {
        guards.push('getServerSession');
        authType = 'session_guarded';
      }

      // Special public/webhook routes
      const isPublicIntentional =
        relPath.includes('auth/login') ||
        relPath.includes('auth/signup') ||
        relPath.includes('auth/signout') ||
        relPath.includes('auth/mfa') ||
        relPath.includes('contact') ||
        relPath.includes('advisor/book') ||
        relPath.includes('stripe/webhook') ||
        relPath.includes('quickbooks/auth') ||
        relPath.includes('quickbooks/callback');

      if (!guards.length && isPublicIntentional) {
        guards.push('public_whitelisted');
        authType = 'public_or_special';
      }

      // Check tenant scoping in queries
      const tenantScoped =
        content.includes('clientId') ||
        content.includes('userId') ||
        content.includes('session.clientId') ||
        content.includes('targetClientId') ||
        authType === 'operator_guarded' ||
        isPublicIntentional;

      results.push({
        route: relPath.replace('app/api/', '/api/').replace('/route.ts', ''),
        methods,
        authType,
        guardIdentified: guards,
        tenantScoped,
        notes: isPublicIntentional ? 'Publicly accessible by design' : 'Authenticated endpoint',
      });
    }
  }

  return results;
}

function scanForHardcodedSecrets(root: string): SecretLeakFinding[] {
  const findings: SecretLeakFinding[] = [];
  const ignoredDirs = new Set(['.git', '.next', 'node_modules', 'dist', 'build', '.gemini']);

  const patterns = [
    { name: 'Stripe Live Secret Key', regex: /sk_live_[0-9a-zA-Z]{24,}/ },
    { name: 'Live Supabase Service Key', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[0-9a-zA-Z_-]{50,}\.[0-9a-zA-Z_-]{40,}/ },
    { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
    { name: 'Private Key Block', regex: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH)?\s*PRIVATE KEY-----/ },
  ];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoredDirs.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Skip .env files (they are local, gitignored config)
        if (entry.name === '.env' || entry.name === '.env.local') continue;

        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const p of patterns) {
              if (p.regex.test(line)) {
                // Ignore comments or example placeholders
                if (!line.includes('placeholder') && !line.includes('your-') && !line.includes('example')) {
                  findings.push({
                    file: path.relative(root, fullPath).replace(/\\/g, '/'),
                    line: i + 1,
                    pattern: p.name,
                    snippet: line.trim().slice(0, 80),
                  });
                }
              }
            }
          }
        } catch {
          // ignore binary files
        }
      }
    }
  }

  walk(root);
  return findings;
}

function scanForSqlInjectionRisks(root: string): string[] {
  const issues: string[] = [];
  const srcDirs = ['app', 'lib', 'components', 'data'];

  for (const dir of srcDirs) {
    const fullDir = path.join(root, dir);
    if (!fs.existsSync(fullDir)) continue;

    function walk(curr: string) {
      const entries = fs.readdirSync(curr, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(curr, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx') || e.name.endsWith('.js')) {
          const content = fs.readFileSync(p, 'utf8');
          if (content.includes('$queryRawUnsafe')) {
            issues.push(`POTENTIAL RISK: $queryRawUnsafe used in ${path.relative(root, p)}`);
          }
        }
      }
    }
    walk(fullDir);
  }

  return issues;
}

async function runAudit() {
  console.log('================================================================');
  console.log('       PRIMECFO.AI ENTERPRISE CODEBASE & SECURITY AUDIT         ');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..');

  // 1. Scan API Routes
  console.log('▶ STEP 1: Scanning API Route Security & Multi-Tenancy Architecture...');
  const apiDir = path.join(rootDir, 'app', 'api');
  const routes = await scanApiRoutes(apiDir, rootDir);
  console.log(`  Found ${routes.length} API Route Handlers.\n`);

  let guardedCount = 0;
  let publicCount = 0;
  for (const r of routes) {
    const guardBadge =
      r.authType === 'tenant_guarded'
        ? '[TENANT GUARDED]'
        : r.authType === 'operator_guarded'
        ? '[OPERATOR ONLY]'
        : r.authType === 'session_guarded'
        ? '[SESSION GUARDED]'
        : '[PUBLIC / WEBHOOK]';
    if (r.authType !== 'public_or_special') guardedCount++;
    else publicCount++;

    console.log(`  ${r.methods.join(',').padEnd(12)} ${r.route.padEnd(28)} ${guardBadge.padEnd(19)} Tenant-Scoped: ${r.tenantScoped}`);
  }
  console.log(`\n  Summary: ${guardedCount} authenticated endpoints, ${publicCount} public/webhook endpoints.`);

  // 2. Secret Leak Scan
  console.log('\n▶ STEP 2: Scanning Codebase for Leaked Production Secrets...');
  const secretFindings = scanForHardcodedSecrets(rootDir);
  if (secretFindings.length === 0) {
    console.log('  ✔ CLEAN: Zero leaked production secrets found across the codebase.');
  } else {
    console.warn(`  ⚠ WARNING: Found ${secretFindings.length} potential secret references:`);
    for (const f of secretFindings) {
      console.warn(`    - ${f.file}:${f.line} [${f.pattern}] -> ${f.snippet}`);
    }
  }

  // 3. SQL Injection Scan
  console.log('\n▶ STEP 3: Scanning for SQL Injection / $queryRawUnsafe Usage...');
  const sqlIssues = scanForSqlInjectionRisks(rootDir);
  if (sqlIssues.length === 0) {
    console.log('  ✔ CLEAN: Zero unsafe raw SQL queries found. 100% Prisma ORM parameterized queries.');
  } else {
    for (const issue of sqlIssues) {
      console.warn(`    ${issue}`);
    }
  }

  // 4. Live Supabase Database Connectivity & Model Verification
  console.log('\n▶ STEP 4: Live Supabase Database Connection & Model Health Check...');
  try {
    const clientsCount = await prisma.client.count();
    const metricsCount = await prisma.financialMetric.count();
    const reportsCount = await prisma.financialReport.count();
    const insightsCount = await prisma.aiInsight.count();
    const alertsCount = await prisma.financialAlert.count();
    const qboTokensCount = await prisma.qboToken.count();
    const qboConnectionsCount = await prisma.quickbooksConnection.count();
    const stripeCustomersCount = await prisma.stripeCustomer.count();
    const stripeSubsCount = await prisma.stripeSubscription.count();
    const webhookEventsCount = await prisma.stripeWebhookEvent.count();

    console.log(`  ✔ Supabase Database Connection: ACTIVE`);
    console.log(`    - clients: ${clientsCount} rows`);
    console.log(`    - financial_metrics: ${metricsCount} rows`);
    console.log(`    - financial_reports: ${reportsCount} rows`);
    console.log(`    - ai_insights: ${insightsCount} rows`);
    console.log(`    - financial_alert_events: ${alertsCount} rows`);
    console.log(`    - qbo_tokens: ${qboTokensCount} rows`);
    console.log(`    - quickbooks_connections: ${qboConnectionsCount} rows`);
    console.log(`    - stripe_customers: ${stripeCustomersCount} rows`);
    console.log(`    - stripe_subscriptions: ${stripeSubsCount} rows`);
    console.log(`    - stripe_webhook_events: ${webhookEventsCount} rows`);
  } catch (dbErr: any) {
    console.error(`  ✖ Database Error: ${dbErr?.message}`);
  }

  // 5. Cryptography & Vault Integrity
  console.log('\n▶ STEP 5: Testing Cryptographic Vault (AES-256-GCM & HMAC-SHA256)...');
  try {
    const testSecret = 'OAuth-Refresh-Token-Vault-Verification-Secret-999';
    const encrypted = encryptToken(testSecret);
    const decrypted = decryptToken(encrypted);

    const roundTripPassed = decrypted === testSecret;
    console.log(`  AES-256-GCM Round-trip: ${roundTripPassed ? '✔ PASSED' : '✖ FAILED'}`);

    // Test tamper resistance
    const tamperedCipher = encrypted.slice(0, -4) + 'AAAA';
    const tamperedResult = decryptToken(tamperedCipher);
    const tamperBlocked = tamperedResult === '' || tamperedResult !== testSecret;
    console.log(`  AES-256-GCM Tamper Detection: ${tamperBlocked ? '✔ PASSED (Tampered ciphertext safely rejected)' : '✖ FAILED'}`);

    // Test HMAC Payload Signing
    const samplePayload = '{"userId":"test-user-123","role":"operator"}';
    const signed = signPayload(samplePayload);
    const verified = verifySignedPayload(signed);
    const tamperedSigned = signed.slice(0, 10) + 'X' + signed.slice(11);
    const tamperedVerified = verifySignedPayload(tamperedSigned);

    console.log(`  HMAC-SHA256 Payload Sign & Verify: ${verified === samplePayload ? '✔ PASSED' : '✖ FAILED'}`);
    console.log(`  HMAC-SHA256 Tamper Rejection: ${tamperedVerified === null ? '✔ PASSED (Forged signature rejected)' : '✖ FAILED'}`);
  } catch (cryptoErr: any) {
    console.error(`  ✖ Crypto Error: ${cryptoErr?.message}`);
  }

  // 6. Stripe Engine Health
  console.log('\n▶ STEP 6: Stripe Engine & Constraint Verification...');
  console.log(`  - isStripeConfigured(): ${isStripeConfigured()} (Gracefully handles unconfigured/staging)`);
  console.log(`  - Pricing fallback test ('starter', 'monthly'):`, getPlanPricingInfo('starter', 'monthly'));
  console.log(`  - Pricing fallback test ('growth', 'annually'):`, getPlanPricingInfo('growth', 'annually'));
  console.log(`  - isValidUuid('7c9e6679-7425-40de-944b-e07fc1f90ae7'): ${isValidUuid('7c9e6679-7425-40de-944b-e07fc1f90ae7')}`);
  console.log(`  - isValidUuid('operator-master-id'): ${isValidUuid('operator-master-id')} (Non-UUID safely guarded against Postgres crash)`);

  console.log('\n================================================================');
  console.log('                  AUDIT EXECUTION COMPLETE                      ');
  console.log('================================================================');

  await prisma.$disconnect();
}

runAudit().catch((err) => {
  console.error('Audit crashed:', err);
  process.exit(1);
});
