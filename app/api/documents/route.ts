import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession, requireOperatorSession } from '@/lib/auth';

const reportNameMap: Record<string, string> = {
  pnl: 'Profit & Loss Statement (P&L)',
  balance_sheet: 'Balance Sheet Statement',
  cash_flow: 'Statement of Cash Flows',
  coa: 'Chart of Accounts (General Ledger)',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const authResult = await requireTenantSession(clientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const targetClientId = session.role === 'operator' ? (clientId || session.clientId) : session.clientId;

    if (!targetClientId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Query authentic financial_reports table from Supabase
    const reports = await prisma.financialReport.findMany({
      where: { clientId: targetClientId },
      orderBy: { syncedAt: 'desc' },
    });

    const formattedDocs = reports.map((r) => {
      const meta = (r.rawJson as any) || {};
      const customName = meta.name || `${reportNameMap[r.reportType] || r.reportType.toUpperCase() + ' Report'}`;
      const customCode = meta.code || `${r.reportType.toUpperCase()}-${r.id.slice(0, 8)}`;
      const customType = meta.type || reportNameMap[r.reportType] || 'Financial Report';
      const rawStr = JSON.stringify(r.rawJson || {});
      const calcSize = (rawStr.length / 1024).toFixed(1) + ' KB';
      const customSize = meta.size || calcSize;
      const customSource = meta.source || (r.source === 'quickbooks' ? 'QuickBooks Online' : r.source);

      return {
        id: r.id,
        clientId: r.clientId,
        name: customName,
        code: customCode,
        type: customType,
        size: customSize,
        source: customSource,
        fileUrl: meta.fileUrl || '#',
        createdAt: r.syncedAt,
      };
    });

    return NextResponse.json({ success: true, data: formattedDocs });
  } catch (error) {
    console.error('Error fetching documents from authentic financial reports:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { clientId, name, code, type, size, source, fileUrl } = body;

    if (!clientId || !name) {
      return NextResponse.json(
        { error: 'Client ID and document name are required' },
        { status: 400 }
      );
    }

    // Ensure valid report period exists for this client in authentic database
    let period = await prisma.financialReportPeriod.findFirst({
      where: { clientId },
      orderBy: { endDate: 'desc' },
    });

    if (!period) {
      period = await prisma.financialReportPeriod.create({
        data: {
          clientId,
          periodType: 'month',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          label: 'Default Document Period',
        },
      });
    }

    const docCode = code ? code.trim() : `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const docType = type || 'Financial Statement';
    const docSize = size || '1.5 MB';
    const docSource = source || 'Uploaded';
    const docUrl = fileUrl || '#';

    const createdReport = await prisma.financialReport.create({
      data: {
        clientId,
        periodId: period.id,
        reportType: (type || 'custom').toLowerCase().replace(/\s+/g, '_'),
        source: docSource,
        rawJson: {
          name: name.trim(),
          code: docCode,
          type: docType,
          size: docSize,
          source: docSource,
          fileUrl: docUrl,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: createdReport.id,
        clientId: createdReport.clientId,
        name: name.trim(),
        code: docCode,
        type: docType,
        size: docSize,
        source: docSource,
        fileUrl: docUrl,
        createdAt: createdReport.syncedAt,
      },
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to register document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await prisma.financialReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 }
    );
  }
}
