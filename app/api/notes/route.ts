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
    const targetClientId = session.role === 'operator' ? clientId : session.clientId;

    if (!targetClientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    const notes = await prisma.advisoryNote.findMany({
      where: { clientId: targetClientId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Only operators can compose advisory notes
    const authResult = await requireOperatorSession();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { clientId, content, author } = body;

    if (!clientId || !content) {
      return NextResponse.json(
        { error: 'Client ID and content are required' },
        { status: 400 }
      );
    }

    const note = await prisma.advisoryNote.create({
      data: {
        clientId,
        content,
        author: author || 'CFO Lead'
      }
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save note' },
      { status: 500 }
    );
  }
}
