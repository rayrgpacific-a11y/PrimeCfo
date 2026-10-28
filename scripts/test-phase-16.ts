/**
 * Automated Verification Test Suite for Phase 16:
 * Marketing Site & Pricing Parity + Frictionless Onboarding Funnel
 */
import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();

async function runPhase16Tests() {
  console.log('================================================================');
  console.log('  PrimeCFO.ai — Automated Verification Test Suite (Phase 16)');
  console.log(`  Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, evidence: string) {
    if (condition) {
      console.log(`[✅ PASS] ${testName}`);
      console.log(`         Evidence: ${evidence}`);
      passed++;
    } else {
      console.error(`[❌ FAIL] ${testName}`);
      console.error(`         Evidence: ${evidence}`);
      failed++;
    }
  }

  // Test 1: Verify Homepage HTML has zero raw /connect links for pricing cards
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    const hasStarterSignup = html.includes('/signup?plan=starter');
    const hasSeeSignup = html.includes('/signup?plan=see');
    const hasUnderstandSignup = html.includes('/signup?plan=understand');
    const hasActSignup = html.includes('/signup?plan=act');
    const hasRawConnectPricing = html.includes('href="/connect?plan=');

    assert(
      hasStarterSignup && hasSeeSignup && hasUnderstandSignup && hasActSignup && !hasRawConnectPricing,
      '[Phase 16] Homepage Pricing Cards Route to /signup?plan=',
      `Starter: ${hasStarterSignup}, See: ${hasSeeSignup}, Understand: ${hasUnderstandSignup}, Act: ${hasActSignup}, Raw /connect eliminated: ${!hasRawConnectPricing}`
    );
  } catch (err: any) {
    assert(false, '[Phase 16] Homepage Pricing Cards Route to /signup?plan=', err.message);
  }

  // Test 2: Verify /pricing HTML has Social Proof, 4-column Decision Guide, and /signup CTAs
  try {
    const res = await fetch(`${BASE_URL}/pricing`);
    const html = await res.text();
    const hasTrustBanner = html.includes('Trusted By Small Businesses') || html.includes('TRUSTED BY SMALL BUSINESSES');
    const hasDecisionGuide = html.includes('Not sure which tier is right?');
    const hasComparisonTable = html.includes('Detailed Feature Comparison');
    const hasPricingCardSignup = html.includes('/signup?plan=');
    const hasDecisionPills = html.includes('Starter — $53/mo billed annually') && html.includes('Understand — $314/mo billed annually');

    assert(
      hasTrustBanner && hasDecisionGuide && hasComparisonTable && hasPricingCardSignup && hasDecisionPills,
      '[Phase 16] Dedicated /pricing Page Parity with Live Site',
      `Trust Banner: ${hasTrustBanner}, Decision Guide: ${hasDecisionGuide}, 4-Col Pills: ${hasDecisionPills}, Signup CTAs: ${hasPricingCardSignup}`
    );
  } catch (err: any) {
    assert(false, '[Phase 16] Dedicated /pricing Page Parity with Live Site', err.message);
  }

  // Test 3: Sign up with plan=understand and verify database persistence
  const testEmail = `trial_${Date.now()}@primecfodemo.com`;
  const testPassword = 'StrongPassword123!';

  try {
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        plan: 'understand'
      })
    });

    const signupData = await signupRes.json();
    const dbClient = await prisma.client.findUnique({
      where: { email: testEmail }
    });

    const hasCorrectPlan = dbClient?.clientType === 'UNDERSTAND';
    const hasCorrectTags = dbClient?.tags.includes('understand') && dbClient?.tags.includes('14-day-trial');

    assert(
      signupRes.status === 200 && signupData.ok && hasCorrectPlan && !!hasCorrectTags,
      '[Phase 16] Signup API Auto-Provisions Tenant with Plan Tier & Trial Tags',
      `HTTP Status: ${signupRes.status}, clientType: ${dbClient?.clientType}, tags: ${JSON.stringify(dbClient?.tags)}`
    );

    // Clean up test record
    if (dbClient) {
      await prisma.client.delete({ where: { id: dbClient.id } }).catch(() => {});
    }
  } catch (err: any) {
    assert(false, '[Phase 16] Signup API Auto-Provisions Tenant with Plan Tier & Trial Tags', err.message);
  }

  // Test 4: Navbar and Landing CTA routes to /signup
  try {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    const hasGetStartedSignup = html.includes('href="/signup"');

    assert(
      hasGetStartedSignup,
      '[Phase 16] Navbar & Bottom CTA "Get Started" Links to /signup',
      `Contains href="/signup": ${hasGetStartedSignup}`
    );
  } catch (err: any) {
    assert(false, '[Phase 16] Navbar & Bottom CTA "Get Started" Links to /signup', err.message);
  }

  console.log('\n================================================================');
  console.log('                 FINAL TEST EXECUTION SUMMARY');
  console.log('================================================================');
  console.log(`Total Automated Tests Executed: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Overall Health: ${failed === 0 ? '100% SUCCESSFUL ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('================================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runPhase16Tests().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
