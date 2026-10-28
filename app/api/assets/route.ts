import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenantSession, requireOperatorSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    const authResult = await requireTenantSession(clientId || undefined);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { session } = authResult;
    const targetClientId = session.role === 'operator' ? (clientId || undefined) : session.clientId;

    if (session.role !== 'operator' && !targetClientId) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    const where = targetClientId
      ? { clientId: targetClientId, reportType: 'capital_asset' }
      : { reportType: 'capital_asset' };

    // Query authentic financial_reports table for capital assets
    const assetReports = await prisma.financialReport.findMany({
      where,
      orderBy: { syncedAt: 'desc' }
    });

    const formattedAssets = assetReports.map((r) => {
      const meta = (r.rawJson as any) || {};
      return {
        id: r.id,
        clientId: r.clientId,
        name: meta.name || 'Enterprise Asset',
        category: meta.category || 'fixed',
        subcategory: meta.subcategory || '',
        purchaseDate: meta.purchaseDate || '',
        purchasePrice: Number(meta.purchasePrice) || 0,
        currentValue: Number(meta.currentValue ?? meta.purchasePrice) || 0,
        depreciationMethod: meta.depreciationMethod || 'straight-line',
        usefulLife: Number(meta.usefulLife) || 5,
        salvageValue: Number(meta.salvageValue) || 0,
        location: meta.location || undefined,
        serialNumber: meta.serialNumber || undefined,
        vendor: meta.vendor || undefined,
        warranty: meta.warranty || undefined,
        status: meta.status || 'active',
        notes: meta.notes || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedAssets
    });
  } catch (error) {
    console.error('Prisma fetch assets error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.clientId) {
      return NextResponse.json(
        { error: 'Asset name and clientId are required' },
        { status: 400 }
      );
    }

    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Check if an asset with this exact name already exists in financial_reports
    const existing = await prisma.financialReport.findFirst({
      where: {
        clientId: body.clientId,
        reportType: 'capital_asset',
      }
    });

    if (existing && (existing.rawJson as any)?.name === body.name) {
      const meta = existing.rawJson as any;
      return NextResponse.json({
        success: true,
        data: {
          id: existing.id,
          clientId: existing.clientId,
          ...meta,
        },
        message: 'Asset already registered'
      });
    }

    // Get or create period in authentic financial_report_periods
    let period = await prisma.financialReportPeriod.findFirst({
      where: { clientId: body.clientId },
      orderBy: { endDate: 'desc' },
    });

    if (!period) {
      period = await prisma.financialReportPeriod.create({
        data: {
          clientId: body.clientId,
          periodType: 'month',
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          label: 'Asset Register Period',
        },
      });
    }

    const assetData = {
      name: body.name.trim(),
      category: body.category || 'fixed',
      subcategory: body.subcategory || null,
      purchaseDate: body.purchaseDate || null,
      purchasePrice: parseFloat(body.purchasePrice) || 0,
      currentValue: parseFloat(body.currentValue ?? body.purchasePrice) || 0,
      depreciationMethod: body.depreciationMethod || 'straight-line',
      usefulLife: parseInt(body.usefulLife) || 5,
      salvageValue: parseFloat(body.salvageValue) || 0,
      location: body.location || null,
      serialNumber: body.serialNumber || null,
      vendor: body.vendor || null,
      warranty: body.warranty || null,
      status: body.status || 'active',
      notes: body.notes || null,
    };

    const createdReport = await prisma.financialReport.create({
      data: {
        clientId: body.clientId,
        periodId: period.id,
        reportType: 'capital_asset',
        source: 'Asset Register',
        rawJson: assetData,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: createdReport.id,
        clientId: createdReport.clientId,
        ...assetData,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Prisma create asset error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database error'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Asset ID is required for update' },
        { status: 400 }
      );
    }

    const existing = await prisma.financialReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const currentMeta = (existing.rawJson as any) || {};
    const updatedMeta = {
      ...currentMeta,
      ...(updateFields.name !== undefined ? { name: updateFields.name.trim() } : {}),
      ...(updateFields.category !== undefined ? { category: updateFields.category } : {}),
      ...(updateFields.subcategory !== undefined ? { subcategory: updateFields.subcategory } : {}),
      ...(updateFields.purchaseDate !== undefined ? { purchaseDate: updateFields.purchaseDate } : {}),
      ...(updateFields.purchasePrice !== undefined ? { purchasePrice: parseFloat(updateFields.purchasePrice) } : {}),
      ...(updateFields.currentValue !== undefined ? { currentValue: parseFloat(updateFields.currentValue) } : {}),
      ...(updateFields.depreciationMethod !== undefined ? { depreciationMethod: updateFields.depreciationMethod } : {}),
      ...(updateFields.usefulLife !== undefined ? { usefulLife: parseInt(updateFields.usefulLife) } : {}),
      ...(updateFields.salvageValue !== undefined ? { salvageValue: parseFloat(updateFields.salvageValue) } : {}),
      ...(updateFields.location !== undefined ? { location: updateFields.location } : {}),
      ...(updateFields.serialNumber !== undefined ? { serialNumber: updateFields.serialNumber } : {}),
      ...(updateFields.vendor !== undefined ? { vendor: updateFields.vendor } : {}),
      ...(updateFields.warranty !== undefined ? { warranty: updateFields.warranty } : {}),
      ...(updateFields.status !== undefined ? { status: updateFields.status } : {}),
      ...(updateFields.notes !== undefined ? { notes: updateFields.notes } : {}),
    };

    const updated = await prisma.financialReport.update({
      where: { id },
      data: {
        rawJson: updatedMeta,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        clientId: updated.clientId,
        ...updatedMeta,
      }
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    console.error('Prisma update asset error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database error'
    }, { status: 500 });
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
      return NextResponse.json(
        { error: 'Asset ID is required for deletion' },
        { status: 400 }
      );
    }

    await prisma.financialReport.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Asset removed successfully'
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }
    console.error('Prisma delete asset error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database error'
    }, { status: 500 });
  }
}
