import { pickNumericColValue } from '@/lib/reportUtils';

import { qbMoney } from '@/lib/reporting/parseMonthlyPnL';



type ColDataItem = { value?: string; Value?: string } | Record<string, unknown>;



export type AgingBuckets = {

  total: number;

  current: number;

  days1_30: number;

  days31_60: number;

  days61_90: number;

  days91_plus: number;

};



function colVal(c: ColDataItem | undefined): string {

  if (c == null) return '';

  const v =

    (c as { value?: string | number }).value ?? (c as { Value?: string | number }).Value;

  if (v == null) return '';

  return String(v).trim();

}



function zero(): AgingBuckets {

  return {

    total: 0,

    current: 0,

    days1_30: 0,

    days31_60: 0,

    days61_90: 0,

    days91_plus: 0,

  };

}



/** Normalize QBO column titles: "1 - 30", "91 and over" → comparable keys. */

export function normalizeAgingColTitle(raw: string): string {

  return raw

    .toLowerCase()

    .replace(/\s+/g, '')

    .replace(/andover/g, '+')

    .replace(/days/g, '')

    .replace(/\+/g, '+');

}



function readColTitle(col: Record<string, unknown>): string {

  const t = col.ColTitle;

  if (typeof t === 'string') return t.trim();

  if (t && typeof t === 'object' && 'value' in t) {

    return String((t as { value?: string }).value ?? '').trim();

  }

  return '';

}



type RowsNode = {

  Row?: unknown[];

  Summary?: { ColData?: ColDataItem[] };

};



function countDataRows(rows: RowsNode | undefined): number {

  if (!rows?.Row) return 0;

  let n = 0;

  const walk = (list: unknown[]): void => {

    for (const row of list) {

      const r = row as Record<string, unknown>;

      const type = String(r.type ?? '').toLowerCase();

      if (type === 'data' && Array.isArray(r.ColData)) n++;

      const nested = r.Rows as RowsNode | undefined;

      if (nested?.Row) walk(nested.Row);

    }

  };

  walk(rows.Row);

  return n;

}



function findGrandTotalColData(doc: Record<string, unknown>): ColDataItem[] | null {

  const walk = (rows: RowsNode | undefined): ColDataItem[] | null => {

    if (!rows?.Row) return null;

    for (const row of rows.Row) {

      const r = row as Record<string, unknown>;

      const group = String(r.group ?? '').toLowerCase();



      if (group === 'grandtotal') {

        const summary = (r.Summary as { ColData?: ColDataItem[] } | undefined)?.ColData;

        if (Array.isArray(summary) && summary.length > 1) return summary;

      }



      const colData = r.ColData as ColDataItem[] | undefined;

      const rowType = String(r.type ?? '').toLowerCase();

      if (rowType === 'data' && Array.isArray(colData) && colData.length > 1) {

        const label = colVal(colData[0]).toLowerCase();

        if (label === 'total' || label.startsWith('total ')) return colData;

      }



      const summary = rows.Summary?.ColData;

      if (Array.isArray(summary) && summary.length > 1) {

        const label = colVal(summary[0]).toLowerCase();

        if (label.includes('total')) return summary;

      }



      const nested = r.Rows as RowsNode | undefined;

      const fromNested = walk(nested);

      if (fromNested) return fromNested;

    }

    return null;

  };



  return walk(doc.Rows as RowsNode | undefined);

}



function sumLeafRows(rows: RowsNode | undefined, colCount: number): number[] {

  const sums = new Array(colCount).fill(0) as number[];



  const walk = (list: unknown[]): void => {

    for (const row of list) {

      const r = row as Record<string, unknown>;

      const nested = r.Rows as RowsNode | undefined;

      const rowType = String(r.type ?? '').toLowerCase();

      const group = String(r.group ?? '');



      if (nested?.Row?.length) {

        walk(nested.Row);

        continue;

      }



      if (rowType !== 'data' || group) continue;

      const colData = r.ColData as ColDataItem[] | undefined;

      if (!Array.isArray(colData)) continue;



      for (let i = 1; i < colData.length && i < colCount; i++) {

        const cell = colData[i];

        const rawV = pickNumericColValue(cell ? [cell] : undefined) || colVal(cell);

        sums[i] += qbMoney(rawV);

      }

    }

  };



  if (rows?.Row) walk(rows.Row);

  return sums;

}



