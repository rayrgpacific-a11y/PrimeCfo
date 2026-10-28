import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, topic, message } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    const cleanName = name.trim().slice(0, 100);
    const cleanEmail = email.trim().toLowerCase().slice(0, 150);
    const cleanTopic = (topic || 'General Inquiry').slice(0, 100);
    const cleanMessage = message.trim().slice(0, 2000);

    // Check if client exists for this email
    const existingClient = await prisma.client.findUnique({
      where: { email: cleanEmail },
    });

    const inquiryNote = `[CONTACT INQUIRY - ${new Date().toISOString()}]\nTopic: ${cleanTopic}\nFrom: ${cleanName} (${cleanEmail})\nMessage: ${cleanMessage}\n`;

    if (existingClient) {
      // Append inquiry to client notes
      await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          notes: existingClient.notes ? `${inquiryNote}\n---\n${existingClient.notes}` : inquiryNote,
        },
      });
    }

    console.log(`📩 Contact inquiry received from ${cleanName} (${cleanEmail}) [${cleanTopic}]`);

    return NextResponse.json({
      success: true,
      message: 'Thank you for reaching out! Our advisory team has received your message and will respond within one business day.',
    });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
