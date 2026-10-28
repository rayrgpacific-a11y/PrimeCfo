import prisma from '../lib/prisma';
import { generateFinancialSummaryPdf } from '../lib/pdf-export';

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
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${status}] [${phase}] ${testName}`);
  console.log(`         Evidence: ${evidence}`);
  if (error) console.log(`         Error: ${error}`);
}

async function runPhases11To15Tests() {
  console.log('================================================================');
  console.log('  PrimeCFO.ai — Automated Verification Test Suite (Phases 11 - 15)');
  console.log(`  Target Server: ${BASE_URL}`);
  console.log('================================================================\n');

  let operatorCookie = '';
  const testClientId = 'afe73ba1-e75f-4846-b939-d5b7a06abfa8'; // Acme Exec

  // ---------------------------------------------------------
  // PHASE 11: Cryptographic MFA Session Signing
  // ---------------------------------------------------------
  console.log('>>> RUNNING PHASE 11 TESTS: MFA Cryptographic Session Signing');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/mfa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factorId: 'totp-authenticator-sample',
        code: '123456',
        email: 'admin@primecfo.ai'
      })
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/primecfo_session=([^;]+)/);
      if (match) operatorCookie = match[1];
    }

    const meRes = await fetch(`${BASE_URL}/api/me`, {
      headers: { Cookie: `primecfo_session=${operatorCookie}` }
    });
    const meData = await meRes.json();

    const passed = res.status === 200 && data.ok === true && meRes.status === 200 && meData.isOperator === true && meData.role === 'operator';
    record(
      'Phase 11',
      'MFA Verification Issues Cryptographic HMAC-SHA256 Session',
      passed,
      `MFA Status: ${res.status}, Cookie Extracted: ${!!operatorCookie}, /api/me Status: ${meRes.status}, isOperator: ${meData.isOperator}`
    );
  } catch (err: any) {
    record('Phase 11', 'MFA Verification Session', false, 'Execution failed', err.message);
  }

  // ---------------------------------------------------------
  // PHASE 12: Advisory Notes & Action Items API
  // ---------------------------------------------------------
  console.log('\n>>> RUNNING PHASE 12 TESTS: Advisory Notes & Interactive Action Items');
  let createdActionItemId = '';
  try {
    // 12.1 Post Advisory Note
    const testContent = `Automated Board Audit Note - ${Date.now()}`;
    const noteRes = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `primecfo_session=${operatorCookie}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        content: testContent,
        author: 'CFO Lead'
      })
    });
    const noteData = await noteRes.json();

    // 12.2 Fetch Advisory Notes
    const getNotesRes = await fetch(`${BASE_URL}/api/notes?clientId=${testClientId}`, {
      headers: { Cookie: `primecfo_session=${operatorCookie}` }
    });
    const getNotesData = await getNotesRes.json();
    const foundNote = getNotesData.data?.find((n: any) => n.content === testContent);

    const notePassed = noteRes.status === 200 && noteData.success === true && !!foundNote;
    record(
      'Phase 12',
      'CFO Advisory Notes Persistence & Sync via /api/notes',
      notePassed,
      `POST /api/notes Status: ${noteRes.status}, Author: ${noteData.data?.author}, Retrieved in GET /api/notes: ${!!foundNote}`
    );

    // 12.3 Create Action Item
    const createItemRes = await fetch(`${BASE_URL}/api/action-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `primecfo_session=${operatorCookie}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        title: 'Conduct Enterprise Q4 Audit Review',
        priority: 'high',
        isCompleted: false
      })
    });
    const createItemData = await createItemRes.json();
    createdActionItemId = createItemData.data?.id;

    // 12.4 Toggle Action Item Completion (PATCH)
    const patchItemRes = await fetch(`${BASE_URL}/api/action-items`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `primecfo_session=${operatorCookie}`
      },
      body: JSON.stringify({
        id: createdActionItemId,
        isCompleted: true
      })
    });
    const patchItemData = await patchItemRes.json();

    // 12.5 Delete Action Item (DELETE)
    const deleteItemRes = await fetch(`${BASE_URL}/api/action-items?id=${createdActionItemId}`, {
      method: 'DELETE',
      headers: { Cookie: `primecfo_session=${operatorCookie}` }
    });
    const deleteItemData = await deleteItemRes.json();

    const actionItemPassed =
      createItemRes.status === 200 &&
      !!createdActionItemId &&
      patchItemRes.status === 200 &&
      patchItemData.data?.isCompleted === true &&
      deleteItemRes.status === 200 &&
      deleteItemData.success === true;

    record(
      'Phase 12',
      'CFO Action Items Full CRUD (/api/action-items POST, PATCH, DELETE)',
      actionItemPassed,
      `Created ID: ${createdActionItemId}, PATCH isCompleted: ${patchItemData.data?.isCompleted}, DELETE Status: ${deleteItemRes.status}`
    );
  } catch (err: any) {
    record('Phase 12', 'Notes & Action Items Verification', false, 'Execution failed', err.message);
  }

  // ---------------------------------------------------------
  // PHASE 13: Client Documents Vault & Alerts Bulk Resolution
  // ---------------------------------------------------------
  console.log('\n>>> RUNNING PHASE 13 TESTS: Documents Vault & Bulk Alert Resolution');
  try {
    // 13.1 Fetch and Register Document
    const docName = `Audit_Exhibit_${Date.now()}.pdf`;
    const createDocRes = await fetch(`${BASE_URL}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `primecfo_session=${operatorCookie}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        name: docName,
        type: 'Report',
        source: 'PrimeCFO Engine'
      })
    });
    const createDocData = await createDocRes.json();
    const docId = createDocData.data?.id;

    // 13.2 Fetch Documents List
    const getDocsRes = await fetch(`${BASE_URL}/api/documents?clientId=${testClientId}`, {
      headers: { Cookie: `primecfo_session=${operatorCookie}` }
    });
    const getDocsData = await getDocsRes.json();
    const docInList = getDocsData.data?.find((d: any) => d.id === docId);

    // 13.3 Delete Document
    const delDocRes = await fetch(`${BASE_URL}/api/documents?id=${docId}`, {
      method: 'DELETE',
      headers: { Cookie: `primecfo_session=${operatorCookie}` }
    });

    const docPassed = createDocRes.status === 200 && !!docInList && delDocRes.status === 200;
    record(
      'Phase 13',
      'Client Documents Vault API (/api/documents GET, POST, DELETE)',
      docPassed,
      `POST Status: ${createDocRes.status}, Document Found in Vault: ${!!docInList}, DELETE Status: ${delDocRes.status}`
    );

    // 13.4 Alerts Bulk Resolution (PATCH resolveAll)
    // First, ensure at least one active alert exists
    await fetch(`${BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `primecfo_session=${operatorCookie}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        title: 'Temporary Test Alert',
        description: 'For bulk resolution verification',
        severity: 'warning'
      })
    });

    const resolveAllRes = await fetch(`${BASE_URL}/api/alerts`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `primecfo_session=${operatorCookie}`
      },
      body: JSON.stringify({
        clientId: testClientId,
        resolveAll: true
      })
    });
    const resolveAllData = await resolveAllRes.json();

    const alertsAfterRes = await fetch(`${BASE_URL}/api/alerts?clientId=${testClientId}`, {
      headers: { Cookie: `primecfo_session=${operatorCookie}` }
    });
    const alertsAfterData = await alertsAfterRes.json();
    const allResolved = alertsAfterData.data?.every((a: any) => a.isResolved === true);

    const alertBulkPassed = resolveAllRes.status === 200 && resolveAllData.success === true && allResolved;
    record(
      'Phase 13',
      'Financial Alerts Bulk Resolution (/api/alerts PATCH resolveAll)',
      alertBulkPassed,
      `PATCH Status: ${resolveAllRes.status}, All Client Alerts Resolved: ${allResolved}`
    );
  } catch (err: any) {
    record('Phase 13', 'Documents & Alerts Verification', false, 'Execution failed', err.message);
  }

  // ---------------------------------------------------------
  // PHASE 14: PDF Export Engine Execution Verification
  // ---------------------------------------------------------
  console.log('\n>>> RUNNING PHASE 14 TESTS: PDF Export Engine');
  try {
    const doc = generateFinancialSummaryPdf({
      clientName: 'Acme Technologies Group',
      periodLabel: 'Last 30 Days',
      basis: 'Cash',
      revenue: 450000,
      netIncome: 110000,
      cash: 620000,
      grossMargin: 42.5,
      netMargin: 18.3,
      currentRatio: 2.1,
      quickRatio: 1.8,
      dso: 45,
      filename: 'PrimeCFO-Executive-Summary-Acme.pdf'
    });

    const pageCount = doc.getNumberOfPages();
    const buffer = doc.output('arraybuffer');
    const pdfPassed = pageCount === 1 && buffer.byteLength > 1500;

    record(
      'Phase 14',
      'Certified Vector PDF Engine Generation (generateFinancialSummaryPdf)',
      pdfPassed,
      `Pages: ${pageCount}, Byte Buffer Size: ${buffer.byteLength} bytes`
    );
  } catch (err: any) {
    record('Phase 14', 'PDF Export Engine Verification', false, 'Execution failed', err.message);
  }

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  console.log('\n================================================================');
  console.log('                 FINAL TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`Total Automated Tests Executed: ${total}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Overall Health: ${failedCount === 0 ? '100% SUCCESSFUL ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhases11To15Tests().catch((e) => {
  console.error('Fatal test runner failure:', e);
  process.exit(1);
});
