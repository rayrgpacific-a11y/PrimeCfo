import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireOperatorSession } from '@/lib/auth';

// Helper to format Prisma Client entity to the Admin Dashboard Client interface
function formatClient(c: any) {
  return {
    ...c,
    client_id: c.id,
    client_name: c.clientName,
    company_name: c.companyName || '',
    email: c.email,
    phone: c.phone || '',
    is_active: c.isActive,
    tags: c.tags || [],
    notes: c.notes || '',
    client_qbo_connections: (c.qboConnections || []).map((conn: any) => ({
      id: conn.id,
      company_id: conn.companyId,
      customer_id: conn.customerId,
      sync_enabled: conn.syncEnabled,
      status: conn.status
    }))
  };
}

export async function GET() {
  try {
    // Enforce operator-only access to master client roster
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const clients = await prisma.client.findMany({
      include: {
        qboConnections: true
      },
      orderBy: {
        clientName: 'asc'
      }
    });

    const formatted = clients.map(formatClient);

    return NextResponse.json({
      success: true,
      data: formatted,
      count: formatted.length
    });
  } catch (error) {
    console.error('Prisma fetch clients error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Enforce operator-only access to create clients
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();

    if (!body.client_name || !body.email) {
      return NextResponse.json(
        { error: 'Client name and email are required' },
        { status: 400 }
      );
    }

    const newClient = await prisma.client.create({
      data: {
        clientName: body.client_name,
        companyName: body.company_name || null,
        email: body.email.toLowerCase().trim(),
        phone: body.phone || null,
        notes: body.notes || null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        clientType: body.client_type || null,
        isActive: body.is_active ?? true,
        qboCustomerId: body.qbo_customer_id || null,
        ...(body.qbo_company_id ? {
          qboConnections: {
            create: {
              companyId: body.qbo_company_id,
              customerId: body.qbo_customer_id || null,
              realmId: body.qbo_realm_id || null,
              syncEnabled: body.sync_enabled ?? false,
              sandboxMode: body.sandbox_mode ?? false,
              status: body.connection_status || 'pending',
              notes: `Auto-created for ${body.client_name} on ${new Date().toISOString()}`
            }
          }
        } : {})
      },
      include: {
        qboConnections: true
      }
    });

    const formatted = formatClient(newClient);

    return NextResponse.json({
      success: true,
      data: formatted,
      message: 'Client added successfully via Prisma'
    });
  } catch (error: any) {
    console.error('Prisma client creation error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
