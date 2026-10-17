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
    // Scoped strictly to client if caller is not an operator
    const targetClientId = session.role === 'operator' ? (clientId || undefined) : session.clientId;

    const where = targetClientId ? { clientId: targetClientId } : {};

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const formattedAssets = assets.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      subcategory: a.subcategory || '',
      purchaseDate: a.purchaseDate || '',
      purchasePrice: a.purchasePrice,
      currentValue: a.currentValue,
      depreciationMethod: a.depreciationMethod,
      usefulLife: a.usefulLife,
      salvageValue: a.salvageValue,
      location: a.location || undefined,
      serialNumber: a.serialNumber || undefined,
      vendor: a.vendor || undefined,
      warranty: a.warranty || undefined,
      status: a.status,
      notes: a.notes || undefined,
    }));

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

    // Only operators can add assets to any client portfolio
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Check if an asset with this exact name already exists for this client (idempotency)
    const existing = await prisma.asset.findFirst({
      where: {
        clientId: body.clientId,
        name: body.name
      }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Asset already registered'
      });
    }

    const asset = await prisma.asset.create({
      data: {
        clientId: body.clientId,
        name: body.name,
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
        notes: body.notes || null
      }
    });

    return NextResponse.json({
      success: true,
      data: asset,
      message: 'Asset recorded successfully'
    });
  } catch (error) {
    console.error('Prisma create asset error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create asset' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Only operators can update capital assets
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name: body.name,
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
      },
    });

    return NextResponse.json({
      success: true,
      data: asset,
      message: 'Asset updated successfully',
    });
  } catch (error) {
    console.error('Prisma update asset error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update asset' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Only operators can delete assets
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    await prisma.asset.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Prisma delete asset error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete asset' },
      { status: 500 }
    );
  }
}
