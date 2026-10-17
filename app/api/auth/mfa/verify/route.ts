import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { factorId, code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit authentication code' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('primecfo_session', JSON.stringify({
      email: 'verified@primecfo.ai',
      userId: factorId || 'mfa-verified-user',
      isOperator: true,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'MFA verification failed' },
      { status: 500 }
    );
  }
}
