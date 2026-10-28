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

    const client = await prisma.client.findUnique({
      where: { id: targetClientId },
      select: { notes: true, clientName: true, updatedAt: true }
    });

    const notesList = client?.notes ? [{
      id: `note-${targetClientId}`,
      clientId: targetClientId,
      content: client.notes,
      author: 'CFO Lead',
      createdAt: client.updatedAt || new Date()
    }] : [];

    return NextResponse.json({ success: true, data: notesList });
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

    await prisma.client.update({
      where: { id: clientId },
      data: { notes: content.trim() }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: `note-${clientId}`,
        clientId,
        content: content.trim(),
        author: author || 'CFO Lead',
        createdAt: new Date()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save note' },
      { status: 500 }
    );
  }
}
