import { NextRequest, NextResponse } from 'next/server';
import { guardClientAccess } from '@/lib/auth/clientAccess';
import { buildReportPdfData } from '@/lib/reports/buildReportPdfData';
import { renderReportPdf } from '@/lib/reports/renderReportPdf';
import type { ReportRange } from '@/lib/qbo/reports';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/reports/pdf?clientId=..&range=12m
 * Server-rendered PDF — never generate on the client main thread.
 */
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId');
  const range = (request.nextUrl.searchParams.get('range') ?? '12m') as ReportRange;
  const companyName = request.nextUrl.searchParams.get('companyName') ?? undefined;

  const access = await guardClientAccess(clientId);
  if (!access.ok) return access.response;

  try {
    const data = await buildReportPdfData(access.clientId, range, companyName ?? undefined);
    const pdf = await renderReportPdf(data);
    const safeName = (data.companyName || 'Report').replace(/[^\w\-]+/g, '_').slice(0, 40);
    const filename = `PrimeCFO-${safeName}-${range}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[reports/pdf]', err);
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
