import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession } from '@/lib/auth';

export interface DrillDownRow {
  id: string;
  parentId: string | null;
  name: string;
  amount: number | null;
  formattedAmount: string;
  type: 'section' | 'data' | 'summary';
  depth: number;
  hasChildren: boolean;
}

function parseColAmount(colData: any[]): number | null {
  if (!Array.isArray(colData) || colData.length === 0) return null;
  // Look for the last non-empty column value which represents the total or latest period
  for (let i = colData.length - 1; i >= 1; i--) {
    const val = colData[i]?.value;
    if (val !== undefined && val !== null && val !== '') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function formatCurrency(amount: number | null): string {
  if (amount === null || isNaN(amount)) return '—';
  if (amount < 0) {
    return `($${Math.abs(Math.round(amount)).toLocaleString('en-US')})`;
  }
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

function flattenIntuitRows(
  rows: any[],
  parentId: string | null = null,
  depth: number = 0,
  prefix: string = 'row'
): DrillDownRow[] {
  const result: DrillDownRow[] = [];
  if (!Array.isArray(rows)) return result;

  rows.forEach((row, index) => {
    const currentId = `${prefix}-${depth}-${index}`;

    if (row.type === 'Section') {
      const headerName =
        row.Header?.ColData?.[0]?.value ||
        row.group ||
        'Section';

      const childRows = row.Rows?.Row || [];
      const hasChildren = Array.isArray(childRows) && childRows.length > 0;
      const sectionAmount = parseColAmount(row.Summary?.ColData || row.Header?.ColData || []);

      result.push({
        id: currentId,
        parentId,
        name: headerName,
        amount: sectionAmount,
        formattedAmount: formatCurrency(sectionAmount),
        type: 'section',
        depth,
        hasChildren,
      });

      if (hasChildren) {
        const nested = flattenIntuitRows(childRows, currentId, depth + 1, `${currentId}-c`);
        result.push(...nested);
      }

      // Add summary row if distinct from header
      if (row.Summary && row.Summary.ColData && row.Summary.ColData[0]?.value) {
        const summaryName = row.Summary.ColData[0].value;
        const sumAmount = parseColAmount(row.Summary.ColData);
        result.push({
          id: `${currentId}-summary`,
          parentId: currentId,
          name: summaryName,
          amount: sumAmount,
          formattedAmount: formatCurrency(sumAmount),
          type: 'summary',
          depth: depth + 1,
          hasChildren: false,
        });
      }
    } else if (row.type === 'Data' || (!row.type && row.ColData)) {
      const colData = row.ColData || [];
      const name = colData[0]?.value || 'Uncategorized';
      const amount = parseColAmount(colData);

      result.push({
        id: currentId,
        parentId,
        name,
        amount,
        formattedAmount: formatCurrency(amount),
        type: 'data',
        depth,
        hasChildren: false,
      });
    }
  });

  return result;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedClientId = searchParams.get('clientId');
    const statementType = (searchParams.get('type') || 'pnl').toLowerCase(); // 'pnl' | 'balance_sheet' | 'cash_flow'

    const authResult = await requireTenantSession(requestedClientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    let targetClientId = session.role === 'operator' ? (requestedClientId || session.clientId) : session.clientId;

    if (!targetClientId && session.role === 'operator') {
      const primaryClient = await prisma.client.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      targetClientId = primaryClient?.id;
    }

    const reportRecord = targetClientId
      ? await prisma.financialReport.findFirst({
          where: {
            clientId: targetClientId,
            reportType: statementType,
          },
          orderBy: { syncedAt: 'desc' },
        })
      : null;

    if (!reportRecord || !reportRecord.rawJson) {
      return NextResponse.json({
        success: true,
        data: {
          reportType: statementType,
          header: null,
          rows: [],
          raw: null,
        },
      });
    }

    const raw = reportRecord.rawJson as any;
    const header = raw.Header || {};
    const intuitRows = raw.Rows?.Row || [];
    const flattenedRows = flattenIntuitRows(intuitRows);

    return NextResponse.json({
      success: true,
      data: {
        id: reportRecord.id,
        reportType: statementType,
        syncedAt: reportRecord.syncedAt,
        header: {
          reportName: header.ReportName || statementType.toUpperCase(),
          reportBasis: header.ReportBasis || 'Cash',
          startPeriod: header.StartPeriod || null,
          endPeriod: header.EndPeriod || null,
          currency: header.Currency || 'USD',
        },
        rows: flattenedRows,
      },
    });
  } catch (error) {
    console.error('Fetch statement drill-down error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}