function bucketIndex(normHeaders: string[], patterns: RegExp[]): number {

  return normHeaders.findIndex((h) => patterns.some((p) => p.test(h)));

}



/**

 * Parse AR/AP Aging Summary into bucket totals.

 * Handles GrandTotal rows, spaced column titles ("1 - 30"), and "91 and over".

 */

export function parseArAgingBuckets(raw: unknown): AgingBuckets {

  if (!raw || typeof raw !== 'object') return zero();

  const doc = raw as Record<string, unknown>;

  const cols = (doc.Columns as { Column?: Array<Record<string, unknown>> } | undefined)?.Column;

  if (!Array.isArray(cols) || cols.length < 2) return zero();



  const headerTitles = cols.map((c) => readColTitle(c));

  const normHeaders = headerTitles.map(normalizeAgingColTitle);



  const idx = {

    current: bucketIndex(normHeaders, [/^current$/, /^0$/]),

    d30: bucketIndex(normHeaders, [/1.?30/, /1-30/]),

    d60: bucketIndex(normHeaders, [/31.?60/, /31-60/]),

    d90: bucketIndex(normHeaders, [/61.?90/, /61-90/]),

    d91: bucketIndex(normHeaders, [/91/, /over/, /91\+/]),

    total: bucketIndex(normHeaders, [/^total$/]),

  };



  let totalRow = findGrandTotalColData(doc);

  if (!totalRow) {

    const sums = sumLeafRows(doc.Rows as RowsNode | undefined, cols.length);

    if (sums.some((v) => v !== 0)) {

      totalRow = sums.map((v, i) => ({ value: String(v) })) as ColDataItem[];

      totalRow[0] = { value: 'TOTAL' };

    }

  }



  if (!totalRow) return zero();



  const pick = (i: number): number => {

    if (i < 0 || i >= totalRow!.length) return 0;

    const cell = totalRow![i];

    const rawV = pickNumericColValue(cell ? [cell] : undefined) || colVal(cell);

    return qbMoney(rawV);

  };



  const bucketValues = {

    current: idx.current > 0 ? pick(idx.current) : pick(1),

    days1_30: idx.d30 > 0 ? pick(idx.d30) : 0,

    days31_60: idx.d60 > 0 ? pick(idx.d60) : 0,

    days61_90: idx.d90 > 0 ? pick(idx.d90) : 0,

    days91_plus: idx.d91 > 0 ? pick(idx.d91) : 0,

  };



  const sumBuckets =

    bucketValues.current +

    bucketValues.days1_30 +

    bucketValues.days31_60 +

    bucketValues.days61_90 +

    bucketValues.days91_plus;



  const explicitTotal = idx.total > 0 ? pick(idx.total) : 0;

  const total = explicitTotal > 0 ? explicitTotal : sumBuckets;



  return { total, ...bucketValues };

}



/** Diagnostics for sync logging — row count + parsed total. */

export function agingParseDiagnostics(raw: unknown): {

  qboRowCount: number;

  parsedTotal: number;

  buckets: AgingBuckets;

} {

  if (!raw || typeof raw !== 'object') {

    return { qboRowCount: 0, parsedTotal: 0, buckets: zero() };

  }

  const doc = raw as Record<string, unknown>;

  const buckets = parseArAgingBuckets(raw);

  return {

    qboRowCount: countDataRows(doc.Rows as RowsNode | undefined),

    parsedTotal: buckets.total,

    buckets,

  };

}



/** Portion of AR past 30 days: 31-60 + 61-90 + 91+ */

export function arOver30Ratio(b: AgingBuckets): number {

  if (b.total <= 0) return 0;

  const over30 = b.days31_60 + b.days61_90 + b.days91_plus;

  return over30 / b.total;

}

