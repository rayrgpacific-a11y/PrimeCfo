import { quickBooksRequest } from './api';
import { queryAllEntities } from './queryRunner';

type QboAccountDetail = {
  Account?: {
    Id?: string;
    ReconcileInfo?: {
      LastReconciledDate?: string;
      LastReconciledBalance?: string;
    };
  };
};

type QboTxnRow = {
  TxnDate?: string;
};

type CacheEntry = { value: Date | null; expiresAt: number };

/** Short TTL cache so dashboard / insights / DQ don't each re-hit QBO. */
const RECON_CACHE = new Map<string, CacheEntry>();
const RECON_CACHE_TTL_MS = 10 * 60 * 1000;
const RECON_FETCH_TIMEOUT_MS = 12_000;
const ACCOUNT_CONCURRENCY = 5;

function parseTxnDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchReconcilableAccountIds(clientId: string): Promise<string[]> {
  const accounts = await queryAllEntities<{
    Id?: string;
    AccountType?: string;
    Active?: boolean;
  }>(
    clientId,
    `SELECT Id, AccountType, Active FROM Account WHERE AccountType IN ('Bank', 'Credit Card')`,
    'Account'
  );

  return accounts
    .filter((a) => a.Active !== false && a.Id)
    .map((a) => String(a.Id));
}

async function fetchLastReconciledFromAccounts(clientId: string): Promise<Date | null> {
  const accountIds = await fetchReconcilableAccountIds(clientId);
  if (accountIds.length === 0) return null;

  const dates = await mapPool(accountIds, ACCOUNT_CONCURRENCY, async (accountId) => {
    try {
      const res = await quickBooksRequest<QboAccountDetail>(clientId, {
        path: `/v3/company/{realmId}/account/${accountId}`,
      });
      return parseTxnDate(res.Account?.ReconcileInfo?.LastReconciledDate);
    } catch {
      return null;
    }
  });

  let latest: Date | null = null;
  for (const d of dates) {
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}

/** Fallback when ReconcileInfo is missing — race entity types in parallel. */
async function fetchMaxReconciledTxnDate(clientId: string): Promise<Date | null> {
  const entityQueries = [
    `SELECT TxnDate FROM Payment WHERE Reconciled = true ORDERBY TxnDate DESC MAXRESULTS 1`,
    `SELECT TxnDate FROM Deposit WHERE Reconciled = true ORDERBY TxnDate DESC MAXRESULTS 1`,
    `SELECT TxnDate FROM Purchase WHERE Reconciled = true ORDERBY TxnDate DESC MAXRESULTS 1`,
    `SELECT TxnDate FROM BillPayment WHERE Reconciled = true ORDERBY TxnDate DESC MAXRESULTS 1`,
    `SELECT TxnDate FROM Transfer WHERE Reconciled = true ORDERBY TxnDate DESC MAXRESULTS 1`,
    `SELECT TxnDate FROM JournalEntry WHERE Reconciled = true ORDERBY TxnDate DESC MAXRESULTS 1`,
    `SELECT TxnDate FROM Check WHERE Reconciled = true ORDERBY TxnDate DESC MAXRESULTS 1`,
    `SELECT TxnDate FROM CreditCardPayment WHERE Reconciled = true ORDERBY TxnDate DESC MAXRESULTS 1`,
  ];

  const results = await Promise.all(
    entityQueries.map(async (sql) => {
      try {
        const res = await quickBooksRequest<{
          QueryResponse?: Record<string, QboTxnRow[] | QboTxnRow>;
        }>(clientId, {
          path: `/v3/company/{realmId}/query`,
          searchParams: { query: sql },
        });
        const qr = res.QueryResponse;
        if (!qr) return null;
        const key = Object.keys(qr).find((k) => k !== 'maxResults' && k !== 'startPosition');
        if (!key) return null;
        const raw = qr[key];
        const row = Array.isArray(raw) ? raw[0] : raw;
        return parseTxnDate(row?.TxnDate);
      } catch {
        return null;
      }
    })
  );

  let latest: Date | null = null;
  for (const d of results) {
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}

/**
 * Returns the most recent bank/credit-card reconciliation date from QuickBooks.
 * Cached briefly; hard-timeout so dashboard never hangs indefinitely.
 */
export async function fetchLastReconciledDate(clientId: string): Promise<Date | null> {
  const cached = RECON_CACHE.get(clientId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const value = await withTimeout(
      (async () => {
        const fromAccounts = await fetchLastReconciledFromAccounts(clientId);
        if (fromAccounts) return fromAccounts;
        return await fetchMaxReconciledTxnDate(clientId);
      })(),
      RECON_FETCH_TIMEOUT_MS,
      'fetchLastReconciledDate'
    );
    RECON_CACHE.set(clientId, { value, expiresAt: Date.now() + RECON_CACHE_TTL_MS });
    return value;
  } catch (e) {
    console.warn('[reconciliation] fetchLastReconciledDate failed/timed out:', e);
    // Soft-fail: keep serving dashboard with unknown recon rather than hanging
    if (cached) return cached.value;
    RECON_CACHE.set(clientId, { value: null, expiresAt: Date.now() + 60_000 });
    return null;
  }
}

/** Invalidate recon cache after sync so the next load picks up fresh dates. */
export function invalidateReconciliationCache(clientId?: string): void {
  if (clientId) RECON_CACHE.delete(clientId);
  else RECON_CACHE.clear();
}
